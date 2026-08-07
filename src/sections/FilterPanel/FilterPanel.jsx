import './FilterPanel.css';

const chipGroups = [
  { key: 'dealType', title: '거래 유형', values: ['전체', '월세', '전세'] },
  { key: 'roomType', title: '건물 유형', values: ['전체', '원룸', '투룸', '오피스텔', '아파트'] },
  { key: 'walking', title: '학교까지 도보', values: ['전체', '10분 이내', '15분 이내', '20분 이내'] },
  { key: 'safety', title: '안전 점수', values: ['전체', '8점 이상', '6점 이상'] },
];
const optionLabels = { elevator: '엘리베이터', parking: '주차 가능', cctv: 'CCTV', pets: '반려동물 가능' };

export default function FilterPanel({ filters, onChange, onClose, onReset, count }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  const updateOption = (key) => onChange({ ...filters, options: { ...filters.options, [key]: !filters.options[key] } });
  const showMonthlyFilters = filters.dealType !== '전세';
  const showJeonseFilter = filters.dealType !== '월세';

  return <div className="filter-overlay" role="presentation" onMouseDown={onClose}>
    <section className="filter-panel" role="dialog" aria-modal="true" aria-label="매물 필터" onMouseDown={(event) => event.stopPropagation()}>
      <header><h2>필터</h2><button onClick={onReset}>초기화</button></header>
      <div className="filter-panel__content">
        {chipGroups.slice(0, 1).map((group) => <ChipGroup key={group.key} group={group} selected={filters[group.key]} onSelect={(value) => update(group.key, value)} />)}
        {showMonthlyFilters && <RangeControl label="월세 보증금" value={filters.depositLimit} max={30000} step={100} suffix="만원" onChange={(value) => update('depositLimit', Number(value))} />}
        {showMonthlyFilters && <RangeControl label="월세" value={filters.rentLimit} max={100} step={5} suffix="만원" onChange={(value) => update('rentLimit', Number(value))} />}
        {showJeonseFilter && <RangeControl label="전세금" value={filters.jeonseLimit ?? 30000} max={30000} step={100} suffix="만원" onChange={(value) => update('jeonseLimit', Number(value))} />}
        {chipGroups.slice(1, 3).map((group) => <ChipGroup key={group.key} group={group} selected={filters[group.key]} onSelect={(value) => update(group.key, value)} />)}
        <section className="filter-section"><h3>옵션</h3><div className="filter-options">{Object.entries(optionLabels).map(([key, label]) => <label key={key}><input type="checkbox" checked={filters.options[key]} onChange={() => updateOption(key)} /><span>{label}</span></label>)}</div></section>
        <ChipGroup group={chipGroups[3]} selected={filters.safety} onSelect={(value) => update('safety', value)} />
      </div>
      <footer><button onClick={onClose}>매물 {count}개 보기</button></footer>
    </section>
  </div>;
}

function ChipGroup({ group, selected, onSelect }) {
  return <section className="filter-section"><h3>{group.title}</h3><div className="filter-chips">{group.values.map((value) => <button className={selected === value ? 'is-selected' : ''} key={value} onClick={() => onSelect(value)}>{value}</button>)}</div></section>;
}

function RangeControl({ label, value, max, step, suffix, onChange }) {
  return <section className="filter-section filter-range"><div><h3>{label}</h3><b>0 ~ {value.toLocaleString('ko-KR')}{suffix}</b></div><input type="range" min="0" max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} /></section>;
}
