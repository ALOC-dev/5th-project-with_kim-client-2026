import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import './ReviewFormModal.css';

const ratingLabels = [
  ['cleanlinessRating', '청결'],
  ['managementRating', '관리'],
  ['locationRating', '위치'],
  ['priceRating', '가격'],
];

export default function ReviewFormModal({ listing, verification, initialReview, isSubmitting, error, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState(() => initialReview?.ratings || { cleanlinessRating: 0, managementRating: 0, locationRating: 0, priceRating: 0 });
  const [text, setText] = useState(initialReview?.text || '');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [verificationHelp, setVerificationHelp] = useState('');
  const isValid = text.trim().length > 0 && Object.values(ratings).every((rating) => rating > 0);
  const isVerified = verification?.isVerified === true;
  const isEditing = Boolean(initialReview);

  useEffect(() => {
    const previews = photos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [photos]);

  const submitReview = async () => {
    if (!isValid || isSubmitting) return;
    const payload = { ...ratings, text: text.trim() };
    if (isEditing) {
      payload.imageUrl1 = initialReview.imageUrls?.[0] || null;
      payload.imageUrl2 = initialReview.imageUrls?.[1] || null;
      payload.imageUrl3 = initialReview.imageUrls?.[2] || null;
    }
    await onSubmit(payload);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    submitReview();
  };
  const goToReviewStep = () => {
    setStep(2);
    setShowVerificationPrompt(!isVerified);
    setVerificationHelp('');
  };
  const handlePhotoChange = (event) => {
    const nextPhotos = [...photos, ...Array.from(event.target.files || [])].slice(0, 3);
    setPhotos(nextPhotos);
    event.target.value = '';
  };
  const requestVerification = () => {
    setVerificationHelp('실거주 인증 시작 API가 연결되면 여기에서 인증을 진행할 수 있어요. 지금은 인증 없이 리뷰를 등록할 수 있습니다.');
  };

  return <div className="review-form-modal" role="presentation" onMouseDown={onClose}>
    <form className="review-form-modal__sheet" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
      <header><div><span>{isEditing ? '학생 리뷰 수정' : '학생 리뷰 작성'}</span><h2>{listing.title}</h2><p>실거주 인증 리뷰는 더 많은 학생에게 도움이 돼요.</p></div><button type="button" onClick={onClose} aria-label="리뷰 작성 닫기"><Icon name="close" size={20} /></button></header>
      <div className="review-form-modal__progress"><span>{step === 1 ? '1단계 · 사진 및 매물 정보' : '2단계 · 리뷰 내용 및 카테고리'}</span><b>{step} / 2</b><i><em style={{ width: `${step * 50}%` }} /></i></div>

      {step === 1 && <div className="review-form-modal__content review-form-modal__content--first">
        <section className="review-form-modal__property"><PropertyThumbnail listing={listing} /><div><b>{listing.title}</b><span>{listing.address}</span></div></section>
        <section className="review-form-modal__photos"><div><b>사진 업로드</b><span>최대 3장</span></div><div className="review-form-modal__photo-grid">{photoPreviews.map((preview, index) => <div key={preview} className="review-form-modal__photo"><img src={preview} alt={`선택한 리뷰 사진 ${index + 1}`} /><button type="button" onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} aria-label={`사진 ${index + 1} 삭제`}><Icon name="close" size={12} /></button></div>)}{photos.length < 3 && <label className="review-form-modal__photo-add"><input type="file" accept="image/*" multiple onChange={handlePhotoChange} /><Icon name="plus" size={20} /><span>추가</span></label>}</div><small>선택한 사진은 업로드 API 연결 후 리뷰와 함께 저장됩니다.</small></section>
      </div>}

      {step === 2 && <div className="review-form-modal__content">
        {!showVerificationPrompt && <><div className="review-form-modal__ratings">{ratingLabels.map(([key, label]) => <fieldset key={key}><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={ratings[key] >= rating ? 'is-selected' : ''} onClick={() => setRatings((current) => ({ ...current, [key]: rating }))} aria-label={`${label} ${rating}점`}>★</button>)}</div></fieldset>)}</div><label className="review-form-modal__text"><span>후기</span><textarea value={text} maxLength={500} onChange={(event) => setText(event.target.value)} placeholder="좋았던 점과 아쉬운 점을 자유롭게 남겨주세요." /><small>{text.length}/500</small></label>{isVerified && <p className="review-form-modal__verified"><Icon name="check" size={16} /><span><b>실거주 인증 완료</b>인증된 리뷰는 다른 학생에게 더 신뢰받아요.</span></p>}{error && <p className="review-form-modal__error">{error}</p>}</>}
        {showVerificationPrompt && <section className="review-form-modal__verification"><Icon name="shield" size={22} /><div><b>아직 실거주 인증이 안 됐어요</b><p>인증하면 리뷰에 신뢰 배지가 붙어요. 인증 없이도 리뷰는 등록할 수 있어요.</p></div><div className="review-form-modal__verification-actions"><button type="button" onClick={requestVerification}>지금 실거주 인증하기</button><button type="button" onClick={() => { setShowVerificationPrompt(false); setVerificationHelp(''); }}>인증 없이 계속</button></div>{verificationHelp && <small>{verificationHelp}</small>}</section>}
      </div>}

      <footer>{step === 1 ? <button type="button" onClick={goToReviewStep}>다음</button> : showVerificationPrompt ? <button type="button" disabled>{isEditing ? '수정하기' : '등록하기'}</button> : <><button type="button" className="review-form-modal__back-button" onClick={() => setStep(1)}>이전</button><button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? (isEditing ? '수정 중...' : '등록 중...') : (isEditing ? '리뷰 수정하기' : '리뷰 등록하기')}</button></>}</footer>
    </form>
  </div>;
}

function PropertyThumbnail({ listing }) {
  const imageUrl = listing.imageUrls?.[0];
  return <div className="review-form-modal__property-thumbnail">{imageUrl ? <img src={imageUrl} alt="" /> : <span>{listing.title.slice(0, 1)}</span>}</div>;
}
