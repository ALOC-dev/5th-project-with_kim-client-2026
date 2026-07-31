import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/Icon';
import './ResidenceVerificationModal.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VERIFICATION_POLL_INTERVAL_MS = 20 * 1000;

export default function ResidenceVerificationModal({ verification, onClose, onDefer, onComplete, onUpload }) {
  const [step, setStep] = useState(verification?.status === 'COMPLETED' ? 2 : 1);
  const [file, setFile] = useState(null);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeferring, setIsDeferring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(verification?.status === 'PENDING');
  const history = useMemo(() => verification?.history?.length ? verification.history : [
    { address: '서울특별시 동대문구 전농동', period: '최근 거주 이력', current: true },
  ], [verification]);

  useEffect(() => {
    if (verification?.status !== 'COMPLETED') return;
    const currentIndex = history.findIndex((item) => item.current);
    if (currentIndex >= 0) setSelectedHistoryIndex(currentIndex);
  }, [verification?.status, history]);

  useEffect(() => {
    if (verification?.status === 'PENDING') {
      setIsProcessing(true);
      return;
    }
    if (verification?.status === 'COMPLETED' && isProcessing) {
      setIsProcessing(false);
      setStep(2);
      return;
    }
    if (verification?.status === 'FAILED') {
      setIsProcessing(false);
      setStep(1);
      setError(verification.error || '주민등록초본 분석에 실패했어요. 파일을 다시 업로드해 주세요.');
    }
  }, [verification?.status, verification?.error, isProcessing]);

  useEffect(() => {
    if (!isProcessing || !verification || typeof verification.refreshVerification !== 'function') return undefined;
    const timer = window.setInterval(() => {
      verification.refreshVerification().catch(() => {});
    }, VERIFICATION_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isProcessing, verification]);

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

  const goNext = async () => {
    if (step === 1) {
      if (!file) {
        setError('주민등록초본 PDF를 먼저 선택해 주세요.');
        return;
      }
      if (onUpload) {
        setIsUploading(true);
        setError('');
        try {
          const result = await onUpload(file);
          if (result?.status === 'PENDING') {
            setIsUploading(false);
            setIsProcessing(true);
            return;
          }
          if (result?.status === 'FAILED') {
            setIsUploading(false);
            setError(result.error || '주민등록초본 분석에 실패했어요. 파일을 다시 업로드해 주세요.');
            return;
          }
        } catch {
          setError('주민등록초본 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.');
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      onComplete?.([history[selectedHistoryIndex]]);
      setStep(3);
    }
  };

  const defer = async () => {
    if (isDeferring) return;
    setIsDeferring(true);
    setError('');
    try {
      await onDefer?.();
      onClose?.();
    } catch {
      setError('실거주 인증을 나중에 하도록 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDeferring(false);
    }
  };

  return createPortal(
    <div className="residence-verification-modal" role="presentation" onMouseDown={onClose}>
      <section className="residence-verification-modal__sheet" role="dialog" aria-modal="true" aria-labelledby="residence-verification-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="residence-verification-modal__header">
          <div><span className="residence-verification-modal__eyebrow">실거주 인증</span><h2 id="residence-verification-title">{step === 1 ? '증빙 서류 업로드' : step === 2 ? '거주 이력 확인' : '실거주 인증 완료!'}</h2></div>
          <button type="button" onClick={onClose} aria-label="실거주 인증 닫기"><Icon name="close" size={19} /></button>
        </header>

        <div className="residence-verification-modal__progress"><span>{step} / 2단계</span><i><em style={{ width: `${Math.min(step, 2) * 50}%` }} /></i></div>

        {step === 1 && !isProcessing && <div className="residence-verification-modal__content">
          <p className="residence-verification-modal__description">주민등록초본을 첨부하면 거주했던 주소와 기간을 자동으로 분석해요.</p>
          <label className="residence-verification-modal__upload" htmlFor="residence-document-file"><Icon name="upload" size={23} /><span><b>{file ? file.name : '주민등록초본 파일 선택'}</b><small>PDF · 최대 10MB</small></span><input id="residence-document-file" aria-label="주민등록초본 파일 선택" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} /></label>
          <p className="residence-verification-modal__notice"><Icon name="info" size={17} />주민번호 뒷자리는 가리고 제출해도 인증에 문제없어요.</p>
          {error && <p className="residence-verification-modal__error" role="alert">{error}</p>}
        </div>}

        {step === 1 && isProcessing && <div className="residence-verification-modal__processing">
          <span className="residence-verification-modal__spinner" aria-hidden="true" />
          <h3>주민등록초본을 분석하고 있어요</h3>
          <p>주소와 거주 기간을 확인하고 있어요.<br />잠시만 기다려 주세요.</p>
        </div>}

        {step === 2 && <div className="residence-verification-modal__content">
          <p className="residence-verification-modal__description">서울에서 아래 주소·거주 기간을 확인했어요.</p>
          <p className="residence-verification-modal__success"><Icon name="check" size={17} />주민등록초본 분석 완료</p>
          <div className="residence-verification-modal__history">{history.map((item, index) => <button type="button" key={`${item.address}-${index}`} className={selectedHistoryIndex === index ? 'is-selected' : ''} onClick={() => setSelectedHistoryIndex(index)}><b>{item.address}</b><span>{formatResidencePeriod(item.period)}{item.current ? ' · 이 매물' : ' · 이전 거주지'}</span></button>)}</div>
          <p className="residence-verification-modal__notice"><Icon name="info" size={17} />내용이 다르면 직접 수정할 수 있어요.</p>
        </div>}

        {step === 3 && <div className="residence-verification-modal__complete"><span className="residence-verification-modal__complete-icon"><Icon name="check" size={28} /></span><p>서류 검토가 바로 완료되어<br />인증 배지가 지금 부여됐어요.</p><b>실거주 인증 배지 획득</b><span>이제 실거주 리뷰 데이터를 볼 수 있어요.</span><button type="button" onClick={onClose}>리뷰 작성하기</button></div>}

        <footer className="residence-verification-modal__footer">
          {step < 3 && !isProcessing && <>{step !== 1 && error && <p className="residence-verification-modal__error" role="alert">{error}</p>}<button type="button" className="residence-verification-modal__primary" disabled={isUploading || isDeferring} onClick={goNext}>{isUploading ? '업로드 중...' : step === 1 ? '다음' : '인증 완료'}</button><button type="button" className="residence-verification-modal__defer" disabled={isUploading || isDeferring} onClick={defer}>{isDeferring ? '저장 중...' : '나중에 할게요'}</button></>}
          {step === 3 && <button type="button" className="residence-verification-modal__defer" onClick={onClose}>나중에 할게요</button>}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function formatResidencePeriod(period) {
  if (!period) return '거주 기간 확인 필요';
  const formatted = String(period).split(' · ').map((value) => {
    const trimmed = value.trim();
    return /^\d{4}$/.test(trimmed) ? `${trimmed}년` : trimmed;
  }).join(' · ');
  return /^\d{4}년$/.test(formatted) ? `${formatted} 입주` : formatted;
}
