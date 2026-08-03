import Icon from '../../components/Icon';
import './ResidenceVerificationBanner.css';

export default function ResidenceVerificationBanner({ verification, onDismiss, onOpen, onReview }) {
  if (!verification) return null;

  const matchedHistory = (verification.history || []).filter((item) => String(item.matchStatus || '').toUpperCase() === 'MATCHED');
  if (verification.status === 'COMPLETED' && !matchedHistory.length) return null;

  if (!verification.isVerified) return <section className="residence-verification-banner residence-verification-banner--pending">
    <span className="residence-verification-banner__icon"><Icon name="shield" size={22} /></span>
    <div><b>실거주 인증을 완료해 보세요</b><p>인증하면 실거주 리뷰와 인증 배지를 확인할 수 있어요.</p></div>
    <button className="residence-verification-banner__review" onClick={onOpen}>실거주 인증하러 가기</button>
    <button className="residence-verification-banner__close" onClick={onDismiss} aria-label="실거주 인증 안내 닫기"><Icon name="close" size={15} /></button>
  </section>;

  if (!matchedHistory.length) return null;
  const matchedAddress = matchedHistory.find((item) => item.current) || matchedHistory[0];

  return <section className="residence-verification-banner">
    <span className="residence-verification-banner__icon"><Icon name="check" size={22} /></span>
    <div><b>{matchedAddress.address}, 실거주 인증되어 있어요</b><p>{verification.rewardMessage}</p></div>
    <button className="residence-verification-banner__review" onClick={() => onReview?.(matchedAddress)}>리뷰 쓰고 혜택 받기</button>
    <button className="residence-verification-banner__close" onClick={onDismiss} aria-label="실거주 인증 안내 닫기"><Icon name="close" size={15} /></button>
  </section>;
}
