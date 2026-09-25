'use client'
import React, { useState } from 'react';
import { Paper, Box, Stack, Typography, Button, Card, CardContent, CardActions, Link, Alert, Skeleton } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { auth } from '@/firebase';

export default function RecipeSection({ itemNames }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please sign in again.');
      const response = await fetch('/api/generate-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pantryItems: itemNames }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || (response.status === 504
          ? 'Recipe generation took too long. Please try again.'
          : `Request failed (${response.status})`));
      }
      setRecipes(data.recipes ?? []);
      if (!data.recipes?.length) setError('No recipes came back. Try again.');
    } catch (err) {
      setError(err.message || 'Could not generate recipes.');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || itemNames.length === 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box>
          <Typography variant="h6" component="h2">Recipe ideas</Typography>
          <Typography variant="body2" color="text.secondary">
            {itemNames.length === 0
              ? 'Add items to your pantry to get suggestions.'
              : 'Get Gemini recipe ideas based on your pantry items.'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AutoAwesomeIcon />}
          onClick={handleGenerate}
          disabled={disabled}
          sx={{ flexShrink: 0 }}
        >
          {loading ? 'Generating…' : recipes.length ? 'Regenerate' : 'Generate recipes'}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {(loading || recipes.length > 0) && (
        <Box
          sx={{
            mt: 3,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          }}
        >
          {loading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={140} />)
            : recipes.map((recipe, index) => (
                <Card key={`${recipe.name}-${index}`} variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>{recipe.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{recipe.description}</Typography>
                  </CardContent>
                  {recipe.url && (
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Link
                        href={recipe.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 14, fontWeight: 600 }}
                      >
                        View recipe <OpenInNewIcon sx={{ fontSize: 16 }} />
                      </Link>
                    </CardActions>
                  )}
                </Card>
              ))}
        </Box>
      )}
    </Paper>
  );
}
