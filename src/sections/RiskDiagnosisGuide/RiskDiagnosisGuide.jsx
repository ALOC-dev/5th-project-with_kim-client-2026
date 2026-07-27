import Icon from '../../components/Icon';
import './RiskDiagnosisGuide.css';

const diagnosisItems = [
  { icon: 'shield', title: '근저당권', description: '건물에 잡힌 담보 대출 여부' },
  { icon: 'chart', title: '전세가율', description: '매매가 대비 전세금 비율' },
  { icon: 'check', title: 'LH·HUG 보증보험', description: '전세보증금 반환보증 가입 가능 여부' },
];

const steps = [
  '관심 매물의 등기부등본을 업로드해요. (주민번호 뒷자리는 가려도 돼요)',
  '근저당·전세가율·보증보험 가입 여부를 자동으로 분석해요.',
  '매물 상세에서 위험도 등급과 세부 항목을 바로 확인해요.',
];

export default function RiskDiagnosisGuide({ onClose, onGoToFavorites }) {
  return <div className="risk-guide-overlay" onMouseDown={onClose}>
    <section className="risk-guide" role="dialog" aria-modal="true" aria-labelledby="risk-guide-title" onMouseDown={(event) => event.stopPropagation()}>
      <header className="risk-guide__header">
        <span className="risk-guide__badge"><Icon name="shield" size={17} /></span>
        <h1 id="risk-guide-title">전세사기 위험도 진단이란?</h1>
        <button type="button" aria-label="위험도 진단 안내 닫기" onClick={onClose}><Icon name="close" size={14} /></button>
      </header>
      <div className="risk-guide__body">
        <p className="risk-guide__intro">등기부등본을 업로드하면 매물마다 아래 항목을 자동으로 분석해 위험도를 알려드려요.</p>
        <div className="risk-guide__items">{diagnosisItems.map((item) => <article key={item.title}>
          <span><Icon name={item.icon} size={16} /></span>
          <div><b>{item.title}</b><small>{item.description}</small></div>
        </article>)}</div>
        <section className="risk-guide__steps"><h2>진단 절차</h2><ol>{steps.map((step, index) => <li key={step}><i>{index + 1}</i><span>{step}</span></li>)}</ol></section>
      </div>
      <footer><button type="button" onClick={onGoToFavorites}>찜 목록에서 업로드 하러 가기</button></footer>
    </section>
  </div>;
}
