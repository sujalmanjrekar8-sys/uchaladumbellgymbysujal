const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'uchala_dumbell_gym_jwt_secret_sujal_2026',
    { expiresIn: '30d' }
  );
};

const login = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.customId || req.body.username || req.body.email || req.body.userId;
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Gym ID (or Email/Phone) and Password.'
      });
    }

    const cleanIdentifier = identifier.trim();

    const foundUser = await User.findOne({
      $or: [
        { gymId: { $regex: new RegExp(`^${cleanIdentifier}$`, 'i') } },
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier }
      ]
    }).populate('assignedTrainer', 'name gymId phone specialization');

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    if (!foundUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact gym administration.'
      });
    }

    const isMatch = await foundUser.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = generateToken(foundUser._id, foundUser.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: foundUser._id,
        gymId: foundUser.gymId,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        role: foundUser.role,
        assignedTrainer: foundUser.assignedTrainer,
        specialization: foundUser.specialization,
        monthlySalary: foundUser.monthlySalary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login: ' + error.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user._id)
      .select('-password')
      .populate('assignedTrainer', 'name gymId phone specialization');

    res.status(200).json({
      success: true,
      user: me
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters long.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (currentPassword) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your password has been changed successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

module.exports = {
  login,
  getMe,
  changePassword
};