import Icon from '../../components/Icon';
import AuthStatus from '../../components/AuthStatus';
import './Topbar.css';

export default function Topbar({ count, onOpenFilter, mode, onModeChange, mapOnly = false, isAuthenticated, username, userId, onLogin, onLogout }) {
  return <header className="topbar"><div><h1>시립대 방구하기</h1><p>{mapOnly ? `실거주 데이터로 검증된 매물 ${count}곳` : `실거주 데이터로 검증된 매물 ${count}곳`}</p></div><div className="topbar__actions">{!mapOnly && mode && <div className="topbar__switch"><button className={mode === 'map' ? 'is-active' : ''} onClick={() => onModeChange('map')}>지도</button><button className={mode === 'list' ? 'is-active' : ''} onClick={() => onModeChange('list')}>목록</button></div>}{onOpenFilter && <button className="topbar__filter" onClick={onOpenFilter}><Icon name="filter" size={15} />필터</button>}<AuthStatus isAuthenticated={isAuthenticated} username={username} userId={userId} onLogin={onLogin} onLogout={onLogout} /></div></header>;
}
