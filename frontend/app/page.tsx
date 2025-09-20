'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import ImagePreview from '@/components/ImagePreview';
import LoadingSpinner from '@/components/LoadingSpinner';
// import { 
//   createUser, 
//   uploadUserPhoto, 
//   uploadProductPhoto, 
//   getProducts, 
//   tryOn, 
//   healthCheck,
//   User,
//   Product,
//   TryOnResponse
// } from '@/lib/api';

// Temporary types
interface User {
  id: number;
  name?: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  filepath: string;
  created_at: string;
}

interface TryOnResponse {
  session_id: number;
  output_image_url: string;
  created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string>('');
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<{ status: string; gemini_api: string } | null>(null);

  // Check API health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const status = await response.json();
        setApiStatus(status);
      } catch (err) {
        console.error('Health check failed:', err);
        setApiStatus({ status: 'unhealthy', gemini_api: 'disconnected' });
      }
    };
    checkHealth();
  }, []);

  // Create user on component mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Anonymous User' })
        });
        const newUser = await response.json();
        setUser(newUser);
      } catch (err) {
        console.error('Failed to create user:', err);
        setError('Failed to initialize user');
      }
    };
    initializeUser();
  }, []);

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const productsList = await response.json();
        setProducts(productsList);
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    };
    loadProducts();
  }, []);

  const handleUserPhotoSelect = (file: File) => {
    setUserPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProductPhotoSelect = (file: File) => {
    setProductPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadUserPhoto = async () => {
    if (!user || !userPhoto) return;

    try {
      setIsLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('user_id', user.id.toString());
      formData.append('file', userPhoto);

      const response = await fetch('/api/upload-user-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      alert('User photo uploaded successfully!');
    } catch (err) {
      console.error('Failed to upload user photo:', err);
      setError('Failed to upload user photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadProductPhoto = async () => {
    if (!productPhoto || !productName.trim()) {
      setError('Please provide both product photo and name');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('name', productName);
      formData.append('file', productPhoto);

      const response = await fetch('/api/upload-product-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const newProduct = await response.json();
      setProducts(prev => [...prev, newProduct]);
      setSelectedProduct(newProduct);
      setProductName('');
      setProductPhoto(null);
      setProductPhotoPreview('');
      alert('Product uploaded successfully!');
    } catch (err) {
      console.error('Failed to upload product:', err);
      setError('Failed to upload product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryOn = async () => {
    if (!user || !selectedProduct) {
      setError('Please upload user photo and select a product');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_id: selectedProduct.id
        })
      });

      if (!response.ok) {
        throw new Error('Try-on generation failed');
      }

      const tryOnResult = await response.json();
      setResult(tryOnResult);
    } catch (err) {
      console.error('Failed to generate try-on:', err);
      setError('Failed to generate try-on image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* API Status */}
      {apiStatus && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">System Status</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${apiStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">API: {apiStatus.status}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${apiStatus.gemini_api === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Gemini: {apiStatus.gemini_api}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* User Photo Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">1. Upload Your Photo</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <FileUpload onFileSelect={handleUserPhotoSelect}>
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Upload Your Photo</p>
                  <p className="text-sm text-gray-500">Full-body photo works best</p>
                </div>
              </div>
            </FileUpload>
            {userPhoto && (
              <div className="mt-4">
                <button
                  onClick={handleUploadUserPhoto}
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                  Upload Photo
                </button>
              </div>
            )}
          </div>
          <div>
            <ImagePreview
              src={userPhotoPreview}
              alt="User photo preview"
              className="h-64"
              fallbackText="Upload your photo to see preview"
            />
          </div>
        </div>
      </div>

      {/* Product Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">2. Upload Product Photo</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Blue T-Shirt, Red Saree"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <FileUpload onFileSelect={handleProductPhotoSelect}>
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Upload Product Photo</p>
                  <p className="text-sm text-gray-500">Clear product image</p>
                </div>
              </div>
            </FileUpload>
            {productPhoto && productName && (
              <button
                onClick={handleUploadProductPhoto}
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Upload Product
              </button>
            )}
          </div>
          <div>
            <ImagePreview
              src={productPhotoPreview}
              alt="Product photo preview"
              className="h-64"
              fallbackText="Upload product photo to see preview"
            />
          </div>
        </div>
      </div>

      {/* Product Selection */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">3. Select Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${selectedProduct?.id === product.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="aspect-square mb-2">
                  <ImagePreview
                    src={`/api/static/${product.filepath}`}
                    alt={product.name}
                    className="w-full h-full"
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Try On Button */}
      {user && selectedProduct && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">4. Generate Try-On</h2>
          <button
            onClick={handleTryOn}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center text-lg font-medium"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating Try-On...
              </>
            ) : (
              'Try On'
            )}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Try-On Result</h2>
          <div className="flex justify-center">
            <ImagePreview
              src={`/api${result.output_image_url}`}
              alt="Try-on result"
              className="max-w-md w-full h-auto"
              fallbackText="Result image not available"
            />
          </div>
        </div>
      )}
    </div>
  );
}

