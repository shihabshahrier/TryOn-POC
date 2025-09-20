# TryOn.ai Frontend

Next.js frontend for the TryOn.ai virtual try-on application.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Features

- **Drag & Drop Upload**: Easy file upload with visual feedback
- **Image Preview**: Preview uploaded images before processing
- **Product Management**: Upload and select from product catalog
- **Real-time Status**: API health monitoring
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Dropzone**: Drag-and-drop file uploads
- **Axios**: HTTP client for API calls

## Project Structure

```
frontend/
├── app/
│   ├── globals.css      # Global styles and Tailwind imports
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Main application page
├── components/
│   ├── FileUpload.tsx   # Drag-and-drop file upload
│   ├── ImagePreview.tsx # Image preview with fallback
│   └── LoadingSpinner.tsx # Loading indicator
├── lib/
│   └── api.ts           # API client functions
└── package.json         # Dependencies and scripts
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Configuration

The frontend is configured to proxy API requests to the backend:
- Backend URL: http://localhost:8000
- API requests are automatically proxied via Next.js rewrites

## Components

### FileUpload
Drag-and-drop file upload component with:
- Image file validation
- File size limits
- Visual feedback for drag states
- Customizable styling

### ImagePreview
Image display component with:
- Error handling and fallback
- Responsive sizing
- Loading states

### LoadingSpinner
Reusable loading indicator with multiple sizes.

## API Integration

All API calls are centralized in `lib/api.ts`:
- User management
- Product upload and selection
- Try-on generation
- Health monitoring

## Styling

Uses Tailwind CSS with custom configuration:
- Primary color scheme
- Responsive grid layouts
- Custom upload area styling
- Consistent spacing and typography
