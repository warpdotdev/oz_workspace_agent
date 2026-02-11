import AgentList from '@/components/AgentList';

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
        <p className="mt-2 text-gray-600">
          Manage all your AI agents in one place, regardless of how they were built
        </p>
      </div>
      <AgentList />
    </div>
  );
}
