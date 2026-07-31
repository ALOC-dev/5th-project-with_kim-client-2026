import Icon from '../Icon';
import './AuthStatus.css';

export default function AuthStatus({ isAuthenticated, username, userId, onLogin, onLogout }) {
  if (!isAuthenticated) {
    return <button className="auth-status auth-status--login" onClick={onLogin}><Icon name="user" size={16} />로그인</button>;
  }

  return <div className="auth-status auth-status--user"><span className="auth-status__avatar"><Icon name="user" size={16} /></span><span className="auth-status__copy"><b>{username || (userId ? `회원 #${userId}` : '로그인 사용자')}</b><small>카카오 로그인됨</small></span><button onClick={onLogout}>로그아웃</button></div>;
}
