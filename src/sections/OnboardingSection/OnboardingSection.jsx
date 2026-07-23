import { useState } from 'react';
import { campusBuildings, depositOptions, monthlyRentOptions } from '../../constants';
import Icon from '../../components/Icon';
import './OnboardingSection.css';

const steps = [
  { id: 'building', label: '수업 건물 설정' },
  { id: 'budget', label: '예산 설정' },
  { id: 'complete', label: '설정 완료' },
];

function formatDeposit(value) {
  return value === null ? '제한없음' : `${value.toLocaleString()}만원`;
}

function getBuildingName(id) {
  return campusBuildings.find((building) => building.id === id)?.name;
}

export default function OnboardingSection({ mode = 'all', preferences, onClose, onDefer, onSave }) {
  const availableSteps = mode === 'all' ? steps : steps.filter((step) => step.id === mode);
  const [stepIndex, setStepIndex] = useState(0);
  const [primaryClassBuildingId, setPrimaryClassBuildingId] = useState(preferences.primaryClassBuildingId || preferences.classBuildingIds[0] || null);
  const [secondaryClassBuildingId, setSecondaryClassBuildingId] = useState(preferences.secondaryClassBuildingId || preferences.classBuildingIds[1] || null);
  const [hasSecondaryClassBuilding, setHasSecondaryClassBuilding] = useState(Boolean(preferences.secondaryClassBuildingId || preferences.classBuildingIds[1] || preferences.hasSecondaryClassBuilding));
  const [buildingRank, setBuildingRank] = useState('primary');
  const [maxDeposit, setMaxDeposit] = useState(preferences.maxDeposit);
  const [maxMonthlyRent, setMaxMonthlyRent] = useState(preferences.maxMonthlyRent);
  const currentStep = availableSteps[stepIndex];
  const isStandalone = mode !== 'all';
  const currentBuildingId = buildingRank === 'primary' ? primaryClassBuildingId : secondaryClassBuildingId;
  const isPrimarySelection = buildingRank === 'primary';

  const chooseBuilding = (buildingId) => {
    if (isPrimarySelection) {
      setPrimaryClassBuildingId(buildingId);
      setSecondaryClassBuildingId(null);
      setHasSecondaryClassBuilding(false);
      setBuildingRank('secondary');
      return;
    }

    setSecondaryClassBuildingId(buildingId);
    setHasSecondaryClassBuilding(true);
  };

  const chooseNoSecondaryBuilding = () => {
    setSecondaryClassBuildingId(null);
    setHasSecondaryClassBuilding(false);
  };

  const save = async (isCompleted = false) => {
    const classBuildingIds = [primaryClassBuildingId, hasSecondaryClassBuilding ? secondaryClassBuildingId : null].filter(Boolean);
    await onSave({
      classBuildingIds,
      primaryClassBuildingId,
      secondaryClassBuildingId: hasSecondaryClassBuilding ? secondaryClassBuildingId : null,
      hasSecondaryClassBuilding,
      maxDeposit,
      maxMonthlyRent,
      onboardingCompleted: isCompleted || preferences.onboardingCompleted,
      onboardingDeferred: mode === 'all' ? false : preferences.onboardingDeferred,
    });
  };

  const handleNext = async () => {
    if (currentStep.id === 'building' && !primaryClassBuildingId) return;
    if (currentStep.id === 'building' && buildingRank === 'primary') {
      setBuildingRank('secondary');
      return;
    }
    if (isStandalone) {
      await save();
      onClose();
      return;
    }
    if (currentStep.id === 'complete') {
      await save(true);
      onClose();
      return;
    }
    setStepIndex((index) => index + 1);
  };

  const handleBack = () => setStepIndex((index) => Math.max(0, index - 1));
  const handleDefer = async () => {
    await onDefer();
    onClose();
  };
  const nextLabel = currentStep.id === 'building' && buildingRank === 'primary' ? '두 번째 장소 선택하기' : isStandalone ? '저장' : currentStep.id === 'complete' ? '매물 보러가기' : '다음';

  return <div className="onboarding-overlay"><section className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <aside className="onboarding__aside">
      <div className="onboarding__brand"><span><Icon name="home" size={26} /></span><div><b>UOS 자취방</b><small>시립대 학생 전용</small></div></div>
      <ol className="onboarding__steps">{steps.map((step, index) => <li className={currentStep.id === step.id ? 'is-active' : ''} key={step.id}><i>{index + 1}</i>{step.label}</li>)}</ol>
    </aside>
    <div className="onboarding__content">
      <header className="onboarding__header"><div><span>{isStandalone ? '설정 변경' : `${stepIndex + 1} / ${availableSteps.length} 단계`}</span><div className="onboarding__progress"><i style={{ width: `${((stepIndex + 1) / availableSteps.length) * 100}%` }} /></div></div></header>
      {currentStep.id === 'building' && <div className="onboarding__body"><div className="onboarding__building-ranks"><button className={isPrimarySelection ? 'is-active' : ''} onClick={() => setBuildingRank('primary')}><b>1순위</b><span>{getBuildingName(primaryClassBuildingId) || '가장 많이 듣는 장소'}</span></button><button className={!isPrimarySelection ? 'is-active' : ''} disabled={!primaryClassBuildingId} onClick={() => setBuildingRank('secondary')}><b>2순위</b><span>{hasSecondaryClassBuilding ? getBuildingName(secondaryClassBuildingId) || '다음으로 많이 듣는 장소' : '수업 장소 없음'}</span></button></div><h1 id="onboarding-title">{isPrimarySelection ? '가장 많이 듣는 수업 장소를 선택해주세요' : '그다음으로 많이 듣는 수업 장소를 선택해주세요'}</h1><p>{isPrimarySelection ? '가장 자주 가는 건물을 하나 선택해주세요.' : '한 장소에서만 수업을 듣는다면 아래 버튼을 선택해주세요.'}</p>{!isPrimarySelection && <button className={hasSecondaryClassBuilding ? 'onboarding__no-secondary' : 'onboarding__no-secondary is-selected'} onClick={chooseNoSecondaryBuilding}>{getBuildingName(primaryClassBuildingId)}에서만 수업을 들어요.</button>}<div className="onboarding__building-grid">{campusBuildings.filter((building) => building.id !== primaryClassBuildingId || isPrimarySelection).map((building) => <button className={currentBuildingId === building.id ? 'is-selected' : ''} key={building.id} onClick={() => chooseBuilding(building.id)}><span>▥</span>{building.name}</button>)}</div></div>}
      {currentStep.id === 'budget' && <div className="onboarding__body"><h1 id="onboarding-title">월 예산을 설정해주세요</h1><p>보증금과 월세 기준으로 원하는 매물을 먼저 보여드려요.</p><section className="onboarding__budget"><h2>최대 보증금</h2><div>{depositOptions.map((option) => <button className={maxDeposit === option ? 'is-selected' : ''} key={String(option)} onClick={() => setMaxDeposit(option)}>{formatDeposit(option)}</button>)}</div></section><section className="onboarding__budget"><h2>최대 월세</h2><div>{monthlyRentOptions.map((option) => <button className={maxMonthlyRent === option ? 'is-selected' : ''} key={option} onClick={() => setMaxMonthlyRent(option)}>{option}만원</button>)}</div></section></div>}
      {currentStep.id === 'complete' && <div className="onboarding__body onboarding__complete"><span>✓</span><h1 id="onboarding-title">설정이 완료됐어요</h1><p>수업 건물과 예산에 맞는 매물을 우선으로 찾아드릴게요.</p></div>}
      <footer className="onboarding__footer"><div className="onboarding__footer-actions">{!isStandalone && stepIndex > 0 && <button className="onboarding__back" onClick={handleBack}>이전</button>}<button className="onboarding__next" disabled={currentStep.id === 'building' && !primaryClassBuildingId} onClick={handleNext}>{nextLabel}</button></div>{!isStandalone && currentStep.id !== 'complete' && <button className="onboarding__defer" onClick={handleDefer}>나중에 할게요</button>}</footer>
    </div>
  </section></div>;
}
