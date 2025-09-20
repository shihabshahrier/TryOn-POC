from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
from pathlib import Path

from database import get_db, create_tables, User, Product, TryOnSession
from models import UserCreate, UserResponse, ProductResponse, TryOnRequest, TryOnResponse, TryOnSessionResponse
from storage import save_user_photo, save_product_photo, save_result_image, validate_image_file
from gemini_client import GeminiClient

# Create FastAPI app
app = FastAPI(title="TryOn.ai API", version="1.0.0")

# Create database tables
create_tables()

# Mount static files for serving images
storage_path = Path("./storage")
if storage_path.exists():
    app.mount("/static", StaticFiles(directory="storage"), name="static")
else:
    # Create storage directory if it doesn't exist
    storage_path.mkdir(exist_ok=True)
    app.mount("/static", StaticFiles(directory="storage"), name="static")

# Initialize Gemini client
try:
    gemini_client = GeminiClient()
    print("Gemini client initialized successfully")
except Exception as e:
    print(f"Failed to initialize Gemini client: {e}")
    gemini_client = None

@app.get("/")
async def root():
    return {"message": "TryOn.ai API is running"}

@app.get("/health")
async def health_check():
    gemini_status = gemini_client.test_connection() if gemini_client else False
    return {
        "status": "healthy",
        "gemini_api": "connected" if gemini_status else "disconnected"
    }

# User endpoints
@app.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = User(name=user_data.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Product endpoints
@app.post("/upload-product-photo", response_model=ProductResponse)
async def upload_product_photo(
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload product photo and create product record"""
    # Validate file
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    file_content = await file.read()
    
    # Validate image
    if not validate_image_file(file_content):
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Save product photo
    product_id, filepath = save_product_photo(file_content, file.filename)
    
    # Create product record
    db_product = Product(id=product_id, name=name, filepath=filepath)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    return db_product

@app.get("/products", response_model=List[ProductResponse])
async def get_products(db: Session = Depends(get_db)):
    """Get all products"""
    products = db.query(Product).all()
    return products

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# User photo upload
@app.post("/upload-user-photo")
async def upload_user_photo(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload user photo"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    file_content = await file.read()
    
    # Validate image
    if not validate_image_file(file_content):
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Save user photo
    filepath = save_user_photo(user_id, file_content, file.filename)
    
    return {"user_id": user_id, "filepath": filepath}

# Try-on endpoints
@app.post("/tryon", response_model=TryOnResponse)
async def try_on(
    tryon_request: TryOnRequest,
    db: Session = Depends(get_db)
):
    """Generate try-on image"""
    print(f"Try-on request received: user_id={tryon_request.user_id}, product_id={tryon_request.product_id}")
    
    if not gemini_client:
        print("Gemini API not available")
        raise HTTPException(status_code=500, detail="Gemini API not available")
    
    # Get user and product
    user = db.query(User).filter(User.id == tryon_request.user_id).first()
    if not user:
        print(f"User {tryon_request.user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    product = db.query(Product).filter(Product.id == tryon_request.product_id).first()
    if not product:
        print(f"Product {tryon_request.product_id} not found")
        raise HTTPException(status_code=404, detail="Product not found")
    
    print(f"Found user: {user.id}, product: {product.id} ({product.name})")
    
    # Find the most recent user photo (simplified - in production, you might want to specify which photo)
    user_photos_dir = Path(f"./storage/users/{user.id}/photos")
    print(f"Looking for user photos in: {user_photos_dir}")
    
    if not user_photos_dir.exists():
        print(f"User photos directory does not exist: {user_photos_dir}")
        raise HTTPException(status_code=400, detail="No user photos found")
    
    user_photo_files = list(user_photos_dir.glob("*.jpg"))
    print(f"Found user photo files: {user_photo_files}")
    
    if not user_photo_files:
        print("No JPG files found in user photos directory")
        raise HTTPException(status_code=400, detail="No user photos found")
    
    # Use the most recent user photo
    user_photo_path = str(max(user_photo_files, key=os.path.getctime))
    
    # Convert to relative path from storage root for database storage
    user_photo_relative = str(Path(user_photo_path).relative_to(Path("./storage")))
    
    # Create try-on session record
    db_session = TryOnSession(
        user_id=tryon_request.user_id,
        product_id=tryon_request.product_id,
        input_user_photo_path=user_photo_relative,
        input_product_photo_path=product.filepath
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    try:
        # Generate try-on image using Gemini
        # Convert relative paths to full paths for file access
        full_user_photo_path = str(Path("./storage") / user_photo_relative)
        full_product_photo_path = str(Path("./storage") / product.filepath)
        
        result_image_data = gemini_client.generate_tryon_image(
            full_user_photo_path, 
            full_product_photo_path, 
            product.name
        )
        
        # Save result image
        output_path = save_result_image(db_session.id, result_image_data)
        
        # Update session with output path
        db_session.output_image_path = output_path
        db.commit()
        
        # Generate URL for the result image - use relative path for URL
        output_url = f"/static/{output_path}"
        
        return TryOnResponse(
            session_id=db_session.id,
            output_image_url=output_url,
            created_at=db_session.created_at
        )
        
    except Exception as e:
        print(f"Try-on generation failed: {str(e)}")
        # If generation fails, still return the session but without output
        return TryOnResponse(
            session_id=db_session.id,
            output_image_url="",
            created_at=db_session.created_at
        )

@app.get("/tryon/{session_id}", response_model=TryOnSessionResponse)
async def get_tryon_result(session_id: int, db: Session = Depends(get_db)):
    """Get try-on session result"""
    session = db.query(TryOnSession).filter(TryOnSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Try-on session not found")
    return session

@app.get("/static/{file_path:path}")
async def serve_static_file(file_path: str):
    """Serve static files"""
    file_location = Path("storage") / file_path
    if file_location.exists() and file_location.is_file():
        return FileResponse(file_location)
    else:
        raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

