const Setting = require('../models/Setting');

// @desc    Get a setting by key
// @route   GET /api/settings/:key
// @access  Public (or Private depending on the key)
const getSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (setting) {
      res.json(setting.value);
    } else {
      res.status(404).json({ message: 'Setting not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a setting by key
// @route   PUT /api/settings/:key
// @access  Private/Admin
const updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { value },
      { upsert: true, new: true }
    );
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getSetting,
  updateSetting,
};
