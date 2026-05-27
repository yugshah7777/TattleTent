import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const user = params.get('user');

    if (token && role && user) {
      const parsedUser = JSON.parse(decodeURIComponent(user));

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(parsedUser));
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      switch (role) {
        case 'Citizen':
          navigate('/citizen-dashboard');
          break;
        case 'Staff':
          navigate('/staff-dashboard');
          break;
        case 'Ringmaster':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      navigate('/'); // redirect to login if missing token/role/name
    }
  }, [location, navigate]);

  return (
    <div className="app-loader" aria-live="polite">
      <span className="sr-only">Completing secure sign in</span>
    </div>
  );
};

export default AuthSuccess;
