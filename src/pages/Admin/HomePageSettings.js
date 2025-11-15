import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

const HomePageSettingsPage = () => {
  const { notify } = useToast();
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loginImageUrl, setLoginImageUrl] = useState('');
  const [registerImageUrl, setRegisterImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [cats, homepageSettings, loginImageSettings, registerImageSettings] = await Promise.all([
          api.listCategories(),
          api.getSetting('homepageCategories').catch(() => ({ categoryIds: [] })),
          api.getSetting('loginImageUrl').catch(() => ({ value: '' })),
          api.getSetting('registerImageUrl').catch(() => ({ value: '' })),
        ]);
        setCategories(cats);
        setSelectedCategories(homepageSettings.categoryIds || []);
        setLoginImageUrl(loginImageSettings.value || '');
        setRegisterImageUrl(registerImageSettings.value || '');
      } catch (error) {
        notify('Failed to fetch settings', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [notify]);

  const handleToggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        api.updateSetting('homepageCategories', { value: { categoryIds: selectedCategories } }),
        api.updateSetting('loginImageUrl', { value: loginImageUrl }),
        api.updateSetting('registerImageUrl', { value: registerImageUrl }),
      ]);
      notify('Settings saved successfully!', 'success');
    } catch (error) {
      notify('Failed to save settings', 'danger');
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h2>Home Page Settings</h2>
      <h4>Select categories to display on the home page:</h4>
      <div className="list-group mb-4">
        {categories.map((cat) => (
          <label key={cat._id} className="list-group-item">
            <input
              className="form-check-input me-1"
              type="checkbox"
              checked={selectedCategories.includes(cat._id)}
              onChange={() => handleToggleCategory(cat._id)}
            />
            {cat.name}
          </label>
        ))}
      </div>

      <h4>Auth Page Images</h4>
      <div className="mb-3">
        <label className="form-label">Login Page Image URL</label>
        <input
          type="text"
          className="form-control"
          value={loginImageUrl}
          onChange={(e) => setLoginImageUrl(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Register Page Image URL</label>
        <input
          type="text"
          className="form-control"
          value={registerImageUrl}
          onChange={(e) => setRegisterImageUrl(e.target.value)}
        />
      </div>

      <button className="btn btn-primary mt-3" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};

export default HomePageSettingsPage;
