import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, Alert, CircularProgress, Grid } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    name: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    gstin: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#171a1f',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 580,
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}
      >
        {/* Brand Header */}
        <Typography
          className="brand-title"
          sx={{
            fontFamily: 'Cinzel, Georgia, serif',
            letterSpacing: '3px',
            fontSize: '22px',
            color: '#b7892b',
            fontWeight: 800
          }}
        >
          AARNA JEWAR
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ letterSpacing: '1px', color: '#171a1f', fontWeight: 700, mt: 0.5 }}
        >
          Register Your Gold Jewellery Shop
        </Typography>
        <Typography variant="caption" sx={{ color: '#73757c', display: 'block', mb: 3 }}>
          Create your owner account to begin live billing, inventory tracking & GST invoices.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '12px', textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Jewellery Shop Name*"
                name="shopName"
                size="small"
                fullWidth
                required
                placeholder="e.g. Aarna Jewar"
                value={formData.shopName}
                onChange={handleChange}
                autoFocus
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Owner Full Name*"
                name="name"
                size="small"
                fullWidth
                required
                placeholder="e.g. Ranjeet Soni"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Mobile Number (10 digits)*"
                name="phone"
                size="small"
                fullWidth
                required
                placeholder="e.g. 9829012345"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                name="email"
                type="email"
                size="small"
                fullWidth
                placeholder="e.g. contact@myshop.com"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Choose Username*"
                name="username"
                size="small"
                fullWidth
                required
                placeholder="e.g. ranjeet"
                value={formData.username}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Password (min 6 characters)*"
                name="password"
                type="password"
                size="small"
                fullWidth
                required
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="City*"
                name="city"
                size="small"
                fullWidth
                required
                placeholder="e.g. Jaipur"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="GSTIN (optional)"
                name="gstin"
                size="small"
                fullWidth
                placeholder="08AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Shop Address / Market"
                name="address"
                size="small"
                fullWidth
                placeholder="e.g. Shop No. 12, Main Sarafa Bazar"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting}
            sx={{
              mt: 3,
              py: 1.2,
              backgroundColor: '#b7892b',
              color: '#fff',
              fontWeight: 800,
              fontSize: '13px',
              '&:hover': { backgroundColor: '#966e1e' }
            }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : '✓ Register & Launch My Shop'}
          </Button>
        </form>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f0ece3', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontSize: '12px', color: '#73757c' }}>
            Already registered your shop?{' '}
            <Link to="/login" style={{ color: '#b7892b', fontWeight: 700, textDecoration: 'none' }}>
              Sign In Here
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};
