import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
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
          maxWidth: 420,
          width: '100%',
          p: 4,
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
        <Typography variant="caption" sx={{ letterSpacing: '2px', color: '#73757c', textTransform: 'uppercase', display: 'block', mt: 0.5, mb: 3 }}>
          Jewellery Shop Management System
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '12px', textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              size="small"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />

            <TextField
              label="Password"
              type="password"
              size="small"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                mt: 1,
                py: 1.2,
                backgroundColor: '#b7892b',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                '&:hover': { backgroundColor: '#966e1e' }
              }}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Sign In to Shop ERP'}
            </Button>
          </Box>
        </form>

        {/* Link to Register */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f0ece3', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontSize: '12px', color: '#73757c' }}>
            New Jewellery Shop?{' '}
            <Link to="/register" style={{ color: '#b7892b', fontWeight: 700, textDecoration: 'none' }}>
              Register Your Shop Now →
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};
