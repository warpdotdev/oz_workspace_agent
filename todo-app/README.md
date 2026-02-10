# To-Do Application

A simple, elegant to-do list application built with vanilla HTML, CSS, and JavaScript. Features persistent storage using browser LocalStorage, allowing your tasks to survive browser refreshes.

## Features

✅ **Add Tasks** - Quickly add new to-do items  
✅ **Mark Complete** - Check off tasks as you complete them  
✅ **Delete Tasks** - Remove tasks you no longer need  
✅ **Persistent Storage** - Your tasks are saved in LocalStorage and survive browser refreshes  
✅ **Clean UI** - Modern, responsive design that works on desktop and mobile  
✅ **No Dependencies** - Pure vanilla JavaScript, no frameworks required

## Technology Stack

- **Frontend**: HTML5, CSS3, vanilla JavaScript
- **Data Persistence**: Browser LocalStorage
- **Architecture**: Client-side only (no backend required)

## Data Model

Each to-do item follows this structure:

```javascript
{
  id: "unique_identifier",
  text: "Task description",
  completed: false,
  createdAt: "2026-02-09T12:00:00.000Z"
}
```

## Usage

### Running the Application

1. Open `index.html` in any modern web browser
2. That's it! No build process or server required

Alternatively, you can serve it with a simple HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

### Using the Application

1. **Add a task**: Type your task in the input field and press Enter or click "Add Task"
2. **Complete a task**: Click the checkbox next to the task
3. **Delete a task**: Click the "Delete" button
4. **View your tasks**: All tasks are displayed in the list, with completed tasks shown with a strikethrough

## File Structure

```
todo-app/
├── index.html    # Main HTML structure
├── styles.css    # All styling and responsive design
├── app.js        # Application logic and LocalStorage integration
└── README.md     # This file
```

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- LocalStorage API
- CSS Flexbox
- CSS Grid

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## LocalStorage

The application uses browser LocalStorage to persist data. Data is stored under the key `todos` and includes all task information. The storage is specific to your browser and domain.

**Note**: Clearing your browser data will delete your tasks. There is no cloud backup.

## Customization

Feel free to customize the app:

- **Colors**: Edit the gradient and color values in `styles.css`
- **Fonts**: Change the font-family in the body selector
- **Storage Key**: Modify the `STORAGE_KEY` constant in `app.js`
- **Features**: Extend the JavaScript to add categories, due dates, or priorities

## License

Free to use and modify as needed.

---

_Built with ❤️ using vanilla JavaScript_
