'use client';

import React from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export default function ImagePreview({ 
  src, 
  alt, 
  className = '', 
  fallbackText = 'No image available' 
}: ImagePreviewProps) {
  const [imageError, setImageError] = React.useState(false);

  if (imageError || !src) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{fallbackText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

