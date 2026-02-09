import TodoList from './components/TodoList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📝 Todo List
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay organized and get things done
          </p>
        </header>
        <TodoList />
      </div>
    </main>
  );
}
