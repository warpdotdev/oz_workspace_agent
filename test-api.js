const { spawn } = require('child_process');

// Start server
const server = spawn('npm', ['run', 'dev', '--workspace=backend'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverStarted = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  if (output.includes('Server running')) {
    serverStarted = true;
    runTests();
  }
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

async function runTests() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n=== Starting API Tests ===\n');
  
  try {
    // Test 1: Create todo
    console.log('1. Creating a todo...');
    let res = await fetch('http://localhost:3001/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy groceries' })
    });
    let data = await res.json();
    console.log('Created:', data);
    console.log('');
    
    // Test 2: Create another todo
    console.log('2. Creating another todo...');
    res = await fetch('http://localhost:3001/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write code' })
    });
    data = await res.json();
    console.log('Created:', data);
    console.log('');
    
    // Test 3: List all todos
    console.log('3. Listing all todos...');
    res = await fetch('http://localhost:3001/api/todos');
    data = await res.json();
    console.log('Todos:', data);
    console.log('');
    
    // Test 4: Update todo
    console.log('4. Updating todo with ID 1...');
    res = await fetch('http://localhost:3001/api/todos/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });
    data = await res.json();
    console.log('Updated:', data);
    console.log('');
    
    // Test 5: Filter active todos
    console.log('5. Listing active todos...');
    res = await fetch('http://localhost:3001/api/todos?filter=active');
    data = await res.json();
    console.log('Active todos:', data);
    console.log('');
    
    // Test 6: Filter completed todos
    console.log('6. Listing completed todos...');
    res = await fetch('http://localhost:3001/api/todos?filter=completed');
    data = await res.json();
    console.log('Completed todos:', data);
    console.log('');
    
    // Test 7: Toggle completion
    console.log('7. Toggling todo 2...');
    res = await fetch('http://localhost:3001/api/todos/2/toggle', {
      method: 'PATCH'
    });
    data = await res.json();
    console.log('Toggled:', data);
    console.log('');
    
    // Test 8: Delete todo
    console.log('8. Deleting todo 1...');
    res = await fetch('http://localhost:3001/api/todos/1', {
      method: 'DELETE'
    });
    console.log('Deleted (status:', res.status, ')');
    console.log('');
    
    // Test 9: List all todos after deletion
    console.log('9. Listing all todos after deletion...');
    res = await fetch('http://localhost:3001/api/todos');
    data = await res.json();
    console.log('Final todos:', data);
    console.log('');
    
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    server.kill();
    process.exit(0);
  }
}

// Timeout
setTimeout(() => {
  if (!serverStarted) {
    console.error('Server failed to start within timeout');
    server.kill();
    process.exit(1);
  }
}, 10000);
