import React from 'react';
import { Box, Card, Typography, Button } from '@mui/material';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <Card sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderRadius: '16px' }}>
            <Typography variant="h3" color="error" sx={{ mb: 1, fontWeight: 800 }}>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--muted)', mb: 3 }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </Typography>
            <Button variant="contained" color="primary" onClick={this.handleReload}>
              Reload Page
            </Button>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
