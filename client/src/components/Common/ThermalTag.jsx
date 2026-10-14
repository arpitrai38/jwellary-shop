import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Box, Typography } from '@mui/material';

export const ThermalTag = ({
  shopName = 'AARNA JEWAR',
  itemName = 'Gents Ring',
  itemId = 'JWL-00126',
  barcode = 'JWL00126',
  price = 11100,
  purity = '22K',
  netWeight = 1.55
}) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && barcode) {
      try {
        JsBarcode(barcodeRef.current, String(barcode), {
          format: 'CODE128',
          width: 1.2,
          height: 28,
          displayValue: false,
          margin: 0
        });
      } catch (err) {
        console.error('JsBarcode rendering error:', err);
      }
    }
  }, [barcode]);

  return (
    <Box
      className="tag-paper printable-tag"
      sx={{
        width: 195,
        backgroundColor: '#ffffff',
        border: '1px solid #d9d5cc',
        borderRadius: '8px',
        p: '10px 12px',
        textAlign: 'center',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
        boxSizing: 'border-box',
        margin: '0 auto'
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Cinzel, Georgia, serif',
          letterSpacing: '1.5px',
          fontSize: '11px',
          fontWeight: 800,
          color: '#171a1f'
        }}
      >
        {shopName}
      </Typography>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '12px',
          mt: 0.5,
          mb: 0.5,
          color: '#171a1f',
          textTransform: 'uppercase'
        }}
      >
        {itemName}
      </Typography>

      {/* SVG Barcode */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
        <svg ref={barcodeRef} style={{ maxWidth: '100%' }}></svg>
      </Box>

      <Typography sx={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px' }}>
        {itemId}
      </Typography>

      <Typography sx={{ fontSize: '10px', color: '#73757c', mt: 0.3 }}>
        {purity} · {netWeight}g
      </Typography>

      <Typography
        sx={{
          fontWeight: 900,
          fontSize: '15px',
          mt: 0.6,
          color: 'var(--ink)'
        }}
      >
        ₹{Number(price).toLocaleString('en-IN')}
      </Typography>
    </Box>
  );
};
