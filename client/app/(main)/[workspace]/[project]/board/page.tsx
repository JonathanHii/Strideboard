export default function BoardPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Board</h1>
            {/* Your Kanban board or content goes here */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <p className="text-gray-500">Board content will appear here...</p>
            </div>
        </div>
    );
}