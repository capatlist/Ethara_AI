const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/tasks/dashboard
// @desc    Get dashboard data for current user
router.get('/dashboard', async (req, res) => {
  try {
    // Get all projects user is part of
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    });

    const projectIds = projects.map(p => p._id);

    // Get task stats
    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = { total: 0, todo: 0, 'in-progress': 0, 'in-review': 0, done: 0 };
    taskStats.forEach(ts => {
      stats[ts._id] = ts.count;
      stats.total += ts.count;
    });

    // Get overdue tasks
    const now = new Date();
    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'done' }
    })
    .populate('assignee', 'name email avatar')
    .populate('project', 'name color')
    .sort({ dueDate: 1 })
    .limit(10);

    // Get my assigned tasks
    const myTasks = await Task.find({
      assignee: req.user._id,
      status: { $ne: 'done' }
    })
    .populate('project', 'name color')
    .sort({ dueDate: 1, priority: -1 })
    .limit(10);

    // Get recent tasks across all projects
    const recentTasks = await Task.find({
      project: { $in: projectIds }
    })
    .populate('assignee', 'name email avatar')
    .populate('project', 'name color')
    .sort({ updatedAt: -1 })
    .limit(10);

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      { $match: { project: { $in: projectIds }, status: { $ne: 'done' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const priorities = { low: 0, medium: 0, high: 0, critical: 0 };
    priorityStats.forEach(ps => {
      priorities[ps._id] = ps.count;
    });

    res.json({
      stats,
      overdueTasks,
      myTasks,
      recentTasks,
      priorities,
      projectCount: projects.length,
      overdueCount: overdueTasks.length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks
// @desc    Get tasks with filters
router.get('/', async (req, res) => {
  try {
    const { project, assignee, status, priority, search } = req.query;

    // Build filter
    const filter = {};

    if (project) {
      filter.project = project;
    } else {
      // Only show tasks from user's projects
      const projects = await Project.find({
        $or: [
          { owner: req.user._id },
          { 'members.user': req.user._id }
        ]
      });
      filter.project = { $in: projects.map(p => p._id) };
    }

    if (assignee) filter.assignee = assignee;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
router.post('/', [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, project: projectId, assignee, priority, dueDate, tags, status } = req.body;

    // Verify user is a member of the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.owner.toString() === req.user._id.toString() ||
      project.members.some(m => m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      project: projectId,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: dueDate || null,
      tags: tags || []
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task details
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user has access to the project
    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const membership = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = membership && membership.role === 'admin';
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Members can only update status of assigned tasks
    if (!isOwner && !isAdmin && !isCreator) {
      const allowedFields = ['status'];
      const updateFields = Object.keys(req.body);
      const isValidUpdate = updateFields.every(field => allowedFields.includes(field));
      if (!isValidUpdate) {
        return res.status(403).json({ message: 'You can only update the status of assigned tasks' });
      }
    }

    const { title, description, assignee, priority, status, dueDate, tags } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags) task.tags = tags;

    await task.save();

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task (creator or admin)
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const membership = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = membership && membership.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
