'use client'
import React, { useState } from 'react';
import { Box, Paper, Stack, Typography, Button, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import KitchenOutlinedIcon from '@mui/icons-material/KitchenOutlined';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';

const errorMessages = {
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups for this site and try again.',
  'auth/unauthorized-domain': 'This domain is not authorized for sign-in. Add it in Firebase → Authentication → Settings → Authorized domains.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled. Turn it on in Firebase → Authentication → Sign-in method.',
};

export default function SignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setPending(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error('Sign-in failed:', err);
        setError(errorMessages[err.code] || 'Sign-in failed. Please try again.');
      }
      setPending(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <KitchenOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography variant="h4" component="h1">Pantry Tracker</Typography>
          <Typography color="text.secondary">
            Sign in to keep track of your pantry and get recipe ideas from what you have.
          </Typography>
          {error && <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>{error}</Alert>}
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleSignIn}
            disabled={pending}
            fullWidth
            sx={{ mt: 1 }}
          >
            {pending ? 'Signing in…' : 'Continue with Google'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
