'use client';

import React, { useState, useEffect } from 'react';

export default function TestPage() {
    const [status, setStatus] = useState('Loading...');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const testAPI = async () => {
            try {
                console.log('Testing API...');

                // Test health endpoint
                const healthResponse = await fetch('/api/health');
                console.log('Health response:', healthResponse);
                const healthData = await healthResponse.json();
                console.log('Health data:', healthData);
                setStatus(`Health: ${healthData.status}`);

                // Test user creation
                console.log('Creating user...');
                const userResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Test User' })
                });
                console.log('User response:', userResponse);
                const userData = await userResponse.json();
                console.log('User data:', userData);
                setUser(userData);

            } catch (error) {
                console.error('Error:', error);
                setStatus(`Error: ${error}`);
            }
        };

        testAPI();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Status:</h2>
                    <p>{status}</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">User:</h2>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Console Logs:</h2>
                    <p>Check browser console for detailed logs</p>
                </div>
            </div>
        </div>
    );
}
