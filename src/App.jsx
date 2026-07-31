import { useEffect, useRef, useState } from 'react';
import HousingPage from './pages/HousingPage';
import LoginPage from './pages/LoginPage';
import { exchangeKakaoCode, getCurrentUserId, getCurrentUsername, hasAccessToken, logout } from './services';

export default function App() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(hasAccessToken());
  const [userId, setUserId] = useState(getCurrentUserId());
  const [username, setUsername] = useState(getCurrentUsername());
  const [authError, setAuthError] = useState('');
  const [pathname, setPathname] = useState(window.location.pathname);
  const processedAuthorizationCode = useRef(false);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setPathname(path);
  };

  useEffect(() => {
    async function checkSession() {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code && !processedAuthorizationCode.current) {
        // StrictMode development runs effects twice; exchange each authorization code once.
        processedAuthorizationCode.current = true;
        try {
          const loginResponse = await exchangeKakaoCode(code);
          setIsAuthenticated(true);
          setUserId(String(loginResponse.id));
          setUsername(loginResponse.username || getCurrentUsername());
          window.history.replaceState({}, document.title, '/');
          setPathname('/');
        } catch (error) {
          setAuthError('카카오 로그인 처리에 실패했어요. 다시 시도해 주세요.');
        }
      }
      setIsCheckingSession(false);
    }
    checkSession();
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setUserId(null);
    setUsername(null);
    navigate('/');
  };

  if (isCheckingSession) return <main className="app-loading">로그인 정보를 확인하고 있어요.</main>;
  if (pathname === '/login') return <LoginPage authError={authError} />;
  return <HousingPage isAuthenticated={isAuthenticated} userId={userId} username={username} onRequireLogin={() => navigate('/login')} onLogout={handleLogout} />;
}
