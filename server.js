require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection string (replace with your own)
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

let db;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// API Routes

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { priority, completed } = req.query;
    const filter = {};
    
    if (priority) filter.priority = priority;
    if (completed !== undefined) filter.completed = completed === 'true';
    
    const tasks = await db.collection('tasks')
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.collection('tasks').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = {
      title: req.body.title,
      description: req.body.description || '',
      priority: req.body.priority || 'medium',
      completed: false,
      tags: req.body.tags || [],
      due_date: req.body.due_date || null,
      created_at: new Date()
    };
    
    const result = await db.collection('tasks').insertOne(newTask);
    
    res.status(201).json({
      _id: result.insertedId,
      ...newTask
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updateData = {};
    
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.completed !== undefined) updateData.completed = req.body.completed;
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;
    if (req.body.due_date !== undefined) updateData.due_date = req.body.due_date;
    
    updateData.updated_at = new Date();
    
    const result = await db.collection('tasks').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const result = await db.collection('tasks').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
