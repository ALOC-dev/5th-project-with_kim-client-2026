import { useEffect, useState } from 'react';
import Icon from '../Icon';
import { getRegistryStatus } from '../../utils/registry';
import './RegistryAnalysisOverlay.css';

export default function RegistryAnalysisOverlay({ status }) {
  const registryStatus = getRegistryStatus({ status });
  const isFinished = registryStatus !== 'PENDING';
  const [progress, setProgress] = useState(isFinished ? 100 : 12);
  const copy = getAnalysisCopy(registryStatus);

  useEffect(() => {
    if (isFinished) {
      setProgress(100);
      return undefined;
    }

    setProgress(12);
    const timer = setInterval(() => {
      setProgress((value) => Math.min(92, value + 4));
    }, 600);

    return () => clearInterval(timer);
  }, [isFinished, status]);

  return (
    <div className="registry-analysis-overlay" role="presentation">
      <section className="registry-analysis-overlay__card" role="status" aria-live="polite">
        <span className={isFinished ? `registry-analysis-overlay__icon ${registryStatus === 'FAILED' ? 'is-failed' : ''}` : 'registry-analysis-overlay__spinner'}>
          {isFinished && <Icon name={registryStatus === 'FAILED' ? 'close' : 'check'} size={18} />}
        </span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <div className="registry-analysis-overlay__progress" role="progressbar" aria-label="등기부등본 분석 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>
    </div>
  );
}

function getAnalysisCopy(registryStatus) {
  if (registryStatus === 'ANALYZED') {
    return { title: '분석이 끝났어요', description: '분석 결과를 매물에 반영하고 있어요.' };
  }
  if (registryStatus === 'NEEDS_MORE_DOCS') {
    return { title: '분석이 끝났어요', description: '추가 서류가 필요해요. 안내에 따라 보완해주세요.' };
  }
  if (registryStatus === 'FAILED') {
    return { title: '분석이 끝났어요', description: '분석에 실패했어요. 잠시 후 다시 시도해주세요.' };
  }

  return { title: '등기부등본을 분석하고 있어요', description: '근저당·가압류·변경일자를 확인 중입니다. 잠시만 기다려주세요.' };
}
