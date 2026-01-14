const API_URL = 'http://localhost:3000/api/tasks';

let currentFilter = 'all';

// DOM Elements
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const filterButtons = document.querySelectorAll('.filter-btn');

// Initialize
document.addEventListener('DOMContentLoaded', (e) => {
  e.preventDefault()
  loadTasks();
  
  // Form submission
  taskForm.addEventListener('submit', handleAddTask);
  
  // Filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadTasks();
    });
  });
});

// Load and display tasks
async function loadTasks() {
  try {
    let url = API_URL;
    
    // Apply filters
    if (currentFilter === 'completed') {
      url += '?completed=true';
    } else if (currentFilter === 'active') {
      url += '?completed=false';
    } else if (currentFilter === 'high') {
      url += '?priority=high';
    }
    
    const response = await fetch(url);
    const tasks = await response.json();
    
    displayTasks(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasksList.innerHTML = '<div class="empty-state"><p>❌ Error loading tasks</p></div>';
  }
}

// Display tasks in the UI
function displayTasks(tasks) {
  if (tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-state">
        <p>📭 No tasks found</p>
        <small>Add a task to get started!</small>
      </div>
    `;
    return;
  }
  
  tasksList.innerHTML = tasks.map(task => createTaskCard(task)).join('');
  
  // Add event listeners to buttons
  document.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', () => toggleComplete(btn.dataset.id, btn.dataset.completed === 'true'));
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.id));
  });
}

// Create HTML for a task card
function createTaskCard(task) {
  const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : null;
  const priorityClass = task.priority === 'high' ? 'priority-high' : '';
  const completedClass = task.completed ? 'completed' : '';
  
  return `
    <div class="task-card ${priorityClass} ${completedClass}">
      <div class="task-header">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-actions">
          <button class="btn-icon btn-complete" 
                  data-id="${task._id}" 
                  data-completed="${task.completed}">
            ${task.completed ? '↩️' : '✓'}
          </button>
          <button class="btn-icon delete btn-delete" data-id="${task._id}">🗑️</button>
        </div>
      </div>
      
      ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      
      <div class="task-meta">
        <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
        ${dueDate ? `<span class="task-due-date">📅 ${dueDate}</span>` : ''}
        ${task.tags && task.tags.length > 0 ? `
          <div class="task-tags">
            ${task.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Handle adding new task
async function handleAddTask(e) {
  e.preventDefault();
  
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDescription').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const dueDate = document.getElementById('taskDueDate').value;
  const tagsInput = document.getElementById('taskTags').value.trim();
  
  const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  
  const newTask = {
    title,
    description,
    priority,
    due_date: dueDate || null,
    tags
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    
    if (response.ok) {
      taskForm.reset();
      loadTasks();
    } else {
      alert('Error adding task');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error adding task');
  }
}

// Toggle task completion
async function toggleComplete(taskId, isCompleted) {
  try {
    const response = await fetch(`${API_URL}/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !isCompleted })
    });
    
    if (response.ok) {
      loadTasks();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    const response = await fetch(`${API_URL}/${taskId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      loadTasks();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
