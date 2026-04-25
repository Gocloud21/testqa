const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory store for demo purposes
let tasks = [
  { id: 1, title: 'Set up the project', completed: true },
  { id: 2, title: 'Write integration tests', completed: false },
  { id: 3, title: 'Configure CI pipeline', completed: false },
];
let nextId = 4;

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const task = { id: nextId++, title: title.trim(), completed: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (typeof req.body.completed === 'boolean') task.completed = req.body.completed;
  if (req.body.title && typeof req.body.title === 'string') task.title = req.body.title.trim();
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(index, 1);
  res.status(204).send();
});

// Reset state (useful for tests)
app.post('/api/reset', (req, res) => {
  tasks = [
    { id: 1, title: 'Set up the project', completed: true },
    { id: 2, title: 'Write integration tests', completed: false },
    { id: 3, title: 'Configure CI pipeline', completed: false },
  ];
  nextId = 4;
  res.json({ message: 'State reset' });
});

module.exports = app;
