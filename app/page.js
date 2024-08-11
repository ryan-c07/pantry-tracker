'use client'
import React, { useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import { Container, Table, TableHead, TableBody, TableRow, TableCell, Typography, Box, Modal, Stack, TextField, Button, Fade, TableContainer, Paper, Snackbar, Alert } from '@mui/material';
import { collection, deleteDoc, doc, getDocs, query, getDoc, setDoc } from 'firebase/firestore';
import { createTheme, ThemeProvider, styled } from "@mui/material";
import { tableCellClasses } from '@mui/material/TableCell';

// Custom theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6c17ad',
    },
    secondary: {
      main: '#a497ad',
    },
  },
  typography: {
    fontFamily: 'Lato',
  },
  h4: {
    fontFamily: 'Lato', 
  },
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#a497ad",
    color: "#00000",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Recipe generation states
  const [pantryItems, setPantryItems] = useState('');
  const [recipes, setRecipes] = useState([]);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const handleAddItem = async () => {
    if (itemName.trim() !== '') {
      await addItem(itemName.trim(), quantityToAdd);
      setItemName('');
      setQuantityToAdd(1);
      setQuantityModalOpen(false);
    }
  };

  const addItem = async (item, quantity = 1) => {
    const docRef = doc(collection(firestore, 'inventory'), item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity: currentQuantity } = docSnap.data();
      await setDoc(docRef, { quantity: currentQuantity + quantity });
    } else {
      await setDoc(docRef, { quantity });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const newQuantity = 0;

      if (newQuantity <= 0) {
        await deleteDoc(docRef); // Completely remove the item if quantity is zero or below
        setTimeout(() => updateInventory(), 500); // Wait for animation to finish
        showAlert('Item removed successfully!');
      }
    }
  };


  const handleOpenQuantityModal = (item) => {
    setItemName(item);
    setQuantityModalOpen(true);
  };

  const handleOpenRemoveQuantityModal = (item) => {
    setItemName(item);
    removeItem(item)
  };

  const handleClose = () => {
    setOpen(false);
    setQuantityModalOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showAlert = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  
  // Generate recipes based on pantry items using Google Gemini
  const handleGenerateRecipes = async () => {
    try {
      const pantryItemsList = inventory.map(item => item.name).join(', ');
  
      if (pantryItemsList.trim() !== '') {
        const response = await fetch('api/generate-recipes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pantryItems: pantryItemsList }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);
  
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md"
        sx={{
          backgroundColor: '#e4ddee', // Custom background color
          padding: 16,
          minHeight: '100vh', // Extend container to the bottom of the screen
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box textAlign="center" mt={4} mb={2}>
          <Typography variant="h4" component="h4" gutterBottom>
            <b>INVENTORY TRACKER</b>
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
            Add Item
          </Button>
        </Box>
        <Box textAlign="center" mt={4} mb={2}>
          <TextField
            label="Search"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell><b>Item</b></StyledTableCell>
                <StyledTableCell align="right"><b>Quantity</b></StyledTableCell>
                <StyledTableCell align="right"><b>Actions</b></StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item) => (
                <StyledTableRow key={item.name}>
                  <StyledTableCell component="th" scope="row">
                    {item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase()}
                  </StyledTableCell>
                  <StyledTableCell align="right">{item.quantity}</StyledTableCell>
                  <StyledTableCell align="right">
                    <Box display="flex" justifyContent="flex-end">
                      <Button variant="contained" color="secondary" onClick={() => handleOpenQuantityModal(item.name)}>
                        Add
                      </Button>
                      <Button variant="contained" color="error" onClick={() => handleOpenRemoveQuantityModal(item.name)} style={{ marginLeft: '8px' }}>
                        Remove
                      </Button>
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modal for Adding New Item */}
        <Modal open={open} onClose={handleClose}>
          <TransitionFade in={open} timeout={500}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              sx={{
                transform: "translate(-50%, -50%)",
              }}
              bgcolor="background.paper"
              p={4}
              display="flex"
              flexDirection="column"
              borderRadius={2}
              boxShadow={24}
              width={{ xs: '90%', sm: '400px' }} 
            >
              <Typography variant="h6" component="h2" gutterBottom>
                Add New Item
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Item Name"
                  variant="outlined"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Quantity"
                  variant="outlined"
                  type="number"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                  fullWidth
                />
                <Button variant="contained" color="primary" onClick={handleAddItem}>
                  Add Item
                </Button>
              </Stack>
            </Box>
          </TransitionFade>
        </Modal>

        {/* Modal for Specifying Quantity to Add */}
        <Modal open={quantityModalOpen} onClose={handleClose}>
          <TransitionFade in={quantityModalOpen} timeout={500}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              sx={{
                transform: "translate(-50%, -50%)",
              }}
              bgcolor="background.paper"
              p={4}
              display="flex"
              flexDirection="column"
              borderRadius={2}
              boxShadow={24}
              width={{ xs: '90%', sm: '400px' }}
            >
              <Typography variant="h6" component="h2" gutterBottom>
                Add Quantity
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Quantity"
                  variant="outlined"
                  type="number"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                  fullWidth
                />
                <Button variant="contained" color="primary" onClick={() => handleAddItem(itemName, quantityToAdd)}>
                  Add Quantity
                </Button>
              </Stack>
            </Box>
          </TransitionFade>
        </Modal>
        <Box mt={4} textAlign="center">
          <Button variant="contained" color="primary" onClick={handleGenerateRecipes} fullWidth>
            Generate Recipes
          </Button>
        </Box>
        {recipes.length > 0 && (
            <Box mt={4}>
              <Typography variant="h6" component="h3" gutterBottom>
                Suggested Recipes ( FROM GEMINI ):
              </Typography>
              <ul>
                {recipes.map((recipe, index) => (
                  <li key={index}>{recipe}</li>
                ))}
              </ul>
            </Box>
          )}
          {/* Snackbar for Alerts */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

const TransitionFade = React.forwardRef(function Transition(props, ref) {
  return <Fade timeout={500} ref={ref} {...props} />;
});
