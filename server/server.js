require('dotenv').config(); 
const Products = require('./Products');
const Data = require('./Data');
const Category = require('./Categories');
const Users = require('./Users');
const Orders = require('./Orders');
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Enable CORS for all routes
// app.use(cors());
app.use(cors({
  origin: process.env.FRONTEND_URL,  // Corrected: use process.env.FRONTEND_URL
}));
app.use('/images', express.static(path.join(__dirname, 'images')));


app.all('*', (req, res) => {
  console.log('Request URL:', req.url);
  res.status(404).json({ error: 'Route not found' });
});

app.get('/products', (req, res) => {
    res.json(Data);
});

app.get('/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = Data.find(product => product.id === productId);
  
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
  } else {
    res.json(product);
  }
});

app.get('/categories', (req, res) => {
    res.send(Category);
});

app.get('/products/category/:category', (req, res) => {
  const category = req.params.category.toLowerCase();
  const productsByCategory = Data.filter(product => product.category.toLowerCase() === category);
  
  if (productsByCategory.length === 0) {
    res.status(404).json({ error: 'Category not found' });
  } else {
    res.json(productsByCategory);
  }
});

app.get('/users', (req, res) => {
  res.json(Users);
});

app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = Users.find(user => user.id === userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
  } else {
    res.json(user);
  }
});

app.get('/orders/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userOrders = Orders.filter(order => order.userId === userId);

  if (userOrders.length === 0) {
    res.status(404).json({ error: 'User orders not found' });
  } else {
    res.json(userOrders);
  }
});

// Export the app for Vercel
module.exports = app;
