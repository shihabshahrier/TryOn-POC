'use client';

import React, { useState } from 'react';

export default function SimpleTestPage() {
    const [count, setCount] = useState(0);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
            <p>If you can see this, React is working!</p>
            <button
                onClick={() => setCount(count + 1)}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
                Count: {count}
            </button>
            <div className="mt-4">
                <button
                    onClick={() => {
                        fetch('/api/health')
                            .then(res => res.json())
                            .then(data => alert(JSON.stringify(data)))
                            .catch(err => alert('Error: ' + err));
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded mt-2"
                >
                    Test API
                </button>
            </div>
        </div>
    );
}
