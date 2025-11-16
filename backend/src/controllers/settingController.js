const Setting = require('../models/Setting');
const Category = require('../models/Category');

/**
 * Get a setting by key
 * @desc    GET /api/settings/:key
 * @access  Public (or Private depending on the key)
 */
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

/**
 * Update a setting by key
 * @desc    PUT /api/settings/:key
 * @access  Private/Admin
 */
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

/**
 * Get homepage display settings
 * @desc    GET /api/settings/homepage
 * @access  Public
 */
const getHomepageSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'homepage_display' }).lean();

    // If no settings exist, return default
    if (!settings) {
      const allCategories = await Category.find({ isActive: { $ne: false } })
        .select('_id name slug')
        .lean();

      return res.json({
        visibleCategories: allCategories.map(cat => cat._id),
        categoryOrder: allCategories.map(cat => cat._id),
        showFeaturedProducts: true,
        showNewArrivals: true,
        showSaleProducts: true,
        itemsPerRow: 4,
        itemsPerPage: 12,
      });
    }

    res.json(settings.value);
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
};

/**
 * Save homepage display settings (Admin)
 * @desc    POST /api/admin/settings/homepage
 * @access  Private/Admin
 */
const saveHomepageSettings = async (req, res) => {
  try {
    const {
      visibleCategories = [],
      categoryOrder = [],
      showFeaturedProducts = true,
      showNewArrivals = true,
      showSaleProducts = true,
      itemsPerRow = 4,
      itemsPerPage = 12,
    } = req.body;

    // Validate category IDs
    if (visibleCategories.length > 0) {
      const categories = await Category.find({
        _id: { $in: visibleCategories },
        isActive: { $ne: false },
      }).countDocuments();

      if (categories !== visibleCategories.length) {
        return res.status(400).json({ message: 'Some categories do not exist or are inactive' });
      }
    }

    const settings = await Setting.findOneAndUpdate(
      { key: 'homepage_display' },
      {
        value: {
          visibleCategories,
          categoryOrder,
          showFeaturedProducts,
          showNewArrivals,
          showSaleProducts,
          itemsPerRow,
          itemsPerPage,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Homepage settings updated successfully',
      settings: settings.value,
    });
  } catch (error) {
    console.error('Error saving homepage settings:', error);
    res.status(500).json({ message: 'Failed to save settings', error: error.message });
  }
};

/**
 * Get all settings (Admin)
 * @desc    GET /api/admin/settings
 * @access  Private/Admin
 */
const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find({}).lean();
    const settingsMap = {};

    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    res.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
};

/**
 * Get categories for admin selection
 * @desc    GET /api/admin/settings/categories
 * @access  Private/Admin
 */
const getAvailableCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: { $ne: false } })
      .select('_id name slug description')
      .lean();

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};

module.exports = {
  getSetting,
  updateSetting,
  getHomepageSettings,
  saveHomepageSettings,
  getAllSettings,
  getAvailableCategories,
};
