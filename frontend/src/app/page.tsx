export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          AI Agent Management Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage all your AI agents in one place, regardless of how they were built
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/agents"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Agents
          </a>
          <a
            href="/agents/new"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Create Agent
          </a>
        </div>
      </div>
    </main>
  )
}
