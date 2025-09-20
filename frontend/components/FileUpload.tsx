'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function FileUpload({
  onFileSelect,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
  children
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxSize,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-area ${isDragActive ? 'dragover' : ''} ${isDragReject ? 'border-red-500' : ''} ${className}`}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to select a file
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Supports: JPG, PNG, GIF, BMP, WebP (max 10MB)
          </p>
        </div>
      )}
    </div>
  );
}

