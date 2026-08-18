import Icon from '../Icon';
import './BusinessSidebar.css';

export default function BusinessSidebar({ activeSection, onNavigate, onOpenRiskGuide }) {
  const items = [
    { id: 'list', label: '홈', icon: 'home' },
    { id: 'register', label: '매물 등록', icon: 'plus' },
    { id: 'list', label: '등록 매물 확인', icon: 'room' },
  ];

  return <aside className="business-sidebar">
    <button className="business-sidebar__brand" type="button" onClick={() => onNavigate('list')}>
      <span className="business-sidebar__logo"><Icon name="home" size={19} /></span>
      <span><b>시립대 방구하기</b><small>시립대 학생 전용</small></span>
    </button>
    <nav className="business-sidebar__nav" aria-label="관리자 메뉴">
      {items.map((item, index) => <button
        key={`${item.label}-${index}`}
        type="button"
        className={`business-sidebar__item ${(item.label === '등록 매물 확인' && activeSection === 'list') || (item.label === '매물 등록' && activeSection === 'register') ? 'is-active' : ''}`}
        onClick={() => onNavigate(item.id)}
      >
        <Icon name={item.icon} size={17} />
        <span>{item.label}</span>
        {item.label === '매물 등록' && <em>관리자</em>}
      </button>)}
    </nav>
    <button className="business-sidebar__risk" type="button" onClick={onOpenRiskGuide}>
      <b>전세사기 위험도 진단</b>
      <span>매물마다 위험도를 확인하고 계약하세요</span>
    </button>
  </aside>;
}
