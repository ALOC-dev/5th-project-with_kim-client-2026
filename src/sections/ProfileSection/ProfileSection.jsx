import './ProfileSection.css';

export default function ProfileSection({ onOpenOnboarding }) {
  return <section className="content-section profile-section"><header><div><h1>내 정보</h1><p>나의 자취방 탐색 조건을 관리해요.</p></div><button>프로필 수정</button></header><section className="profile-section__user"><span>김</span><div><h2>김시립</h2><p>서울시립대학교 컴퓨터과학부</p><small>카카오 계정으로 로그인됨</small></div></section><section className="profile-section__location"><div><b>내가 설정한 건물</b><strong>정보기술관</strong><span>서울시립대학교 캠퍼스 · 도보 거리 기준</span></div><button onClick={onOpenOnboarding}>변경</button></section><section className="profile-section__settings"><h2>알림 설정</h2><label><span><b>조건 맞춤 새 매물 알림</b><small>설정한 예산과 거리에 맞는 매물을 알려드려요.</small></span><input type="checkbox" defaultChecked /></label><label><span><b>찜한 매물 가격 변동</b><small>찜한 매물의 가격 또는 계약 상태가 바뀌면 알려드려요.</small></span><input type="checkbox" defaultChecked /></label></section></section>;
}
