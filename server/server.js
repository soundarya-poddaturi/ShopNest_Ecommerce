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

// Middleware
app.use(cors({ 
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Basic root route
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

// API routes
const router = express.Router();

router.get('/products', (req, res) => {
    res.json(Data);
});

router.get('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = Data.find(product => product.id === productId);
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
    } else {
        res.json(product);
    }
});

router.get('/categories', (req, res) => {
    res.json(Category);
});

router.get('/products/category/:category', (req, res) => {
    const category = req.params.category.toLowerCase();
    const productsByCategory = Data.filter(product => 
        product.category.toLowerCase() === category
    );
    if (productsByCategory.length === 0) {
        res.status(404).json({ error: 'Category not found' });
    } else {
        res.json(productsByCategory);
    }
});

router.get('/users', (req, res) => {
    res.json(Users);
});

router.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = Users.find(user => user.id === userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
    } else {
        res.json(user);
    }
});

router.get('/orders/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userOrders = Orders.filter(order => order.userId === userId);
    if (userOrders.length === 0) {
        res.status(404).json({ error: 'User orders not found' });
    } else {
        res.json(userOrders);
    }
});

// Mount the router
app.use('/api', router);

// Static files
app.use('/images', express.static(path.join(__dirname, 'images')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// 404 handler - keep this last
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;