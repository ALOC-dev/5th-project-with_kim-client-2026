import Icon from '../Icon';
import './AuthStatus.css';

// TODO: API 연동 필요 - GET '-'
// 설명: 로그인 사용자의 닉네임과 프로필 이미지를 반환하는 사용자 프로필 응답이 필요합니다.
export default function AuthStatus({ isAuthenticated, userId, onLogin, onLogout }) {
  if (!isAuthenticated) {
    return <button className="auth-status auth-status--login" onClick={onLogin}><Icon name="user" size={16} />로그인</button>;
  }

  return <div className="auth-status auth-status--user"><span className="auth-status__avatar"><Icon name="user" size={16} /></span><span className="auth-status__copy"><b>{userId ? `회원 #${userId}` : '로그인 사용자'}</b><small>카카오 로그인됨</small></span><button onClick={onLogout}>로그아웃</button></div>;
}
