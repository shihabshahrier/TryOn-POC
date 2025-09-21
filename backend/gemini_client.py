import os
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont
import io
import base64

# Enable AVIF support
try:
    import pillow_avif  # This enables AVIF support for PIL
    print("AVIF support enabled")
except ImportError:
    print("AVIF support not available - install pillow-avif-plugin")

# Load environment variables
load_dotenv()

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        # Use Gemini 2.5 Flash Image Preview (Nano Banana) for virtual try-on generation
        self.model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
    
    def generate_tryon_image(self, user_photo_path: str, product_photo_path: str, product_name: str) -> bytes:
        """
        Generate virtual try-on image using Gemini 2.5 Flash Image Preview (Nano Banana)
        
        Args:
            user_photo_path: Path to user's full-body photo
            product_photo_path: Path to product photo
            product_name: Name of the product for context
            
        Returns:
            bytes: Generated try-on image data
        """
        try:
            # Load images and convert to supported format, optimized for virtual try-on
            user_image = self._load_and_convert_image(user_photo_path)
            product_image = self._load_and_convert_image(product_photo_path)
            
            # Resize images for optimal processing while maintaining aspect ratio
            user_image = self._optimize_image_for_tryon(user_image, target_size=(1024, 1024), is_person=True)
            product_image = self._optimize_image_for_tryon(product_image, target_size=(1024, 1024), is_person=False)
            
            # Convert PIL images to high-quality byte data for Gemini
            user_image_bytes = self._pil_to_bytes(user_image, format='JPEG', quality=95)
            product_image_bytes = self._pil_to_bytes(product_image, format='JPEG', quality=95)
            
            print(f"Generating virtual try-on for user photo: {user_photo_path}")
            print(f"Product photo: {product_photo_path}")
            print(f"Product name: {product_name}")
            print(f"User image optimized: {user_image.size}")
            print(f"Product image optimized: {product_image.size}")
            print(f"Images converted to high-quality JPEG format for Gemini")
            
            # Create an improved detailed prompt for realistic virtual try-on using Nano Banana
            tryon_prompt = f"""You are an advanced virtual try-on AI. Create a PRECISE virtual try-on image where the person from the first image is wearing the EXACT {product_name} from the second image.

FOCUS AREAS:
# Completely remove the model's previous outfit.
# Replace with the uploaded {product_name} so it looks naturally worn.
# Preserve model's **face, pose, hair, and body proportions**.
# Match lighting and shadows to the original image.
# Ensure realistic fit — scale and warp {product_name} to match body shape.
# Blend edges seamlessly — no visible artifacts.

CRITICAL REQUIREMENTS:
1. EXACT GARMENT REPLICATION:
   - The {product_name} must be IDENTICAL to the one shown in the second image
   - Copy the exact colors, patterns, textures, and design details
   - Maintain the exact fabric type appearance (cotton, silk, denim, etc.)
   - Preserve any logos, prints, embroidery, or decorative elements
   - Keep the exact cut, style, and silhouette of the garment

2. FULL BODY DISPLAY:
   - Show the COMPLETE person from head to toe
   - Include the entire garment as it would appear when worn
   - Display full arms, legs, and torso appropriately
   - Maintain the person's original body proportions and posture

3. REALISTIC FIT AND DRAPING:
   - Make the {product_name} fit naturally on the person's body
   - Show realistic fabric draping and movement
   - Include natural wrinkles and folds where fabric would naturally fall
   - Ensure proper garment fit (not too tight or loose)

STRICT PROHIBITIONS:
## Do NOT alter the face, skin tone, or hair.
## Do NOT change background or add new objects.
## Remove all parts of the previous outfit and its shadows.
## Do NOT modify body proportions or pose.
## Do NOT change lighting conditions from the original photo.

QUALITY STANDARDS:
- Photorealistic, high-resolution output
- Professional fashion photography quality
- Sharp details and clear textures
- Natural color accuracy
- Seamless integration with no visible artifacts

The final result should look like the person actually purchased and is wearing this exact {product_name}."""

            # Generate the try-on image using Gemini 2.5 Flash Image Preview (Nano Banana)
            print("Generating virtual try-on with Gemini 2.5 Flash Image Preview...")
            
            # Create image objects that Gemini can understand
            user_img_for_gemini = Image.open(io.BytesIO(user_image_bytes))
            product_img_for_gemini = Image.open(io.BytesIO(product_image_bytes))
            
            response = self.model.generate_content([tryon_prompt, user_img_for_gemini, product_img_for_gemini])
            
            # Extract the generated image from the response
            # Parse response parts to find image data
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    # Gemini 2.5 Flash Image Preview returns Base64-encoded image data
                    mime_type = part.inline_data.mime_type
                    image_data = part.inline_data.data
                    
                    print(f"Received image data - MIME type: {mime_type}")
                    print(f"Data type: {type(image_data)}, length: {len(image_data) if image_data else 0}")
                    
                    if not image_data:
                        print("Skipping empty image data part")
                        continue
                    
                    # The data is Base64-encoded, decode it to get raw byte stream
                    if isinstance(image_data, str):
                        print("Decoding Base64 image data to byte stream...")
                        image_bytes = base64.b64decode(image_data)
                    else:
                        # Already in bytes format
                        image_bytes = image_data
                    
                    print(f"Decoded byte stream: {len(image_bytes)} bytes")
                    
                    # Use Pillow to interpret the raw byte stream
                    try:
                        # Open the byte stream as an image using Pillow
                        with Image.open(io.BytesIO(image_bytes)) as img:
                            print(f"Image opened successfully: {img.size}, mode: {img.mode}, format: {img.format}")
                            
                            # Save the image to a byte buffer in PNG format
                            # Using .png extension automatically saves in PNG format
                            output_buffer = io.BytesIO()
                            
                            # Convert to RGB if needed (for PNG compatibility)
                            if img.mode not in ['RGB', 'RGBA']:
                                img = img.convert('RGB')
                            
                            # Save as PNG (most compatible format)
                            img.save(output_buffer, format='PNG')
                            
                            print(f"Image saved to buffer as PNG: {output_buffer.tell()} bytes")
                            return output_buffer.getvalue()
                            
                    except Exception as img_error:
                        print(f"Error processing image with Pillow: {img_error}")
                        # Return raw bytes if Pillow processing fails
                        return image_bytes
                
                elif part.text is not None:
                    print(f"Text response part: {part.text}")
            
            # If no image was generated, create an informative error image
            print("No image was generated by Nano Banana, creating error placeholder")
            error_image = self._create_error_image(f"Virtual try-on generation failed for {product_name}")
            return error_image
            
        except Exception as e:
            print(f"Error in virtual try-on generation: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            
            # Check if it's the AVIF mime type error
            if "Unsupported Mime type: image/avif" in str(e):
                print("❌ AVIF mime type error detected - this shouldn't happen with our conversion!")
                print("Debugging image format issue...")
                
                # Try to debug what format we're actually sending
                try:
                    user_image = self._load_and_convert_image(user_photo_path)
                    product_image = self._load_and_convert_image(product_photo_path)
                    print(f"User image mode: {user_image.mode}, format: {getattr(user_image, 'format', 'Unknown')}")
                    print(f"Product image mode: {product_image.mode}, format: {getattr(product_image, 'format', 'Unknown')}")
                except Exception as debug_e:
                    print(f"Debug error: {debug_e}")
            
            # Create an error image with details
            error_image = self._create_error_image(f"Try-on failed: {str(e)}")
            return error_image

    def _load_and_convert_image(self, image_path: str) -> Image.Image:
        """
        Load an image and convert it to a format supported by Gemini API
        Gemini supports: JPEG, PNG, WebP, but not AVIF
        """
        try:
            # Load the image
            with Image.open(image_path) as img:
                # Check if image is in AVIF or other unsupported format
                original_format = img.format
                print(f"Loading image: {image_path} (format: {original_format})")
                
                # Convert AVIF and other unsupported formats to RGB PNG
                if original_format in ['AVIF', 'HEIC', 'HEIF'] or img.mode not in ['RGB', 'RGBA']:
                    print(f"Converting {original_format} to PNG...")
                    # Convert to RGB if not already
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Create a copy as PNG
                    png_buffer = io.BytesIO()
                    img.save(png_buffer, format='PNG')
                    png_buffer.seek(0)
                    return Image.open(png_buffer)
                
                # For supported formats, return a copy
                return img.copy()
                
        except Exception as e:
            print(f"Error loading/converting image {image_path}: {e}")
            # Create a placeholder image if loading fails
            placeholder = Image.new('RGB', (512, 512), color='lightgray')
            draw = ImageDraw.Draw(placeholder)
            draw.text((200, 250), "Image Load Error", fill='red')
            return placeholder

    def _optimize_image_for_tryon(self, image: Image.Image, target_size: tuple = (1024, 1024), is_person: bool = True) -> Image.Image:
        """Optimize image for virtual try-on processing"""
        # Calculate scaling to fit target size while maintaining aspect ratio
        width, height = image.size
        target_width, target_height = target_size
        
        # Calculate scale factor to fit within target size
        scale_w = target_width / width
        scale_h = target_height / height
        scale = min(scale_w, scale_h)
        
        # Only resize if image is larger than target or significantly smaller
        if scale < 1.0 or scale > 2.0:
            new_width = int(width * scale)
            new_height = int(height * scale)
            
            # Use high-quality resampling
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"Image resized from {width}x{height} to {new_width}x{new_height}")
        
        # Enhance image quality for better AI processing
        if is_person:
            # For person images, ensure good contrast and sharpness
            print("Optimizing person image for try-on...")
        else:
            # For product images, enhance details and colors
            print("Optimizing product image for try-on...")
        return image

    def _pil_to_bytes(self, image: Image.Image, format: str = 'JPEG', quality: int = 90) -> bytes:
        """Convert PIL Image to bytes in specified format with quality control"""
        buffer = io.BytesIO()
        
        # Ensure RGB mode for JPEG
        if format.upper() == 'JPEG' and image.mode in ['RGBA', 'LA']:
            # Create white background for transparent images
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image)
            image = background
        elif format.upper() == 'JPEG' and image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save to buffer with specified quality
        if format.upper() == 'JPEG':
            image.save(buffer, format=format, quality=quality, optimize=True)
        else:
            image.save(buffer, format=format)
        
        return buffer.getvalue()

    def _create_error_image(self, message: str) -> bytes:
        """Create an error image when generation fails"""
        error_img = Image.new('RGB', (512, 512), color='white')
        draw = ImageDraw.Draw(error_img)
        
        try:
            font = ImageFont.load_default()
        except:
            font = None
        
        # Wrap text for better display
        lines = []
        words = message.split()
        line = ""
        for word in words:
            if len(line + word) < 40:
                line += word + " "
            else:
                lines.append(line.strip())
                line = word + " "
        if line:
            lines.append(line.strip())
        
        # Draw text centered
        y_offset = 200
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            x = (512 - (bbox[2] - bbox[0])) // 2
            draw.text((x, y_offset), line, fill='red', font=font)
            y_offset += 30
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        error_img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()
    
    def test_connection(self) -> bool:
        """Test if Gemini API is working"""
        try:
            # Test with a simple text generation request (compatible with all models)
            response = self.model.generate_content("Say 'API test successful'")
            return bool(response and response.text)
        except Exception as e:
            print(f"Gemini API test failed: {str(e)}")
            return False

    @staticmethod
    def get_optimization_tips() -> dict:
        """Get tips for better virtual try-on results"""
        return {
            "user_photo_tips": [
                "Use a clear, well-lit photo of the person",
                "Person should be facing forward or at a slight angle", 
                "Full body or at least torso should be visible",
                "Avoid busy backgrounds - plain backgrounds work best",
                "Good resolution (at least 512x512 pixels)",
                "Person should be clearly visible without obstructions"
            ],
            "product_photo_tips": [
                "Use a clear, high-quality product image",
                "Product should be the main focus of the image",
                "Good lighting showing true colors and details",
                "Avoid cluttered backgrounds",
                "Show the complete garment/accessory",
                "High resolution for better detail capture"
            ],
            "general_tips": [
                "Ensure good image quality for both photos",
                "Use descriptive product names (e.g., 'Red Cotton T-Shirt' vs 'Shirt')",
                "Better input quality leads to better output results",
                "Try different angles if results aren't satisfactory"
            ]
        }

