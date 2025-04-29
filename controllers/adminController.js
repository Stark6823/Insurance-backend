const User = require('../models/User');

// Promote a user to AGENT/ADMIN (Admin-only action)
exports.promoteToAgent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body; // Role to assign (AGENT/ADMIN)

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true } // Return updated user
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};