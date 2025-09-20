'use client';

import React, { useState, useEffect } from 'react';

export default function WorkingPage() {
    const [user, setUser] = useState<any>(null);
    const [status, setStatus] = useState<string>('Loading...');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const initializeUser = async () => {
            try {
                console.log('Creating user...');
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Working User' })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const newUser = await response.json();
                console.log('User created:', newUser);
                setUser(newUser);
                setStatus('User created successfully!');
            } catch (err) {
                console.error('Failed to create user:', err);
                setError('Failed to initialize user: ' + err);
                setStatus('Error occurred');
            }
        };

        initializeUser();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Working Test Page</h1>
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Status:</h2>
                    <p>{status}</p>
                </div>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}
                <div>
                    <h2 className="text-lg font-semibold">User:</h2>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
