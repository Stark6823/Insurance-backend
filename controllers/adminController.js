const User = require('../models/User');

exports.getAllAgents =  async (req, res) => {
  try {
    const agents = await User.find({ role: 'AGENT' })
      .sort({ createdAt: -1 })
      .select('_id firstName lastName email createdAt');
    res.json(agents);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ message: 'Server error' });
  }
}


exports.deleteAgent = async (req, res) => {
  try {
    const agent = await User.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    res.json({ message: 'Agent deleted successfully' });
  } catch (err) {
    console.error('Error deleting agent:', err);
    res.status(500).json({ message: 'Server error' });
  }
}