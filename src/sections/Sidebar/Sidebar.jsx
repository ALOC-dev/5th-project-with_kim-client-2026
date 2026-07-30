import Icon from '../../components/Icon';
import { navigationItems } from '../../constants/navigation';
import './Sidebar.css';

export default function Sidebar({ activePage, hideRiskGuide, onNavigate, onOpenRiskGuide }) {
  return <aside className="sidebar"><button className="sidebar__brand" onClick={() => onNavigate('home')}><span><Icon name="home" size={19} /></span><div><b>UOS 자취방</b><small>시립대 학생 전용</small></div></button><nav>{navigationItems.map((item) => <button key={item.id} className={activePage === item.id ? 'sidebar__nav is-active' : 'sidebar__nav'} onClick={() => onNavigate(item.id)}><Icon name={item.icon} />{item.label}</button>)}</nav>{!hideRiskGuide && <button className="sidebar__risk" onClick={onOpenRiskGuide}><b>전세사기 위험도 진단</b><span>매물마다 위험도를 확인하고 계약하세요</span></button>}</aside>;
}
