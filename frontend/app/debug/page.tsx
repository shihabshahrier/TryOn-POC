'use client';

import React, { useState, useEffect } from 'react';

export default function DebugPage() {
    const [status, setStatus] = useState<string>('Loading...');
    const [user, setUser] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const testAPI = async () => {
            try {
                // Test health endpoint
                const healthResponse = await fetch('/api/health');
                const healthData = await healthResponse.json();
                setStatus(`Health: ${healthData.status}, Gemini: ${healthData.gemini_api}`);

                // Test user creation
                const userResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Debug User' })
                });
                const userData = await userResponse.json();
                setUser(userData);

                // Test products endpoint
                const productsResponse = await fetch('/api/products');
                const productsData = await productsResponse.json();
                setProducts(productsData);

            } catch (error) {
                setStatus(`Error: ${error}`);
            }
        };

        testAPI();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">API Status:</h2>
                    <p>{status}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">User:</h2>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Products:</h2>
                    <pre>{JSON.stringify(products, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
