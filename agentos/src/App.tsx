import { useEffect } from 'react';
import { useAgentStore } from './store';
import { useMockSimulation } from './hooks';

// Layout components
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import ActivityPanel from './components/ActivityPanel';
import CommandBar from './components/CommandBar';

function App() {
  const { isCommandBarOpen, toggleCommandBar } = useAgentStore();
  
  // Initialize mock data simulation
  useMockSimulation();

  // Global keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandBar();
      }
      if (e.key === 'Escape' && isCommandBarOpen) {
        toggleCommandBar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandBarOpen, toggleCommandBar]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      {/* Draggable title bar area for macOS */}
      <div 
        className="fixed top-0 left-0 right-0 h-7 z-50" 
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      
      {/* Sidebar - Agent List */}
      <Sidebar />
      
      {/* Main Content Area */}
      <MainPanel />
      
      {/* Activity Panel */}
      <ActivityPanel />
      
      {/* Command Bar Modal */}
      {isCommandBarOpen && <CommandBar />}
    </div>
  );
}

export default App;
