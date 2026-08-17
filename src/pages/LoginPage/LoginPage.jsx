import { useState } from 'react';
import Icon from '../../components/Icon';
import { SEOUL_DISTRICTS, SEOUL_GU_OPTIONS } from '../../constants';
import { loginBusinessUser, requestBrokerSignup, startKakaoLogin } from '../../services';
import './LoginPage.css';

const DEFAULT_SIGNUP_GU = '동대문구';

export default function LoginPage({ authError, onBusinessLogin }) {
  const [loginMode, setLoginMode] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [selectedGu, setSelectedGu] = useState(DEFAULT_SIGNUP_GU);
  const [selectedDong, setSelectedDong] = useState(SEOUL_DISTRICTS[DEFAULT_SIGNUP_GU][0]);
  const [licenseFileName, setLicenseFileName] = useState('');
  const isBusinessMode = loginMode !== 'student';
  const isBrokerSignupMode = loginMode === 'brokerSignup';

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

  async function handleBusinessLogin(event) {
    event.preventDefault();
    setIsLoading(true);
    setLoginError('');
    const formData = new FormData(event.currentTarget);
    try {
      const loginResponse = await loginBusinessUser({
        loginId: formData.get('loginId'),
        password: formData.get('password'),
      });
      onBusinessLogin?.(loginResponse);
    } catch (error) {
      setLoginError(error.message || '사업자 로그인에 실패했어요. 다시 시도해 주세요.');
      setIsLoading(false);
    }
  }

  async function handleBrokerSignup(event) {
    event.preventDefault();
    setLoginError('');
    setSignupSuccess('');
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    if (password !== confirmPassword) {
      setLoginError('비밀번호가 일치하지 않아요.');
      return;
    }

    setIsLoading(true);
    try {
      await requestBrokerSignup({
        loginId: formData.get('loginId'),
        username: formData.get('username'),
        password,
        confirmPassword,
      });
      setLoginMode('business');
      setSignupSuccess('가입이 완료됐어요. 사업자 로그인을 진행해 주세요.');
    } catch (error) {
      setLoginError(error.message || '회원가입에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(nextMode) {
    setLoginMode(nextMode);
    setLoginError('');
    setSignupSuccess('');
    setIsLoading(false);
  }

  function handleGuChange(event) {
    const nextGu = event.target.value;
    setSelectedGu(nextGu);
    setSelectedDong(SEOUL_DISTRICTS[nextGu][0]);
  }

  function handleLicenseFileChange(event) {
    setLicenseFileName(event.target.files?.[0]?.name || '');
  }

  const benefits = isBusinessMode
    ? isBrokerSignupMode
      ? [
          { icon: 'home', label: '공인중개사 가입 신청 후 관리자 확인을 거쳐 승인돼요' },
        ]
      : [
        { icon: 'check', label: '매물 등록 및 관리' },
        { icon: 'shield', label: '등기부등본 분석 현황 확인' },
      ]
    : [
        { symbol: '♢', label: '실거주 데이터 기반 안전 점수' },
        { icon: 'pin', label: '학교 건물까지 도보 시간 제공' },
        { icon: 'message', label: 'AI 자연어 매물 탐색' },
      ];

  return <main className={`login-page ${isBusinessMode ? 'login-page--business' : ''}`}>
    <section className="login-page__intro">
      <div className="login-page__orb login-page__orb--top" />
      <div className="login-page__orb login-page__orb--bottom" />
      <div className="login-page__brand">
        <span className="login-page__logo"><Icon name="home" size={31} /></span>
        <h1>UOS 자취방</h1>
        <p>{isBusinessMode ? <>공인중개사 · 매물 등록 관리자용<br />비즈니스 콘솔</> : <>시립대 학생 전용<br />안전한 자취방 탐색 플랫폼</>}</p>
      </div>
      <ul className="login-page__benefits">{benefits.map((benefit) => <li key={benefit.label}>{benefit.symbol ? <span>{benefit.symbol}</span> : <Icon name={benefit.icon} size={17} />}{benefit.label}</li>)}</ul>
    </section>
    <section className="login-page__start">
      {!isBusinessMode ? <div className="login-page__form">
        <h2>시작하기</h2>
        <p>시립대 학생이라면 누구나 무료로 이용할 수 있어요.</p>
        <button className="login-page__kakao" onClick={handleKakaoLogin} disabled={isLoading} aria-label="카카오로 시작하기">{isLoading ? '카카오 로그인으로 이동 중...' : <><span>●</span> 카카오로 시작하기</>}</button>
        <small><span>♦</span> 카카오 계정으로 간편하게 로그인</small>
        <div className="login-page__divider" />
        <p className="login-page__switch">매물을 등록하는 공인중개사이신가요? <button type="button" onClick={() => switchMode('business')}>사업자 로그인</button></p>
        {(loginError || authError) && <p className="login-page__error" role="alert">{loginError || authError}</p>}
      </div> : isBrokerSignupMode ? <form className="login-page__form login-page__business-form login-page__signup-form" onSubmit={handleBrokerSignup}>
        <h2>중개사 가입 신청</h2>
        <p>활동 지역과 자격증 정보를 입력해주세요</p>
        <label>활동 지역 (중개사무소 소재지)</label>
        <div className="login-page__area-selects">
          <select aria-label="구 선택" value={selectedGu} onChange={handleGuChange}>{SEOUL_GU_OPTIONS.map((gu) => <option key={gu} value={gu}>{gu}</option>)}</select>
          <select aria-label="동 선택" value={selectedDong} onChange={(event) => setSelectedDong(event.target.value)}>{SEOUL_DISTRICTS[selectedGu].map((dong) => <option key={dong} value={dong}>{dong}</option>)}</select>
        </div>
        <input className="login-page__area-summary" value={`${selectedGu} · ${selectedDong}`} readOnly aria-label="선택한 활동 지역" />
        <label htmlFor="broker-signup-id">아이디</label>
        <input id="broker-signup-id" name="loginId" type="text" placeholder="사용할 아이디를 입력하세요" autoComplete="username" required />
        <label htmlFor="broker-signup-username">사용자 이름</label>
        <input id="broker-signup-username" name="username" type="text" placeholder="이름을 입력하세요" autoComplete="name" required />
        <label htmlFor="broker-signup-password">비밀번호</label>
        <input id="broker-signup-password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" required />
        <label htmlFor="broker-signup-confirm-password">비밀번호 확인</label>
        <input id="broker-signup-confirm-password" name="confirmPassword" type="password" placeholder="비밀번호를 다시 입력하세요" autoComplete="new-password" required />
        <label htmlFor="broker-license-file">공인중개사 자격증</label>
        <label className="login-page__license-upload" htmlFor="broker-license-file"><Icon name="upload" size={16} /><span>{licenseFileName || '자격증 사진 업로드'}</span></label>
        <input id="broker-license-file" className="login-page__license-input" type="file" accept="image/*,application/pdf" onChange={handleLicenseFileChange} />
        <button className="login-page__business-submit" type="submit" disabled={isLoading}>{isLoading ? '신청 중...' : '가입 신청하기'}</button>
        <p className="login-page__switch login-page__switch--after-submit">이미 계정이 있으신가요? <button type="button" onClick={() => switchMode('business')}>사업자 로그인으로 돌아가기</button></p>
        {loginError && <p className="login-page__error" role="alert">{loginError}</p>}
      </form> : <form className="login-page__form login-page__business-form" onSubmit={handleBusinessLogin}>
        <h2>사업자 로그인</h2>
        <p>공인중개사 등록번호로 로그인해 매물을 등록하세요</p>
        <label htmlFor="business-login-id">아이디</label>
        <input id="business-login-id" name="loginId" type="text" placeholder="아이디를 입력하세요" autoComplete="username" />
        <label htmlFor="business-password">비밀번호</label>
        <input id="business-password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
        <button className="login-page__business-submit" type="submit" disabled={isLoading}>{isLoading ? '로그인 중...' : '로그인'}</button>
        <p className="login-page__switch login-page__switch--after-submit">아직 등록된 계정이 없으신가요? <button type="button" onClick={() => switchMode('brokerSignup')}>중개사 가입 신청</button></p>
        <div className="login-page__divider" />
        <p className="login-page__switch">학생이신가요? <button className="login-page__back-to-student" type="button" onClick={() => switchMode('student')}>학생 로그인으로 돌아가기</button></p>
        {signupSuccess && <p className="login-page__success" role="status">{signupSuccess}</p>}
        {loginError && <p className="login-page__error" role="alert">{loginError}</p>}
      </form>}
    </section>
  </main>;
}
