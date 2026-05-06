const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters'],
    maxlength: [100, 'Project name must be at most 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be at most 500 characters'],
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  color: {
    type: String,
    default: '#3b82f6'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for task count
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project'
});

module.exports = mongoose.model('Project', projectSchema);
