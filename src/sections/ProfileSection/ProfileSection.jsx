import { campusBuildings } from '../../constants';
import './ProfileSection.css';

function formatDeposit(value) {
  return value === null ? '제한 없음' : `${value.toLocaleString()}만원`;
}

function getBuildingName(id) {
  return campusBuildings.find((building) => building.id === id)?.name;
}

export default function ProfileSection({ preferences, onOpenBuildingSettings, onOpenBudgetSettings }) {
  const primaryBuilding = getBuildingName(preferences.primaryClassBuildingId || preferences.classBuildingIds[0]);
  const hasSecondaryBuilding = Boolean(preferences.hasSecondaryClassBuilding || preferences.secondaryClassBuildingId || preferences.classBuildingIds[1]);
  const secondaryBuilding = hasSecondaryBuilding && getBuildingName(preferences.secondaryClassBuildingId || preferences.classBuildingIds[1]);
  const buildingSummary = primaryBuilding ? `1순위 ${primaryBuilding}${secondaryBuilding ? ` · 2순위 ${secondaryBuilding}` : ''}` : '아직 설정하지 않았어요';
  const hasBudget = preferences.budgetConfigured === true || (preferences.budgetConfigured === undefined && preferences.maxDeposit !== null && preferences.maxDeposit !== undefined && preferences.maxMonthlyRent !== null && preferences.maxMonthlyRent !== undefined);
  const budgetSummary = hasBudget ? `보증금 ${formatDeposit(preferences.maxDeposit)} · 월세 ${preferences.maxMonthlyRent}만원 이하` : '아직 설정하지 않았어요';

  return <section className="content-section profile-section"><header><div><h1>내 정보</h1><p>나의 자취방 탐색 조건을 관리해요.</p></div><button>프로필 수정</button></header><section className="profile-section__user"><span>김</span><div><h2>김시립</h2><p>서울시립대학교 컴퓨터과학부</p><small>카카오 계정으로 로그인됨</small></div></section><section className="profile-section__preference"><div><b>내가 자주 가는 수업 건물</b><strong>{buildingSummary}</strong><span>선택한 건물까지의 도보 시간을 매물에서 알려드려요.</span></div><button onClick={onOpenBuildingSettings}>변경</button></section><section className="profile-section__preference"><div><b>내 월 예산</b><strong>{budgetSummary}</strong><span>예산에 맞는 새 매물을 우선으로 찾아드려요.</span></div><button onClick={onOpenBudgetSettings}>변경</button></section><section className="profile-section__settings"><h2>알림 설정</h2><label><span><b>조건 맞춤 새 매물 알림</b><small>설정한 예산과 거리에 맞는 매물을 알려드려요.</small></span><input type="checkbox" defaultChecked /></label><label><span><b>찜한 매물 가격 변동</b><small>찜한 매물의 가격 또는 계약 상태가 바뀌면 알려드려요.</small></span><input type="checkbox" defaultChecked /></label></section></section>;
}
