import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    shopName: '',
    city: '',
    address: '',
    avatar: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        shopName: user.shopName || '',
        city: user.city || '',
        address: user.address || '',
        avatar: user.avatar || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    // Limit to ~2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
      setSuccessMsg('Photo selected! Click "Save Changes" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSuccessMsg('Photo removed. Click "Save Changes" to apply.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Full name cannot be empty');
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('New password and confirm password do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        shopName: formData.shopName.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        avatar: formData.avatar
      };

      if (formData.newPassword) {
        payload.password = formData.newPassword.trim();
      }

      await updateProfile(payload);
      setSuccessMsg('✓ Profile & settings successfully updated!');
      setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = (formData.name || 'Owner')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: '20px', fontWeight: 800 }}>
            My Profile & Shop Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--muted)', fontSize: '12px', mt: 0.5 }}>
            Update your account details, profile picture, shop information and login password
          </Typography>
        </Box>
        <span className="badge badge-amber" style={{ fontSize: '11px', padding: '5px 12px' }}>
          {user?.role || 'OWNER'} ACCOUNT
        </span>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ fontSize: '13px' }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ fontSize: '13px' }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px' }}>
          {/* 1. Profile Picture / Avatar Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              pb: 3,
              borderBottom: '1px solid var(--line)',
              flexWrap: 'wrap'
            }}
          >
            <Avatar
              src={formData.avatar || undefined}
              alt={formData.name}
              sx={{
                width: 90,
                height: 90,
                fontSize: '26px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #d6b35a, #8e681c)',
                color: '#ffffff',
                border: '3px solid #e7c46c',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '15px' }}>
                Profile Picture
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--muted)', display: 'block', mb: 1.5 }}>
                Upload a clear photo or shop logo (PNG, JPG, max 2MB).
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    borderColor: '#b7892b',
                    color: '#76530d',
                    fontWeight: 700,
                    fontSize: '11px',
                    '&:hover': { backgroundColor: 'var(--goldbg)' }
                  }}
                >
                  📷 Choose Photo
                </Button>
                {formData.avatar && (
                  <Button
                    variant="text"
                    size="small"
                    color="error"
                    onClick={handleRemoveAvatar}
                    sx={{ fontSize: '11px', fontWeight: 600 }}
                  >
                    Remove Photo
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* 2. Personal & Account Details */}
          <Box sx={{ pt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#171a1f', mb: 2, fontSize: '14px' }}>
              👤 Personal & Account Details
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Full Name*"
                name="name"
                size="small"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ranjeet Soni"
              />

              <TextField
                label="Username (Login ID)"
                name="username"
                size="small"
                fullWidth
                disabled
                value={formData.username}
                helperText="Username is fixed for security identification"
              />

              <TextField
                label="Mobile Phone Number*"
                name="phone"
                size="small"
                fullWidth
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 98290 12345"
              />

              <TextField
                label="Email Address"
                name="email"
                type="email"
                size="small"
                fullWidth
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. owner@jewelleryshop.com"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 3. Jewellery Shop Details */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#171a1f', mb: 2, fontSize: '14px' }}>
              🏪 Jewellery Shop Information (Reflected on Invoices)
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Jewellery Shop Name"
                name="shopName"
                size="small"
                fullWidth
                value={formData.shopName}
                onChange={handleChange}
                placeholder="e.g. Shree Radhe Jewellers"
                sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
              />

              <TextField
                label="City / District"
                name="city"
                size="small"
                fullWidth
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Jaipur"
              />

              <TextField
                label="Shop Address / Market Location"
                name="address"
                size="small"
                fullWidth
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Shop No. 12, Main Sarafa Bazar"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 4. Security & Password Update */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#171a1f', mb: 0.5, fontSize: '14px' }}>
              🔒 Change Login Password
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--muted)', display: 'block', mb: 2 }}>
              Leave blank if you do not want to change your current password.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="New Password (min 6 characters)"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                size="small"
                fullWidth
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? '👁' : '👁‍🗨'}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                size="small"
                fullWidth
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••"
              />
            </Box>
          </Box>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 2, borderTop: '1px solid var(--line)' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ px: 4, py: 1.2, fontWeight: 800, fontSize: '13px' }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : '✓ Save Profile Changes'}
            </Button>
          </Box>
        </Card>
      </form>
    </Box>
  );
};
