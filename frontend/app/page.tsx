'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import ImagePreview from '@/components/ImagePreview';
import LoadingSpinner from '@/components/LoadingSpinner';

// Types
interface User {
  id: number;
  name?: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  image_url: string;
  created_at: string;
}

interface TryOnResponse {
  session_id: number;
  output_image_url: string;
  created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState<string | null>(null);
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
    setUserPhotoPreview(URL.createObjectURL(file));
  };

  const handleProductPhotoSelect = (file: File) => {
    setProductPhoto(file);
    setProductPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadUserPhoto = async () => {
    if (!user || !userPhoto) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', userPhoto);
      formData.append('user_id', user.id.toString());

      const response = await fetch('/api/upload-user-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload user photo');

      const uploadedPhoto = await response.json();
      setUserId(user.id);
      console.log('User photo uploaded:', uploadedPhoto);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload user photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadProductPhoto = async () => {
    if (!productPhoto || !productName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', productPhoto);
      formData.append('name', productName.trim());

      const response = await fetch('/api/upload-product-photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload product photo');

      const uploadedProduct = await response.json();
      setProductId(uploadedProduct.id);
      console.log('Product uploaded:', uploadedProduct);

      // Reload products list
      const productsResponse = await fetch('/api/products');
      const productsList = await productsResponse.json();
      setProducts(productsList);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload product photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryOn = async () => {
    if (!userId || !productId) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, product_id: productId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Try-on failed');
      }

      const tryOnResult = await response.json();
      setResult(tryOnResult);
      console.log('Try-on successful:', tryOnResult);
    } catch (err) {
      console.error('Try-on failed:', err);
      setError(err instanceof Error ? err.message : 'Try-on failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setUserPhoto(null);
    setProductPhoto(null);
    setUserPhotoPreview(null);
    setProductPhotoPreview(null);
    setProductName('');
    setUserId(null);
    setProductId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">TryOn.ai</h1>
            <p className="text-lg text-gray-600">Virtual Try-On with AI-Powered Precision</p>
          </div>

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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* User Photo Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">👤 Step 1: Your Photo</h2>

              <FileUpload onFileSelect={handleUserPhotoSelect}>
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-12 h-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Upload Your Photo</p>
                    <p className="text-sm text-gray-500">Full-body photo works best</p>
                    <p className="text-xs text-gray-400 mt-2">Clear lighting, front-facing preferred</p>
                  </div>
                </div>
              </FileUpload>

              {userPhotoPreview && (
                <div className="mt-4">
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={userPhotoPreview}
                      alt="Your photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 mt-2">✅ Photo uploaded successfully</p>
                </div>
              )}

              {userPhoto && (
                <div className="mt-4">
                  <button
                    onClick={handleUploadUserPhoto}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium"
                  >
                    {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Save Photo
                  </button>
                </div>
              )}
            </div>

            {/* Product Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">👗 Step 2: Choose Product</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Blue Cotton T-Shirt, Red Silk Saree"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <FileUpload onFileSelect={handleProductPhotoSelect}>
                  <div className="space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Upload Product</p>
                      <p className="text-sm text-gray-500">Clear product image</p>
                      <p className="text-xs text-gray-400 mt-2">High quality, well-lit recommended</p>
                    </div>
                  </div>
                </FileUpload>

                {productPhotoPreview && (
                  <div className="mt-4">
                    <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={productPhotoPreview}
                        alt="Product photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-2">✅ Product image ready</p>
                  </div>
                )}

                {productPhoto && productName && (
                  <button
                    onClick={handleUploadProductPhoto}
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center font-medium"
                  >
                    {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Save Product
                  </button>
                )}
              </div>
            </div>

            {/* Try-On Result Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">✨ Step 3: Try-On Result</h2>

              {!result ? (
                <div className="aspect-[3/4] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">Try-on result will appear here</p>
                    <p className="text-xs text-gray-400 mt-2">Upload photos and try on!</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] relative rounded-lg overflow-hidden border-2 border-green-200">
                  <img
                    src={`/api${result.output_image_url}`}
                    alt="Try-on result"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Try-On Action */}
          <div className="text-center">
            <button
              onClick={handleTryOn}
              disabled={!userId || !productId || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto text-lg font-semibold shadow-lg transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="md" className="mr-3" />
                  Generating Your Try-On...
                </>
              ) : (
                '✨ Try It On!'
              )}
            </button>

            {(!userId || !productId) && (
              <p className="mt-3 text-sm text-gray-500">
                {!userId ? '👆 Please upload your photo first' : '👆 Please upload a product photo'}
              </p>
            )}
          </div>

          {/* Result Display */}
          {result && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-6 text-center">🎉 Your Virtual Try-On Result</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Original Photo */}
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-3 text-gray-700">Your Original Photo</h3>
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={userPhotoPreview || ''}
                      alt="Your original photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Product Photo */}
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-3 text-gray-700">Product</h3>
                  <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={productPhotoPreview || ''}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2 font-medium">{productName}</p>
                </div>

                {/* Try-On Result */}
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-3 text-green-700">✨ Try-On Result</h3>
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden border-2 border-green-200">
                    <img
                      src={`/api${result.output_image_url}`}
                      alt="Try-on result"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex justify-center space-x-3">
                    <a
                      href={`/api${result.output_image_url}`}
                      download="tryon-result.png"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      📥 Download
                    </a>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'My Virtual Try-On Result',
                            url: `${window.location.origin}/api${result.output_image_url}`
                          }).catch(() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api${result.output_image_url}`);
                            alert('Link copied to clipboard!');
                          });
                        } else {
                          navigator.clipboard.writeText(`${window.location.origin}/api${result.output_image_url}`);
                          alert('Link copied to clipboard!');
                        }
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      🔗 Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Try Another Button */}
              <div className="text-center mt-8">
                <button
                  onClick={resetForm}
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 font-medium"
                >
                  🔄 Try Another Look
                </button>
              </div>
            </div>
          )}

          {/* Product Selection from Existing */}
          {products.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📦 Or Select from Existing Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setProductId(product.id)}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-colors ${productId === product.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }`}
                  >
                    <div className="aspect-square relative rounded-lg overflow-hidden mb-2">
                      <img
                        src={`/api${product.image_url}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-center">{product.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">💡 Tips for Best Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">📸</div>
                <p className="font-medium">Clear Photo</p>
                <p className="text-gray-600">Use good lighting and stand straight</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">👕</div>
                <p className="font-medium">Product Quality</p>
                <p className="text-gray-600">High-resolution product images work best</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <p className="font-medium">Full Body</p>
                <p className="text-gray-600">Full-body photos give the most accurate results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}