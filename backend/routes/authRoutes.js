const express = require('express');
const router = express.Router();

const { login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const MembershipPlan = require('../models/MembershipPlan');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Public plans endpoint for landing page
router.get('/plans', async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: { $ne: false } }).sort({ price: 1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;