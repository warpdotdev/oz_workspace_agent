function App() {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar - 240px width */}
      <aside className="w-60 bg-gray-800 border-r border-gray-700">
        <div className="p-4">
          <h1 className="text-xl font-bold">AgentOS</h1>
          <p className="text-sm text-gray-400 mt-1">AI Agent Manager</p>
        </div>
        {/* Agent list will go here */}
      </aside>

      {/* Main Content - Flexible width */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
          <p className="text-gray-400">AgentOS is ready for UI components...</p>
        </div>
      </main>

      {/* Activity Panel - 320px width */}
      <aside className="w-80 bg-gray-800 border-l border-gray-700">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Activity Feed</h3>
        </div>
        {/* Activity feed will go here */}
      </aside>
    </div>
  );
}

export default App;
