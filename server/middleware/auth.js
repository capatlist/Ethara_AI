const jwt = require('jsonwebtoken');
const User = require('../models/User');


const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};


const projectAuth = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const Project = require('../models/Project');
      const projectId = req.params.id || req.params.projectId || req.body.project;

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

   
      if (project.owner.toString() === req.user._id.toString()) {
        req.project = project;
        req.projectRole = 'owner';
        return next();
      }

     
      const membership = project.members.find(
        m => m.user.toString() === req.user._id.toString()
      );

      if (!membership) {
        return res.status(403).json({ message: 'Not a member of this project' });
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.project = project;
      req.projectRole = membership.role;
      next();
    } catch (error) {
      console.error('Project auth error:', error.message);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = { protect, projectAuth };
