import { useState } from 'react';

/**
 * Reusable form component for creating/updating an individual.
 * Can be used standalone or within a modal.
 */
export function IndividualFormContent({ mode = 'create', individual, onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    name: individual?.name || '',
    email: individual?.email || '',
    password: individual?.password || '',
    location: individual?.location || 'NA',
    position: individual?.position || 'Employee',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const title = mode === 'create' ? 'Create Individual' : 'Update Individual';

  return (
    <div className="individual-form">
      <h2 className="individual-form__title">{title}</h2>
      
      <form onSubmit={handleSubmit} className="individual-form__form">
        <div className="form-group">
          <label htmlFor="name" className="form-group__label">Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full name"
            className="form-group__input"
            disabled={loading}
          />
          {errors.name && <span className="form-group__error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-group__label">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            className="form-group__input"
            disabled={loading}
          />
          {errors.email && <span className="form-group__error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-group__label">
            Password {mode === 'update' && <span className="form-group__optional">(leave blank to keep current)</span>}
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="form-group__input"
            disabled={loading}
          />
          {errors.password && <span className="form-group__error">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="location" className="form-group__label">Region</label>
          <select
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="form-group__input form-group__select"
            disabled={loading}
          >
            <option value="NA">North America</option>
            <option value="LATAM">Latin America</option>
            <option value="APAC">Asia Pacific</option>
            <option value="EU">Europe</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="position" className="form-group__label">Position</label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="form-group__input form-group__select"
            disabled={loading}
          >
            <option value="Admin">Admin</option>
            <option value="Employee">Employee</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="form-actions__btn form-actions__btn--submit"
            disabled={loading}
          >
            {loading ? 'Submitting…' : (mode === 'create' ? 'Create' : 'Update')}
          </button>
        </div>
      </form>
    </div>
  );
}
