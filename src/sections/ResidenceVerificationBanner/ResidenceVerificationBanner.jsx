import Icon from '../../components/Icon';
import './ResidenceVerificationBanner.css';

export default function ResidenceVerificationBanner({ verification, onDismiss }) {
  if (!verification?.isVerified) return null;

  return <section className="residence-verification-banner">
    <span className="residence-verification-banner__icon"><Icon name="check" size={22} /></span>
    <div><b>{verification.address}, 실거주 인증되어 있어요</b><p>{verification.rewardMessage}</p></div>
    <button className="residence-verification-banner__review">리뷰 쓰고 혜택 받기</button>
    <button className="residence-verification-banner__close" onClick={onDismiss} aria-label="실거주 인증 안내 닫기"><Icon name="close" size={15} /></button>
  </section>;
}
