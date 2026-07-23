import { useState } from 'react';
import Icon from '../../components/Icon';
import './OnboardingSection.css';

export default function OnboardingSection({ onClose }) {
  const [step, setStep] = useState(1);
  const [building, setBuilding] = useState('정보기술관');
  const [budget, setBudget] = useState('50만원 이하');
  const finish = () => { if (step === 1) setStep(2); else onClose(); };
  return <div className="onboarding-overlay"><section className="onboarding" role="dialog" aria-modal="true"><button className="onboarding__close" onClick={onClose}><Icon name="close" /></button><div className="onboarding__step">{step}/2</div>{step === 1 ? <><span className="onboarding__icon">⌖</span><h1>자주 가는 건물을 설정해요</h1><p>매물에서 건물까지의 실제 도보 거리와 시간을 보여드릴게요.</p><label>건물 검색<input value={building} onChange={(event) => setBuilding(event.target.value)} /></label></> : <><span className="onboarding__icon">₩</span><h1>예산을 알려 주세요</h1><p>예산에 맞는 매물을 먼저 보여드릴게요.</p><div className="onboarding__options">{['40만원 이하', '50만원 이하', '60만원 이하', '상관없음'].map((item) => <button className={budget === item ? 'is-selected' : ''} key={item} onClick={() => setBudget(item)}>{item}</button>)}</div></>}<button className="onboarding__next" onClick={finish}>{step === 1 ? '다음' : '설정 완료'}</button></section></div>;
}
