import { useState } from 'react';
import Icon from '../../components/Icon';
import { startKakaoLogin } from '../../services';
import './LoginPage.css';

export default function LoginPage({ authError }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  async function handleKakaoLogin() {
    setIsLoading(true);
    setLoginError('');
    try {
      await startKakaoLogin();
    } catch (error) {
      setLoginError('카카오 로그인 페이지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      setIsLoading(false);
    }
  }

  return <main className="login-page"><section className="login-page__intro"><div className="login-page__orb login-page__orb--top" /><div className="login-page__orb login-page__orb--bottom" /><div className="login-page__brand"><span className="login-page__logo"><Icon name="home" size={31} /></span><h1>UOS 자취방</h1><p>시립대 학생 전용<br />안전한 자취방 탐색 플랫폼</p></div><ul className="login-page__benefits"><li><span>♢</span>실거주 데이터 기반 안전 점수</li><li><Icon name="pin" size={17} />학교 건물까지 도보 시간 제공</li><li><Icon name="message" size={17} />AI 자연어 매물 탐색</li></ul></section><section className="login-page__start"><div className="login-page__form"><h2>시작하기</h2><p>시립대 학생이라면 누구나 무료로 이용할 수 있어요.</p><button className="login-page__kakao" onClick={handleKakaoLogin} disabled={isLoading}>{isLoading ? '카카오 로그인으로 이동 중...' : <><span>●</span> 카카오로 시작하기</>}</button><small><span>♦</span> 카카오 계정으로 간편하게 로그인</small>{(loginError || authError) && <p className="login-page__error" role="alert">{loginError || authError}</p>}</div></section></main>;
}
