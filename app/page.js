'use client'
import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/firebase';
import SignIn from './components/SignIn';
import Pantry from './components/Pantry';

export default function Home() {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
        <Alert severity="error">
          Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables.
        </Alert>
      </Box>
    );
  }

  if (user === undefined) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Loading" />
      </Box>
    );
  }

  return user ? <Pantry key={user.uid} user={user} /> : <SignIn />;
}
