import { User } from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role, permissions } = req.body;

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const user = await User.create({
      name,
      username: username.toLowerCase().trim(),
      email: email || '',
      password,
      role: role || 'CASHIER',
      permissions: permissions || []
    });

    await logAudit({
      req,
      action: 'USER_CREATED',
      resource: 'User',
      resourceId: user._id,
      details: { username: user.username, role: user.role }
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, permissions } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email !== undefined) user.email = email;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;

    if (req.body.password && req.body.password.length >= 6) {
      user.password = req.body.password;
    }

    await user.save();

    await logAudit({
      req,
      action: 'USER_UPDATED',
      resource: 'User',
      resourceId: user._id,
      details: { username: user.username, role: user.role }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'OWNER' && user.isActive) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate the Owner account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      req,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      resource: 'User',
      resourceId: user._id,
      details: { username: user.username, isActive: user.isActive }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
