# TryOn.ai - AI-Powered Virtual Try-On

A proof-of-concept application that allows users to virtually try on clothes using AI. Users can upload their photos and product images, then generate realistic try-on results using Google's Gemini 2.0 Flash API.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Database**: SQLite with SQLAlchemy
- **AI**: Google Gemini 2.5 Flash + Gemini 2.5 Flash Image Preview (Nano Banana)
- **Storage**: Local filesystem

## Features

1. **User Photo Upload**: Upload full-body photos for virtual try-on
2. **Product Management**: Upload and manage product photos with names
3. **AI Try-On Generation**: Generate realistic try-on images using Gemini AI
4. **Real-time Preview**: Preview uploaded images before processing
5. **Session Management**: Track try-on sessions and results

## Project Structure

```
TryOn-POC/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # SQLAlchemy models and database setup
│   ├── models.py            # Pydantic request/response models
│   ├── storage.py           # File storage utilities
│   ├── gemini_client.py     # Gemini AI integration
│   ├── requirements.txt     # Python dependencies
│   └── env.example          # Environment variables template
├── frontend/
│   ├── app/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main application page
│   ├── components/
│   │   ├── FileUpload.tsx   # File upload component
│   │   ├── ImagePreview.tsx # Image preview component
│   │   └── LoadingSpinner.tsx # Loading spinner
│   ├── lib/
│   │   └── api.ts           # API client functions
│   ├── package.json         # Node.js dependencies
│   ├── tailwind.config.js   # Tailwind configuration
│   └── next.config.js       # Next.js configuration
└── README.md                # This file
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 18+
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env and add your Gemini API key
   ```

5. Run the backend server:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Users
- `POST /users` - Create a new user
- `GET /users/{user_id}` - Get user by ID

### Products
- `POST /upload-product-photo` - Upload product photo and create product
- `GET /products` - Get all products
- `GET /products/{product_id}` - Get product by ID

### User Photos
- `POST /upload-user-photo` - Upload user photo

### Try-On
- `POST /tryon` - Generate try-on image
- `GET /tryon/{session_id}` - Get try-on session result

### System
- `GET /health` - Health check and API status

## Usage

1. **Upload Your Photo**: Upload a full-body photo of yourself
2. **Upload Product Photo**: Upload a product image with a descriptive name
3. **Select Product**: Choose from your uploaded products
4. **Generate Virtual Try-On**: Click "Try On" to generate realistic results using Gemini 2.5 Flash Image Preview (Nano Banana)
5. **View Result**: See the AI-generated virtual try-on where the clothing appears naturally worn

## File Storage

Images are stored in the following structure:
```
storage/
├── users/
│   └── {user_id}/
│       └── photos/
│           └── {timestamp}_user.jpg
├── products/
│   └── {product_id}/
│       └── {timestamp}_product.jpg
└── results/
    └── {session_id}/
        └── output.png
```

## Database Schema

### Users
- `id`: Primary key
- `name`: Optional user name
- `created_at`: Timestamp

### Products
- `id`: Primary key
- `name`: Product name
- `filepath`: Path to product image
- `created_at`: Timestamp

### TryOnSessions
- `id`: Primary key
- `user_id`: Foreign key to users
- `product_id`: Foreign key to products
- `input_user_photo_path`: Path to user photo
- `input_product_photo_path`: Path to product photo
- `output_image_path`: Path to generated result
- `created_at`: Timestamp

## Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Development

### Backend Development
- The backend uses FastAPI with automatic API documentation at `/docs`
- SQLite database is created automatically on first run
- Static files are served from the `/static` endpoint

### Frontend Development
- Built with Next.js 14 and TypeScript
- Uses Tailwind CSS for styling
- Includes drag-and-drop file upload functionality
- Responsive design for mobile and desktop

## Database Management

The project includes comprehensive database management tools:

### Quick Management (Interactive)
```bash
cd backend
./manage_db.sh
```

### Manual Commands
```bash
cd backend

# Show database statistics
python3 format_database.py stats

# Verify all file paths exist
python3 format_database.py verify

# Fix filepath formats
python3 format_database.py fix

# Clean orphaned sessions
python3 format_database.py clean

# Create backup
python3 format_database.py backup

# Reset database (WARNING: Deletes all data!)
python3 format_database.py reset
```

See `backend/DATABASE_MANAGEMENT.md` for detailed documentation.

## Troubleshooting

1. **Gemini API Issues**: Ensure your API key is valid and has access to Gemini 2.0 Flash
2. **File Upload Issues**: Check file size limits and supported formats
3. **Database Issues**: Delete `tryon.db` to reset the database
4. **Port Conflicts**: Change ports in the respective configuration files

## License

This is a proof-of-concept project for demonstration purposes.
