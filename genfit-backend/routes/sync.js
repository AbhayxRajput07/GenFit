const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');

const router = express.Router();

const ensureDbConnected = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' });
        return false;
    }
    return true;
};

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// GET all user data (Activities, Nutrition, Stats, Blueprint)
router.get('/data', verifyToken, async (req, res) => {
    try {
        if (!ensureDbConnected(res)) return;

        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST to update user data
router.post('/data', verifyToken, async (req, res) => {
    try {
        if (!ensureDbConnected(res)) return;

        const { activities, nutrition, stats, blueprint } = req.body;

        const updateData = {};
        if (activities) updateData.activities = activities;
        if (nutrition) updateData.nutrition = nutrition;
        if (stats) updateData.stats = stats;
        if (blueprint) updateData.blueprint = blueprint;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'Data synced successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
