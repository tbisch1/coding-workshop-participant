import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

/**
 * Navigation bar with Dashboard, Analytics links and Login/Logout button.
 */
export function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.setItem('isLoggedIn', 'false');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <span className="navbar__icon">⬡</span>
          <h1 className="navbar__title">Team Management</h1>
        </div>

        <ul className="navbar__links">
          <li>
            <Link to="/" className="navbar__link">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/analytics" className="navbar__link">
              Analytics
            </Link>
          </li>
        </ul>

        <div className="navbar__auth">
          {!isLoggedIn ? (
            <button className="navbar__login-btn" onClick={handleLogin}>
              Login
            </button>
          ) : (
            <button className="navbar__logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
