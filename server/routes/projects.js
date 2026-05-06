const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, projectAuth } = require('../middleware/auth');

const router = express.Router();

router.use(protect);


router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort({ updatedAt: -1 });

    
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const counts = {
          total: 0,
          todo: 0,
          'in-progress': 0,
          'in-review': 0,
          done: 0
        };

        taskCounts.forEach(tc => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return {
          ...project.toJSON(),
          taskCounts: counts
        };
      })
    );

    res.json(projectsWithCounts);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description, color } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user._id,
      color: color || '#3b82f6',
      members: []
    });

    await project.populate('owner', 'name email avatar');

    res.status(201).json({
      ...project.toJSON(),
      taskCounts: { total: 0, todo: 0, 'in-progress': 0, 'in-review': 0, done: 0 }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', projectAuth(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    const taskCounts = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = { total: 0, todo: 0, 'in-progress': 0, 'in-review': 0, done: 0 };
    taskCounts.forEach(tc => {
      counts[tc._id] = tc.count;
      counts.total += tc.count;
    });

    res.json({
      ...project.toJSON(),
      taskCounts: counts,
      userRole: req.projectRole
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', projectAuth(['admin']), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description, status, color } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (status) update.status = status;
    if (color) update.color = color;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    )
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', projectAuth(), async (req, res) => {
  try {
    if (req.projectRole !== 'owner') {
      return res.status(403).json({ message: 'Only the project owner can delete this project' });
    }

   
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/:id/members', projectAuth(['admin']), [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, role = 'member' } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const project = await Project.findById(req.params.id);

    // Check if user is already owner
    if (project.owner.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'This user is the project owner' });
    }

    // Check if already a member
    const existingMember = project.members.find(
      m => m.user.toString() === user._id.toString()
    );
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({ user: user._id, role });
    await project.save();

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.json(project);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id/members/:userId', projectAuth(['admin']), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    await project.save();

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.json(project);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
