'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { firestore, isFirebaseConfigured } from '@/firebase';
import {
  Container, Box, Stack, Paper, Typography, Button, TextField, InputAdornment, IconButton,
  List, ListItem, Divider, Skeleton, Snackbar, Alert, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import KitchenOutlinedIcon from '@mui/icons-material/KitchenOutlined';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, increment } from 'firebase/firestore';
import ItemDialog from './components/ItemDialog';
import RecipeSection from './components/RecipeSection';

// Doc ids are stored as "Capitalized" names so "rice" and "RICE" merge into one item.
const normalizeName = (name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null); // { message, severity, undo? }

  const notify = (message, severity = 'success', undo) => setToast({ message, severity, undo });

  const updateInventory = useCallback(async () => {
    if (!isFirebaseConfigured) {
      notify('Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables.', 'error');
      setLoading(false);
      return;
    }
    try {
      const docs = await getDocs(collection(firestore, 'inventory'));
      const list = docs.docs.map((d) => ({ name: d.id, quantity: Number(d.data().quantity) || 0 }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setInventory(list);
    } catch (error) {
      console.error('Error loading inventory:', error);
      notify('Could not load your pantry. Check your Firebase configuration.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    updateInventory();
  }, [updateInventory]);

  // Runs a Firestore write for one item, then refreshes. Returns true on success.
  const runForItem = async (name, action, errorMessage) => {
    setBusyItem(name);
    try {
      await action();
      await updateInventory();
      return true;
    } catch (error) {
      console.error(errorMessage, error);
      notify(errorMessage, 'error');
      return false;
    } finally {
      setBusyItem(null);
    }
  };

  const addItem = async (rawName, quantity = 1) => {
    const name = normalizeName(rawName);
    const docRef = doc(firestore, 'inventory', name);
    return runForItem(name, () => setDoc(docRef, { quantity: increment(quantity) }, { merge: true }), `Could not add ${name}.`);
  };

  const handleDialogSubmit = async (name, quantity) => {
    const ok = await addItem(name, quantity);
    if (ok) {
      setDialogOpen(false);
      notify(`Added ${quantity} × ${normalizeName(name)}`);
    }
    return ok;
  };

  const decrementItem = (item) => {
    const docRef = doc(firestore, 'inventory', item.name);
    if (item.quantity <= 1) return deleteItem(item);
    return runForItem(item.name, () => updateDoc(docRef, { quantity: increment(-1) }), `Could not update ${item.name}.`);
  };

  const deleteItem = async (item) => {
    const docRef = doc(firestore, 'inventory', item.name);
    const ok = await runForItem(item.name, () => deleteDoc(docRef), `Could not remove ${item.name}.`);
    if (ok) notify(`Removed ${item.name}`, 'info', () => addItem(item.name, item.quantity));
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'flex-end' }}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <KitchenOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
                <Typography variant="h4" component="h1">Pantry Tracker</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Keep track of what you have and find something to cook with it.
              </Typography>
            </Box>
            <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ flexShrink: 0 }}>
              Add item
            </Button>
          </Stack>

          {/* Inventory */}
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ p: { xs: 2, sm: 3 } }}>
              <TextField
                placeholder="Search your pantry"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                fullWidth
                inputProps={{ 'aria-label': 'Search your pantry' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
              />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Chip label={`${inventory.length} ${inventory.length === 1 ? 'item' : 'items'}`} variant="outlined" />
                <Chip label={`${totalUnits} total`} variant="outlined" />
              </Stack>
            </Stack>
            <Divider />

            {loading ? (
              <Stack spacing={1} sx={{ p: 2 }}>
                {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={48} />)}
              </Stack>
            ) : filteredInventory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <Typography fontWeight={600}>
                  {inventory.length === 0 ? 'Your pantry is empty' : `No items match "${searchQuery.trim()}"`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {inventory.length === 0 ? 'Add your first item to get started.' : 'Try a different search.'}
                </Typography>
              </Box>
            ) : (
              <List disablePadding sx={{ maxHeight: 440, overflowY: 'auto' }}>
                {filteredInventory.map((item, index) => {
                  const busy = busyItem === item.name;
                  return (
                    <React.Fragment key={item.name}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem sx={{ py: 1.25, px: { xs: 2, sm: 3 }, gap: 1, opacity: busy ? 0.6 : 1 }}>
                        <Typography sx={{ flexGrow: 1, minWidth: 0 }} noWrap fontWeight={500}>{item.name}</Typography>
                        <Stack direction="row" alignItems="center" sx={{ border: 1, borderColor: 'divider', borderRadius: 999 }}>
                          <IconButton size="small" aria-label={`Decrease ${item.name}`} onClick={() => decrementItem(item)} disabled={busy}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 32, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }} aria-label={`${item.quantity} ${item.name}`}>
                            {item.quantity}
                          </Typography>
                          <IconButton size="small" aria-label={`Increase ${item.name}`} onClick={() => addItem(item.name, 1)} disabled={busy}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Tooltip title="Remove item">
                          <span>
                            <IconButton aria-label={`Remove ${item.name}`} onClick={() => deleteItem(item)} disabled={busy} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                              <DeleteOutlineIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Paper>

          <RecipeSection itemNames={inventory.map((item) => item.name)} />
        </Stack>
      </Container>

      <ItemDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleDialogSubmit} />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={toast?.undo ? 6000 : 4000}
        onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
            action={toast.undo && (
              <Button color="inherit" size="small" onClick={() => { toast.undo(); setToast(null); }}>Undo</Button>
            )}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        ) : <span />}
      </Snackbar>
    </Box>
  );
}
