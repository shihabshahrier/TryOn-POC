# TryOn.ai Backend

FastAPI backend for the TryOn.ai virtual try-on application.

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp env.example .env
   # Add your Gemini API key to .env
   ```

3. Run the server:
   ```bash
   python main.py
   ```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Dependencies

- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `sqlalchemy`: Database ORM
- `python-multipart`: File upload support
- `pillow`: Image processing
- `google-generativeai`: Gemini AI integration
- `python-dotenv`: Environment variable management

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

## Database

The application uses SQLite with the following tables:
- `users`: User information
- `products`: Product catalog
- `tryon_sessions`: Try-on session tracking

Database file: `tryon.db` (created automatically)
