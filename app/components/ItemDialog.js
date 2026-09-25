'use client'
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';

// Adding a name that already exists increases its quantity.
export default function ItemDialog({ open, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setQuantity('1');
      setSubmitting(false);
    }
  }, [open]);

  const trimmedName = name.trim();
  const qty = Number(quantity);
  const nameError = name !== '' && (trimmedName === '' || trimmedName.includes('/'))
    ? 'Enter a name (no "/" characters)'
    : '';
  const qtyError = !Number.isInteger(qty) || qty < 1 || qty > 9999 ? 'Enter a whole number from 1 to 9999' : '';
  const canSubmit = trimmedName !== '' && !trimmedName.includes('/') && !qtyError && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const ok = await onSubmit(trimmedName, qty);
    if (!ok) setSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>Add pantry item</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Item name"
              placeholder="e.g. Rice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(nameError)}
              helperText={nameError || ' '}
              autoFocus
              fullWidth
            />
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              error={Boolean(qtyError)}
              helperText={qtyError || ' '}
              inputProps={{ min: 1, max: 9999, step: 1, inputMode: 'numeric' }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            Add item
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
