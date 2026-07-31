import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/Icon';
import './ResidenceVerificationModal.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ResidenceVerificationModal({ verification, onClose, onDefer, onComplete }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
  const [error, setError] = useState('');
  const history = useMemo(() => verification?.history?.length ? verification.history : [
    { address: '서울특별시 동대문구 전농동', period: '최근 거주 이력', current: true },
  ], [verification]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    event.target.value = '';
    if (!nextFile) return;
    if (nextFile.type !== 'application/pdf' && !nextFile.name.toLowerCase().endsWith('.pdf')) {
      setFile(null);
      setError('주민등록초본은 PDF 파일만 업로드할 수 있어요.');
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError('파일 용량은 10MB 이하만 업로드할 수 있어요.');
      return;
    }
    setFile(nextFile);
    setError('');
  };

  const goNext = () => {
    if (step === 1) {
      if (!file) {
        setError('주민등록초본 PDF를 먼저 선택해 주세요.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      onComplete?.([history[selectedHistoryIndex]]);
      setStep(3);
    }
  };

  const defer = () => {
    onDefer?.();
    onClose?.();
  };

  return createPortal(
    <div className="residence-verification-modal" role="presentation" onMouseDown={onClose}>
      <section className="residence-verification-modal__sheet" role="dialog" aria-modal="true" aria-labelledby="residence-verification-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="residence-verification-modal__header">
          <div><span className="residence-verification-modal__eyebrow">실거주 인증</span><h2 id="residence-verification-title">{step === 1 ? '증빙 서류 업로드' : step === 2 ? '거주 이력 확인' : '실거주 인증 완료!'}</h2></div>
          <button type="button" onClick={onClose} aria-label="실거주 인증 닫기"><Icon name="close" size={19} /></button>
        </header>

        <div className="residence-verification-modal__progress"><span>{step} / 2단계</span><i><em style={{ width: `${Math.min(step, 2) * 50}%` }} /></i></div>

        {step === 1 && <div className="residence-verification-modal__content">
          <p className="residence-verification-modal__description">주민등록초본을 첨부하면 거주했던 주소와 기간을 자동으로 분석해요.</p>
          <label className="residence-verification-modal__upload" htmlFor="residence-document-file"><Icon name="upload" size={23} /><span><b>{file ? file.name : '주민등록초본 파일 선택'}</b><small>PDF · 최대 10MB</small></span><input id="residence-document-file" aria-label="주민등록초본 파일 선택" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} /></label>
          <p className="residence-verification-modal__notice"><Icon name="info" size={17} />주민번호 뒷자리는 가리고 제출해도 인증에 문제없어요.</p>
          {error && <p className="residence-verification-modal__error" role="alert">{error}</p>}
        </div>}

        {step === 2 && <div className="residence-verification-modal__content">
          <p className="residence-verification-modal__description">서울에서 아래 주소·거주 기간을 확인했어요.</p>
          <p className="residence-verification-modal__success"><Icon name="check" size={17} />주민등록초본 분석 완료</p>
          <div className="residence-verification-modal__history">{history.map((item, index) => <button type="button" key={`${item.address}-${index}`} className={selectedHistoryIndex === index ? 'is-selected' : ''} onClick={() => setSelectedHistoryIndex(index)}><b>{item.address}</b><span>{item.period || '거주 기간 확인 필요'}{item.current ? ' · 이 매물' : ' · 이전 거주지'}</span></button>)}</div>
          <p className="residence-verification-modal__notice"><Icon name="info" size={17} />내용이 다르면 직접 수정할 수 있어요.</p>
        </div>}

        {step === 3 && <div className="residence-verification-modal__complete"><span className="residence-verification-modal__complete-icon"><Icon name="check" size={28} /></span><p>서류 검토가 바로 완료되어<br />인증 배지가 지금 부여됐어요.</p><b>실거주 인증 배지 획득</b><span>이제 실거주 리뷰 데이터를 볼 수 있어요.</span><button type="button" onClick={onClose}>리뷰 작성하기</button></div>}

        <footer className="residence-verification-modal__footer">
          {step < 3 && <><button type="button" className="residence-verification-modal__primary" onClick={goNext}>{step === 1 ? '다음' : '인증 완료'}</button><button type="button" className="residence-verification-modal__defer" onClick={defer}>나중에 할게요</button></>}
          {step === 3 && <button type="button" className="residence-verification-modal__defer" onClick={onClose}>나중에 할게요</button>}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
