import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';
import { logAudit } from '../utils/auditLogger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aarna_super_secure_jwt_secret_2026_key!', {
    expiresIn: '7d'
  });
};

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Owner full name is required (min 2 characters)'),
  shopName: z.string().min(2, 'Jewellery shop name is required (min 2 characters)'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Valid 10-digit mobile number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  city: z.string().optional().default('Jaipur'),
  address: z.string().optional().default(''),
  gstin: z.string().optional().default('')
});

export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const cleanUsername = data.username.toLowerCase().trim();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This username is already taken. Please choose another.' });
    }

    const user = await User.create({
      name: data.name.trim(),
      username: cleanUsername,
      email: (data.email || '').trim().toLowerCase(),
      phone: (data.phone || '').trim(),
      city: (data.city || '').trim(),
      address: (data.address || '').trim(),
      shopName: data.shopName.trim(),
      password: data.password,
      role: 'OWNER',
      permissions: ['ALL'],
      isActive: true
    });

    // Configure or update shop profile
    await Setting.findOneAndUpdate(
      { key: 'main_shop_config' },
      {
        $set: {
          shopName: data.shopName.trim(),
          ownerName: data.name.trim(),
          phone: data.phone.trim(),
          email: (data.email || '').trim(),
          city: (data.city || '').trim(),
          address: (data.address || '').trim(),
          gstin: (data.gstin || '').toUpperCase().trim()
        }
      },
      { new: true, upsert: true }
    );

    await logAudit({
      req,
      action: 'OWNER_REGISTERED',
      resource: 'User',
      resourceId: user._id,
      details: { username: user.username, shopName: data.shopName }
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Jewellery Shop and Owner registered successfully!',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || '',
        city: user.city || '',
        address: user.address || '',
        shopName: user.shopName || '',
        role: user.role,
        permissions: user.permissions,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact store owner.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit({
      req,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user._id,
      details: { username: user.username, role: user.role }
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        city: user.city || '',
        address: user.address || '',
        shopName: user.shopName || '',
        role: user.role,
        permissions: user.permissions,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, avatar, city, address, shopName, password } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && name.trim()) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (city !== undefined) user.city = city.trim();
    if (address !== undefined) user.address = address.trim();
    if (shopName !== undefined) user.shopName = shopName.trim();

    if (password && password.trim().length >= 6) {
      user.password = password.trim();
    }

    await user.save();

    // If owner, sync updated details to main shop settings as well
    if (user.role === 'OWNER' && (shopName || phone || city || address || name || email)) {
      const settingUpdate = {};
      if (shopName) settingUpdate.shopName = shopName.trim();
      if (name) settingUpdate.ownerName = name.trim();
      if (phone) settingUpdate.phone = phone.trim();
      if (city !== undefined) settingUpdate.city = city.trim();
      if (address !== undefined) settingUpdate.address = address.trim();
      if (email !== undefined) settingUpdate.email = email.trim().toLowerCase();

      await Setting.findOneAndUpdate(
        { key: 'main_shop_config' },
        { $set: settingUpdate },
        { new: true, upsert: true }
      );
    }

    await logAudit({
      req,
      action: 'PROFILE_UPDATE',
      resource: 'User',
      resourceId: user._id,
      details: { username: user.username, fields: Object.keys(req.body) }
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        city: user.city || '',
        address: user.address || '',
        shopName: user.shopName || '',
        role: user.role,
        permissions: user.permissions,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Please provide valid current and new password (min 6 characters)' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      req,
      action: 'PASSWORD_CHANGE',
      resource: 'User',
      resourceId: user._id,
      details: { username: user.username }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
