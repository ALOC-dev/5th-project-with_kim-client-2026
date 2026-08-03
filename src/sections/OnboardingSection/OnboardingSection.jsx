import { useState } from 'react';
import { budgetSliderConfig, campusBuildings } from '../../constants';
import Icon from '../../components/Icon';
import './OnboardingSection.css';

const steps = [
  { id: 'building', label: '수업 건물 설정' },
  { id: 'budget', label: '예산 설정' },
  { id: 'complete', label: '설정 완료' },
];

const buildingsPerPage = 6;

function formatBudget(value) {
  return `${Number(value).toLocaleString('ko-KR')}만원`;
}

function normalizeSliderValue(value, config) {
  if (value === null || value === undefined || value === '') return config.defaultValue;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return config.defaultValue;
  const snappedValue = config.min + Math.round((numericValue - config.min) / config.step) * config.step;
  return Math.min(config.max, Math.max(config.min, snappedValue));
}

function getSliderProgress(value, config) {
  return `${((value - config.min) / (config.max - config.min)) * 100}%`;
}

function getBuildingName(id) {
  return campusBuildings.find((building) => building.id === String(id))?.name;
}

export default function OnboardingSection({ mode = 'all', preferences, onClose, onDefer, onSave }) {
  const availableSteps = mode === 'all' ? steps : steps.filter((step) => step.id === mode);
  const [stepIndex, setStepIndex] = useState(0);
  const [primaryClassBuildingId, setPrimaryClassBuildingId] = useState(preferences.primaryClassBuildingId || preferences.classBuildingIds[0] || null);
  const [secondaryClassBuildingId, setSecondaryClassBuildingId] = useState(preferences.secondaryClassBuildingId || preferences.classBuildingIds[1] || null);
  const [hasSecondaryClassBuilding, setHasSecondaryClassBuilding] = useState(Boolean(preferences.secondaryClassBuildingId || preferences.classBuildingIds[1] || preferences.hasSecondaryClassBuilding));
  const [buildingRank, setBuildingRank] = useState('primary');
  const [buildingPage, setBuildingPage] = useState(0);
  const [maxDeposit, setMaxDeposit] = useState(() => normalizeSliderValue(preferences.maxDeposit, budgetSliderConfig.monthlyDeposit));
  const [maxMonthlyRent, setMaxMonthlyRent] = useState(() => normalizeSliderValue(preferences.maxMonthlyRent, budgetSliderConfig.monthlyRent));
  const [maxJeonse, setMaxJeonse] = useState(() => normalizeSliderValue(preferences.maxJeonse, budgetSliderConfig.jeonse));
  const [leaseTypes, setLeaseTypes] = useState(Array.isArray(preferences.leaseTypes) ? preferences.leaseTypes : ['MONTHLY']);
  const currentStep = availableSteps[stepIndex];
  const isStandalone = mode !== 'all';
  const currentStepNumber = steps.findIndex((step) => step.id === currentStep.id) + 1;
  const currentBuildingId = buildingRank === 'primary' ? primaryClassBuildingId : secondaryClassBuildingId;
  const isPrimarySelection = buildingRank === 'primary';
  const buildingPageCount = Math.ceil(campusBuildings.length / buildingsPerPage);
  const visibleBuildings = campusBuildings
    .slice(buildingPage * buildingsPerPage, (buildingPage + 1) * buildingsPerPage)
    .filter((building) => building.id !== primaryClassBuildingId || isPrimarySelection);

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

  const toggleLeaseType = (leaseType) => {
    setLeaseTypes((current) => current.includes(leaseType)
      ? current.filter((type) => type !== leaseType)
      : [...current, leaseType]);
  };

  const getBuildingChanges = () => {
    const classBuildingIds = [primaryClassBuildingId, hasSecondaryClassBuilding ? secondaryClassBuildingId : null].filter(Boolean);
    return {
      classBuildingIds,
      primaryClassBuildingId,
      secondaryClassBuildingId: hasSecondaryClassBuilding ? secondaryClassBuildingId : null,
      hasSecondaryClassBuilding,
    };
  };

  const getBudgetChanges = () => {
    const includesMonthly = leaseTypes.includes('MONTHLY');
    const includesJeonseType = leaseTypes.includes('JEONSE');
    return {
      leaseTypes,
      maxDeposit: includesMonthly ? maxDeposit : null,
      maxMonthlyRent: includesMonthly ? maxMonthlyRent : null,
      maxJeonse: includesJeonseType ? maxJeonse : null,
      budgetConfigured: true,
    };
  };

  const saveCurrentStep = async () => {
    const changes = {
      onboardingCompleted: preferences.onboardingCompleted,
      onboardingDeferred: mode === 'all' ? false : preferences.onboardingDeferred,
    };

    if (currentStep.id === 'building') Object.assign(changes, getBuildingChanges());
    if (currentStep.id === 'budget') Object.assign(changes, getBudgetChanges());

    await onSave(changes);
  };

  const handleNext = async () => {
    if (currentStep.id === 'building' && !primaryClassBuildingId) return;
    if (currentStep.id === 'budget' && leaseTypes.length === 0) return;
    if (currentStep.id === 'building' && buildingRank === 'primary') {
      setBuildingRank('secondary');
      return;
    }
    if (isStandalone) {
      await saveCurrentStep();
      onClose();
      return;
    }
    if (currentStep.id === 'complete') {
      await onSave({ onboardingCompleted: true, onboardingDeferred: false });
      onClose();
      return;
    }
    if (currentStep.id === 'budget') {
      await onSave({
        ...getBuildingChanges(),
        ...getBudgetChanges(),
        onboardingCompleted: false,
        onboardingDeferred: false,
      });
    }
    setStepIndex((index) => index + 1);
  };

  const handleBack = () => setStepIndex((index) => Math.max(0, index - 1));
  const handleDefer = async () => {
    const changes = currentStep.id === 'budget'
      ? { ...getBuildingChanges(), onboardingDeferredMode: 'budget' }
      : {};
    await onDefer(changes);
    onClose();
  };
  const nextLabel = currentStep.id === 'building' && buildingRank === 'primary' ? '두 번째 장소 선택하기' : isStandalone ? '저장' : currentStep.id === 'complete' ? '매물 보러가기' : '다음';
  const includesMonthlyRent = leaseTypes.includes('MONTHLY');
  const includesJeonse = leaseTypes.includes('JEONSE');
  const isNextDisabled = (currentStep.id === 'building' && !primaryClassBuildingId)
    || (currentStep.id === 'budget' && leaseTypes.length === 0);

  return <div className="onboarding-overlay"><section className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <aside className="onboarding__aside">
      <div className="onboarding__brand"><span><Icon name="home" size={26} /></span><div><b>UOS 자취방</b><small>시립대 학생 전용</small></div></div>
      <ol className="onboarding__steps">{steps.map((step, index) => <li className={currentStep.id === step.id ? 'is-active' : ''} key={step.id}><i>{index + 1}</i>{step.label}</li>)}</ol>
    </aside>
    <div className="onboarding__content">
      <header className="onboarding__header"><div><span>{`${currentStepNumber} / ${steps.length} 단계`}</span><div className="onboarding__progress"><i style={{ width: `${(currentStepNumber / steps.length) * 100}%` }} /></div></div></header>
      {currentStep.id === 'building' && <div className="onboarding__body"><div className="onboarding__building-ranks"><button className={isPrimarySelection ? 'is-active' : ''} onClick={() => setBuildingRank('primary')}><b>1순위</b><span>{getBuildingName(primaryClassBuildingId) || '가장 많이 듣는 장소'}</span></button><button className={!isPrimarySelection ? 'is-active' : ''} disabled={!primaryClassBuildingId} onClick={() => setBuildingRank('secondary')}><b>2순위</b><span>{hasSecondaryClassBuilding ? getBuildingName(secondaryClassBuildingId) || '다음으로 많이 듣는 장소' : '수업 장소 없음'}</span></button></div><h1 id="onboarding-title">{isPrimarySelection ? '가장 많이 듣는 수업 장소를 선택해주세요' : '그다음으로 많이 듣는 수업 장소를 선택해주세요'}</h1><p>{isPrimarySelection ? '가장 자주 가는 건물을 하나 선택해주세요.' : '한 장소에서만 수업을 듣는다면 아래 버튼을 선택해주세요.'}</p>{!isPrimarySelection && <button className={hasSecondaryClassBuilding ? 'onboarding__no-secondary' : 'onboarding__no-secondary is-selected'} onClick={chooseNoSecondaryBuilding}>{getBuildingName(primaryClassBuildingId)}에서만 수업을 들어요.</button>}<div className="onboarding__building-grid">{visibleBuildings.map((building) => <button className={currentBuildingId === building.id ? 'is-selected' : ''} key={building.id} onClick={() => chooseBuilding(building.id)}><span>▥</span>{building.name}</button>)}</div><nav className="onboarding__building-pagination" aria-label="수업 건물 페이지">{Array.from({ length: buildingPageCount }, (_, page) => <button aria-current={buildingPage === page ? 'page' : undefined} className={buildingPage === page ? 'is-active' : ''} key={page} onClick={() => setBuildingPage(page)}>{page + 1}</button>)}</nav></div>}
      {currentStep.id === 'budget' && <div className="onboarding__body"><h1 id="onboarding-title">예산을 설정해주세요</h1><p>월세와 전세를 함께 선택하고 원하는 가격 범위를 넉넉하게 설정할 수 있어요.</p><section className="onboarding__budget onboarding__lease-types"><h2>원하는 계약 유형</h2><div><button aria-pressed={includesMonthlyRent} className={includesMonthlyRent ? 'is-selected' : ''} onClick={() => toggleLeaseType('MONTHLY')}>월세</button><button aria-pressed={includesJeonse} className={includesJeonse ? 'is-selected' : ''} onClick={() => toggleLeaseType('JEONSE')}>전세</button></div></section>{includesMonthlyRent && <><BudgetSlider id="onboarding-deposit" label="최대 보증금" value={maxDeposit} config={budgetSliderConfig.monthlyDeposit} maxLabel="5,000만원+" onChange={setMaxDeposit} /><BudgetSlider id="onboarding-monthly-rent" label="최대 월세" value={maxMonthlyRent} config={budgetSliderConfig.monthlyRent} maxLabel="100만원+" onChange={setMaxMonthlyRent} /></>}{includesJeonse && <BudgetSlider id="onboarding-jeonse" label="최대 전세금" value={maxJeonse} config={budgetSliderConfig.jeonse} maxLabel="3억원+" onChange={setMaxJeonse} />}</div>}
      {currentStep.id === 'complete' && <div className="onboarding__body onboarding__complete"><span>✓</span><h1 id="onboarding-title">설정이 완료됐어요</h1><p>수업 건물과 예산에 맞는 매물을 우선으로 찾아드릴게요.</p></div>}
      <footer className="onboarding__footer"><div className="onboarding__footer-actions">{currentStep.id !== 'complete' && <button className="onboarding__defer" onClick={handleDefer}>나중에 설정하기</button>}{!isStandalone && stepIndex > 0 && <button className="onboarding__back" onClick={handleBack}>이전</button>}<button className="onboarding__next" disabled={isNextDisabled} onClick={handleNext}>{nextLabel}</button></div></footer>
    </div>
  </section></div>;
}

function BudgetSlider({ id, label, value, config, maxLabel, onChange }) {
  return <section className="onboarding__slider-group">
    <div className="onboarding__slider-heading"><label htmlFor={id}>{label}</label><strong>0 ~ {formatBudget(value)}</strong></div>
    <input
      id={id}
      aria-label={label}
      type="range"
      min={config.min}
      max={config.max}
      step={config.step}
      value={value}
      style={{ '--range-progress': getSliderProgress(value, config) }}
      onChange={(event) => onChange(Number(event.target.value))}
    />
    <div className="onboarding__slider-scale"><span>0</span><span>{maxLabel}</span></div>
  </section>;
}
