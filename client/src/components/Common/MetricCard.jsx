import React from 'react';
import { Card, Typography, Box } from '@mui/material';

export const MetricCard = ({ label, value, delta, deltaColor = 'var(--green)', icon, onClick }) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--line)',
        boxShadow: '0 8px 30px rgba(27,28,32,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(27,28,32,0.1)'
            }
          : {}
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 600 }}>
          {label}
        </Typography>
        {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
      </Box>

      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: '20px', sm: '25px' },
          fontWeight: 800,
          color: 'var(--ink)',
          mt: 0.5
        }}
      >
        {value}
      </Typography>

      {delta && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: deltaColor,
            mt: 0.6
          }}
        >
          {delta}
        </Typography>
      )}
    </Card>
  );
};
