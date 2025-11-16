const Setting = require('../models/Setting');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../../public/auth-images');

// Create directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Get login/register page images
 * @desc    GET /api/settings/auth-images
 * @access  Public
 */
const getAuthImages = async (req, res) => {
  try {
    const images = await Setting.findOne({ key: 'auth_images' }).lean();

    if (!images) {
      return res.json({
        loginBackground: null,
        registerBackground: null,
      });
    }

    res.json(images.value);
  } catch (error) {
    console.error('Error fetching auth images:', error);
    res.status(500).json({ message: 'Failed to fetch auth images', error: error.message });
  }
};

/**
 * Upload login page background image
 * @desc    POST /api/admin/settings/auth-images/login
 * @access  Private/Admin
 */
const uploadLoginImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'File must be an image' });
    }

    // Generate filename
    const filename = `login-${Date.now()}-${req.file.originalname}`;
    const filepath = path.join(IMAGES_DIR, filename);

    // Save file
    fs.writeFileSync(filepath, req.file.buffer);

    // Update settings
    let settings = await Setting.findOne({ key: 'auth_images' });
    if (!settings) {
      settings = new Setting({ key: 'auth_images', value: {} });
    }

    // Delete old file if exists
    if (settings.value.loginBackground) {
      const oldPath = path.join(IMAGES_DIR, path.basename(settings.value.loginBackground));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    settings.value.loginBackground = `/auth-images/${filename}`;
    await settings.save();

    res.json({
      message: 'Login image uploaded successfully',
      url: settings.value.loginBackground,
    });
  } catch (error) {
    console.error('Error uploading login image:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};

/**
 * Upload register page background image
 * @desc    POST /api/admin/settings/auth-images/register
 * @access  Private/Admin
 */
const uploadRegisterImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'File must be an image' });
    }

    // Generate filename
    const filename = `register-${Date.now()}-${req.file.originalname}`;
    const filepath = path.join(IMAGES_DIR, filename);

    // Save file
    fs.writeFileSync(filepath, req.file.buffer);

    // Update settings
    let settings = await Setting.findOne({ key: 'auth_images' });
    if (!settings) {
      settings = new Setting({ key: 'auth_images', value: {} });
    }

    // Delete old file if exists
    if (settings.value.registerBackground) {
      const oldPath = path.join(IMAGES_DIR, path.basename(settings.value.registerBackground));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    settings.value.registerBackground = `/auth-images/${filename}`;
    await settings.save();

    res.json({
      message: 'Register image uploaded successfully',
      url: settings.value.registerBackground,
    });
  } catch (error) {
    console.error('Error uploading register image:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
};

/**
 * Delete login image
 * @desc    DELETE /api/admin/settings/auth-images/login
 * @access  Private/Admin
 */
const deleteLoginImage = async (req, res) => {
  try {
    const settings = await Setting.findOne({ key: 'auth_images' });

    if (!settings || !settings.value.loginBackground) {
      return res.status(404).json({ message: 'Login image not found' });
    }

    // Delete file
    const filepath = path.join(IMAGES_DIR, path.basename(settings.value.loginBackground));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Update settings
    settings.value.loginBackground = null;
    await settings.save();

    res.json({ message: 'Login image deleted successfully' });
  } catch (error) {
    console.error('Error deleting login image:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};

/**
 * Delete register image
 * @desc    DELETE /api/admin/settings/auth-images/register
 * @access  Private/Admin
 */
const deleteRegisterImage = async (req, res) => {
  try {
    const settings = await Setting.findOne({ key: 'auth_images' });

    if (!settings || !settings.value.registerBackground) {
      return res.status(404).json({ message: 'Register image not found' });
    }

    // Delete file
    const filepath = path.join(IMAGES_DIR, path.basename(settings.value.registerBackground));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Update settings
    settings.value.registerBackground = null;
    await settings.save();

    res.json({ message: 'Register image deleted successfully' });
  } catch (error) {
    console.error('Error deleting register image:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
};

module.exports = {
  getAuthImages,
  uploadLoginImage,
  uploadRegisterImage,
  deleteLoginImage,
  deleteRegisterImage,
};
