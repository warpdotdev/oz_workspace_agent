#!/bin/bash

# Start server in background
npm run dev --workspace=backend &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "Testing API endpoints..."
echo ""

# Test 1: Create a todo
echo "1. Creating a todo..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/todos -H "Content-Type: application/json" -d '{"title":"Buy groceries"}')
echo "$CREATE_RESPONSE"
echo ""

# Test 2: List all todos
echo "2. Listing all todos..."
curl -s http://localhost:3001/api/todos
echo ""
echo ""

# Test 3: Create another todo
echo "3. Creating another todo..."
curl -s -X POST http://localhost:3001/api/todos -H "Content-Type: application/json" -d '{"title":"Write code"}'
echo ""
echo ""

# Test 4: Update a todo
echo "4. Updating todo with ID 1..."
curl -s -X PUT http://localhost:3001/api/todos/1 -H "Content-Type: application/json" -d '{"completed":true}'
echo ""
echo ""

# Test 5: List active todos
echo "5. Listing active todos..."
curl -s "http://localhost:3001/api/todos?filter=active"
echo ""
echo ""

# Test 6: List completed todos
echo "6. Listing completed todos..."
curl -s "http://localhost:3001/api/todos?filter=completed"
echo ""
echo ""

# Test 7: Toggle completion
echo "7. Toggling todo 2..."
curl -s -X PATCH http://localhost:3001/api/todos/2/toggle
echo ""
echo ""

# Test 8: Delete a todo
echo "8. Deleting todo 1..."
curl -s -X DELETE http://localhost:3001/api/todos/1
echo ""
echo ""

# Test 9: List all todos again
echo "9. Listing all todos after deletion..."
curl -s http://localhost:3001/api/todos
echo ""

# Stop server
kill $SERVER_PID
echo ""
echo "✅ All tests completed!"
