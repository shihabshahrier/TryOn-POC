import os
import time
from pathlib import Path
from PIL import Image
import uuid
from io import BytesIO

# Enable AVIF support
try:
    import pillow_avif  # This enables AVIF support for PIL
    print("AVIF support enabled in storage")
except ImportError:
    print("AVIF support not available in storage")

# Storage configuration
STORAGE_ROOT = Path("./storage")
USERS_DIR = STORAGE_ROOT / "users"
PRODUCTS_DIR = STORAGE_ROOT / "products"
RESULTS_DIR = STORAGE_ROOT / "results"

def ensure_directories():
    """Create storage directories if they don't exist"""
    for directory in [STORAGE_ROOT, USERS_DIR, PRODUCTS_DIR, RESULTS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)

def normalize_filename(timestamp: int, file_type: str, extension: str = "jpg") -> str:
    """Generate normalized filename: <timestamp>_<type>.<extension>"""
    return f"{timestamp}_{file_type}.{extension}"

def convert_to_supported_format(file_content: bytes) -> bytes:
    """Convert image to a web-supported format (JPEG) if needed"""
    try:
        with Image.open(BytesIO(file_content)) as img:
            # Check if it's AVIF or other unsupported format
            original_format = img.format
            print(f"Image format detected: {original_format}")
            
            if original_format in ['AVIF', 'HEIC', 'HEIF']:
                print(f"Converting {original_format} to JPEG...")
                
                # Convert to RGB if needed
                if img.mode in ['RGBA', 'LA']:
                    # Create white background for transparent images
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Save as JPEG
                output_buffer = BytesIO()
                img.save(output_buffer, format='JPEG', quality=90)
                return output_buffer.getvalue()
            
            # For supported formats, return original
            return file_content
            
    except Exception as e:
        print(f"Error converting image format: {e}")
        return file_content

def save_user_photo(user_id: int, file_content: bytes, original_filename: str) -> str:
    """Save user photo and return the filepath"""
    ensure_directories()
    
    # Convert to supported format if needed
    converted_content = convert_to_supported_format(file_content)
    
    # Create user-specific directory
    user_dir = USERS_DIR / str(user_id) / "photos"
    user_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate normalized filename
    timestamp = int(time.time())
    filename = normalize_filename(timestamp, "user")
    filepath = user_dir / filename
    
    # Save the file
    with open(filepath, "wb") as f:
        f.write(converted_content)
    
    # Return relative path from storage root
    return str(filepath.relative_to(STORAGE_ROOT))

def save_product_photo(file_content: bytes, original_filename: str) -> tuple[int, str]:
    """Save product photo and return (product_id, filepath)"""
    ensure_directories()
    
    # Convert to supported format if needed
    converted_content = convert_to_supported_format(file_content)
    
    # Generate product ID (using timestamp for simplicity)
    product_id = int(time.time())
    
    # Create product-specific directory
    product_dir = PRODUCTS_DIR / str(product_id)
    product_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate normalized filename
    timestamp = int(time.time())
    filename = normalize_filename(timestamp, "product")
    filepath = product_dir / filename
    
    # Save the file
    with open(filepath, "wb") as f:
        f.write(converted_content)
    
    # Return relative path from storage root
    return product_id, str(filepath.relative_to(STORAGE_ROOT))

def save_result_image(session_id: int, image_data: bytes) -> str:
    """Save result image and return the filepath"""
    ensure_directories()
    
    # Create session-specific directory
    session_dir = RESULTS_DIR / str(session_id)
    session_dir.mkdir(parents=True, exist_ok=True)
    
    # Save the result image
    filepath = session_dir / "output.png"
    with open(filepath, "wb") as f:
        f.write(image_data)
    
    # Return relative path from storage root
    return str(filepath.relative_to(STORAGE_ROOT))

def get_file_extension(filename: str) -> str:
    """Extract file extension from filename"""
    return filename.split('.')[-1].lower()

def validate_image_file(file_content: bytes) -> bool:
    """Validate that the uploaded file is a valid image"""
    try:
        from io import BytesIO
        Image.open(BytesIO(file_content))
        return True
    except Exception:
        return False

