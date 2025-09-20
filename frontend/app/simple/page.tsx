export default function SimplePage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Simple Test Page</h1>
            <p>If you can see this, React is working!</p>
            <button
                onClick={() => alert('JavaScript is working!')}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
                Test JavaScript
            </button>
        </div>
    );
}
