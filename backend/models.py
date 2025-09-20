from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Request models
class UserCreate(BaseModel):
    name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str

class ProductResponse(BaseModel):
    id: int
    name: str
    filepath: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TryOnRequest(BaseModel):
    user_id: int
    product_id: int

class TryOnResponse(BaseModel):
    session_id: int
    output_image_url: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TryOnSessionResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    input_user_photo_path: str
    input_product_photo_path: str
    output_image_path: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

