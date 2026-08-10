import { campusBuildings } from '../../constants';
import './ProfileSection.css';

function formatDeposit(value) {
  return value === null ? '제한 없음' : `${value.toLocaleString()}만원`;
}

function getBuildingName(id) {
  return campusBuildings.find((building) => building.id === id)?.name;
}

export default function ProfileSection({ preferences, username, onOpenBuildingSettings, onOpenBudgetSettings, onSavePreferences }) {
  const primaryBuilding = getBuildingName(preferences.primaryClassBuildingId || preferences.classBuildingIds[0]);
  const hasSecondaryBuilding = Boolean(preferences.hasSecondaryClassBuilding || preferences.secondaryClassBuildingId || preferences.classBuildingIds[1]);
  const secondaryBuilding = hasSecondaryBuilding && getBuildingName(preferences.secondaryClassBuildingId || preferences.classBuildingIds[1]);
  const buildingSummary = primaryBuilding ? `1순위 ${primaryBuilding}${secondaryBuilding ? ` · 2순위 ${secondaryBuilding}` : ''}` : '아직 설정하지 않았어요';
  const leaseTypes = preferences.leaseTypes || [];
  const isBudgetConfigured = preferences.budgetConfigured !== false;
  const hasMonthlyBudget = isBudgetConfigured
    && leaseTypes.includes('MONTHLY')
    && preferences.maxDeposit !== null
    && preferences.maxDeposit !== undefined
    && preferences.maxMonthlyRent !== null
    && preferences.maxMonthlyRent !== undefined;
  const hasJeonseBudget = isBudgetConfigured
    && leaseTypes.includes('JEONSE')
    && preferences.maxJeonse !== null
    && preferences.maxJeonse !== undefined;
  const monthlyBudgetSummary = hasMonthlyBudget
    ? `보증금 ${formatDeposit(preferences.maxDeposit)} · 월세 ${formatDeposit(preferences.maxMonthlyRent)} 이하`
    : '아직 설정하지 않았어요';
  const jeonseBudgetSummary = hasJeonseBudget
    ? `전세금 ${formatDeposit(preferences.maxJeonse)} 이하`
    : '아직 설정하지 않았어요';
  const displayName = username || '로그인 사용자';
  const initial = displayName.trim().charAt(0) || '김';

  return (
    <section className="content-section profile-section">
      <header><div><h1>내 정보</h1><p>나의 자취방 탐색 조건을 관리해요.</p></div><button>프로필 수정</button></header>
      <section className="profile-section__user"><span>{initial}</span><div><h2>{displayName}</h2><p>서울시립대학교 컴퓨터과학부</p><small>카카오 계정으로 로그인됨</small></div></section>
      <section className="profile-section__preference"><div><b>내가 자주 가는 수업 건물</b><strong>{buildingSummary}</strong><span>선택한 건물까지의 도보 시간을 매물에서 알려드려요.</span></div><button onClick={onOpenBuildingSettings}>변경</button></section>
      <section className="profile-section__preference"><div><b>내 월세 예산</b><strong>{monthlyBudgetSummary}</strong><span>예산에 맞는 월세 매물을 우선으로 찾아드려요.</span></div><button onClick={onOpenBudgetSettings}>변경</button></section>
      <section className="profile-section__preference"><div><b>내 전세 예산</b><strong>{jeonseBudgetSummary}</strong><span>예산에 맞는 전세 매물을 우선으로 찾아드려요.</span></div><button onClick={onOpenBudgetSettings}>변경</button></section>
      <section className="profile-section__settings"><h2>알림 설정</h2><label><span><b>조건 맞춤 새 매물 알림</b><small>설정한 예산과 거리에 맞는 매물을 알려드려요.</small></span><input type="checkbox" checked={preferences.conditionListingAlert} onChange={(event) => onSavePreferences?.({ conditionListingAlert: event.target.checked })} /></label><label><span><b>찜한 매물 가격 변동</b><small>찜한 매물의 가격 또는 계약 상태가 바뀌면 알려드려요.</small></span><input type="checkbox" checked={preferences.wishPriceChangeAlert} onChange={(event) => onSavePreferences?.({ wishPriceChangeAlert: event.target.checked })} /></label></section>
    </section>
  );
}
