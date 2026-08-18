import { useState } from 'react';
import Icon from '../Icon';
import { BUSINESS_OPTIONS, SEOUL_DISTRICTS, SEOUL_GU_OPTIONS } from '../../constants';
import './BusinessListingForm.css';

const SEOUL_CITY = '서울특별시';
const DEFAULT_GU = '동대문구';
const DEFAULT_DONG = SEOUL_DISTRICTS[DEFAULT_GU][0];
const CURRENT_YEAR = new Date().getFullYear();

const initialForm = {
  title: '', address: '', buildingType: '오피스텔', roomType: '1개', toilet: '1개', floor: '', totalFloors: '',
  area: '', supplyArea: '', builtYear: '', leaseType: 'MONTHLY', deposit: '', monthlyRent: '',
  managementFee: '', feeType: '정액', registryStatus: 'NONE', broker: '',
};

function parseAddress(address = '') {
  const tokens = address.trim().split(/\s+/);
  const gu = SEOUL_GU_OPTIONS.find((option) => tokens.includes(option)) || DEFAULT_GU;
  const guIndex = tokens.indexOf(gu);
  const dong = SEOUL_DISTRICTS[gu].find((option) => tokens.includes(option)) || DEFAULT_DONG;
  const dongIndex = tokens.indexOf(dong);
  const remainder = dongIndex >= 0 ? tokens.slice(dongIndex + 1) : tokens.slice(guIndex + 1);
  const roadIndex = remainder.findIndex((token) => /(?:대로|로|길)$/.test(token));
  const isRoad = roadIndex >= 0;
  return {
    gu,
    dong,
    addressType: isRoad ? 'road' : 'lot',
    roadName: isRoad ? remainder[roadIndex] : '',
    buildingNumber: isRoad ? (remainder[roadIndex + 1] || '').replace(/[^0-9-].*$/, '') : '',
    lotNumber: isRoad ? '' : (remainder[0] || '').replace(/[^0-9-].*$/, ''),
  };
}

function toManwon(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount ? String(Math.round(amount / 10000)) : '';
}

function getInitialForm(listing) {
  if (!listing) return initialForm;
  const raw = listing.rawHouse || {};
  return {
    ...initialForm,
    title: listing.title || raw.description || '',
    buildingType: raw.buildingType || initialForm.buildingType,
    roomType: raw.roomNumber ? `${raw.roomNumber}개` : initialForm.roomType,
    toilet: raw.toilet ? `${raw.toilet}개` : initialForm.toilet,
    floor: raw.floor === null || raw.floor === undefined ? '' : String(raw.floor),
    area: raw.area === null || raw.area === undefined ? '' : String(raw.area),
    deposit: raw.deposit === null || raw.deposit === undefined ? String(listing.deposit || '') : toManwon(raw.deposit),
    monthlyRent: raw.monthlyRent === null || raw.monthlyRent === undefined ? String(listing.monthlyRent || '') : toManwon(raw.monthlyRent),
    managementFee: toManwon(raw.managementFee),
    leaseType: raw.contractType === 'JEONSE' || listing.leaseType === 'JEONSE' ? 'JEONSE' : 'MONTHLY',
    broker: raw.broker || listing.broker || '',
  };
}

export default function BusinessListingForm({ onCreate, onUpdate, initialListing }) {
  const initialAddress = parseAddress(initialListing?.address || initialListing?.rawHouse?.address || '');
  const [form, setForm] = useState(() => getInitialForm(initialListing));
  const [photos, setPhotos] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(['fullOption', 'elevator', 'cctv', 'doorLock']);
  const [selectedGu, setSelectedGu] = useState(initialAddress.gu);
  const [selectedDong, setSelectedDong] = useState(initialAddress.dong);
  const [addressType, setAddressType] = useState(initialAddress.addressType);
  const [lotNumber, setLotNumber] = useState(initialAddress.lotNumber);
  const [roadName, setRoadName] = useState(initialAddress.roadName);
  const [buildingNumber, setBuildingNumber] = useState(initialAddress.buildingNumber);
  const [brokerLicense, setBrokerLicense] = useState(null);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateDescription = (event) => {
    updateField(event);
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
  };
  const handleGuChange = (event) => {
    const nextGu = event.target.value;
    const nextDong = SEOUL_DISTRICTS[nextGu][0];
    setSelectedGu(nextGu);
    setSelectedDong(nextDong);
  };
  const handleDongChange = (event) => {
    setSelectedDong(event.target.value);
  };
  const handleBuildingTypeChange = (event) => {
    const buildingType = event.target.value;
    setForm((current) => ({
      ...current,
      buildingType,
      roomType: buildingType === '원룸' ? '1개' : current.roomType,
    }));
  };
  const toggleOption = (optionId) => setSelectedOptions((current) => current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId]);
  const handlePhotos = (event) => setPhotos(Array.from(event.target.files || []).slice(0, 10));
  const handleSubmit = (event) => {
    event.preventDefault();
    const address = addressType === 'lot'
      ? `${SEOUL_CITY} ${selectedGu} ${selectedDong} ${lotNumber}`
      : `${SEOUL_CITY} ${selectedGu} ${roadName} ${buildingNumber}`;
    const listing = {
      ...form,
      address,
      id: initialListing?.id || `draft-${Date.now()}`,
      rawHouse: initialListing?.rawHouse,
      leaseType: form.leaseType,
      deposit: Number(form.deposit) || 0,
      monthlyRent: form.leaseType === 'JEONSE' ? 0 : Number(form.monthlyRent) || 0,
      managementFee: Number(form.managementFee) || 0,
      builtYear: Number(form.builtYear),
      toilet: Number.parseInt(form.toilet, 10),
      imageCount: photos.length,
      brokerLicenseFile: brokerLicense,
      brokerLicenseFileName: brokerLicense?.name || '',
      options: selectedOptions,
      status: '등록 대기',
      updatedAt: '방금 등록',
    };
    if (initialListing && onUpdate) onUpdate(listing);
    else onCreate(listing);
  };

  return <form id="business-listing-form" className="business-form" onSubmit={handleSubmit}>
    <div className="business-form__columns">
      <div className="business-form__column">
        <section className="business-card business-form__photos">
          <div className="business-card__heading"><h3>매물 사진</h3><span>최대 10장</span></div>
          <div className="business-photo-grid">
            {photos.slice(0, 2).map((photo) => <div className="business-photo business-photo--uploaded" key={photo.name}><span>{photo.name}</span></div>)}
            {photos.length < 2 && <div className="business-photo business-photo--sample"><span>대표</span></div>}
            <label className="business-photo business-photo--add" htmlFor="business-photos"><Icon name="plus" size={17} /><span>추가</span></label>
          </div>
          <small>첫 번째 사진이 대표 사진으로 사용돼요.</small>
          <input id="business-photos" className="business-file-input" type="file" accept="image/*" multiple onChange={handlePhotos} />
        </section>
        <section className="business-card">
          <h3>기본 정보</h3>
          <label htmlFor="business-title">매물 설명</label>
          <div className="business-form__description">
            <textarea id="business-title" name="title" value={form.title} onChange={updateDescription} placeholder="예: 전농동에 위치한 채광 좋은 리모델링 원룸이에요." rows="1" maxLength={200} required />
            <span aria-live="polite">{form.title.length}/200</span>
          </div>
          <label htmlFor="business-address-gu">주소</label>
          <div className="business-toggle business-form__address-type" aria-label="주소 유형">
            <button type="button" className={addressType === 'lot' ? 'is-active' : ''} aria-pressed={addressType === 'lot'} onClick={() => setAddressType('lot')}>구주소 (지번)</button>
            <button type="button" className={addressType === 'road' ? 'is-active' : ''} aria-pressed={addressType === 'road'} onClick={() => setAddressType('road')}>신주소 (도로명)</button>
          </div>
          <div className={`business-form__address business-form__address--${addressType}`}>
            <input value={SEOUL_CITY} readOnly aria-label="시 선택" />
            <select id="business-address-gu" value={selectedGu} onChange={handleGuChange} aria-label="구 선택">{SEOUL_GU_OPTIONS.map((gu) => <option key={gu} value={gu}>{gu}</option>)}</select>
            {addressType === 'lot' ? <>
              <select value={selectedDong} onChange={handleDongChange} aria-label="동 선택">{SEOUL_DISTRICTS[selectedGu].map((dong) => <option key={dong} value={dong}>{dong}</option>)}</select>
              <input value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} aria-label="지번" placeholder="예: 123-45" inputMode="numeric" pattern="[0-9]+(-[0-9]+)?" title="숫자 또는 숫자-숫자 형식으로 입력해주세요." required />
            </> : <>
              <input value={roadName} onChange={(event) => setRoadName(event.target.value)} aria-label="도로명" placeholder="예: 서울시립대로" required />
              <input value={buildingNumber} onChange={(event) => setBuildingNumber(event.target.value)} aria-label="건물번호" placeholder="예: 123-45" inputMode="numeric" pattern="[0-9]+(-[0-9]+)?" title="숫자 또는 숫자-숫자 형식으로 입력해주세요." required />
            </>}
          </div>
          <div className="business-form__field-grid">
            <Field label="건물 유형" name="buildingType" value={form.buildingType} options={['오피스텔', '원룸', '다세대', '아파트']} onChange={handleBuildingTypeChange} />
            <Field label="방 개수" name="roomType" value={form.roomType} options={['1개', '2개', '3개']} onChange={updateField} disabled={form.buildingType === '원룸'} />
            <Field label="화장실 개수" name="toilet" value={form.toilet} options={['1개', '2개', '3개 이상']} onChange={updateField} />
            <Field label="해당 층" name="floor" value={form.floor} onChange={updateField} placeholder="예: 4" />
            <Field label="전체 층" name="totalFloors" value={form.totalFloors} onChange={updateField} placeholder="예: 6" />
            <Field label="전용면적(m²)" name="area" value={form.area} onChange={updateField} placeholder="예: 26" />
            <Field label="공급면적(m²)" name="supplyArea" value={form.supplyArea} onChange={updateField} placeholder="예: 31" />
            <Field label="건축 연도" name="builtYear" value={form.builtYear} onChange={updateField} type="number" min="1900" max={CURRENT_YEAR} placeholder={`예: ${CURRENT_YEAR - 5}`} required />
          </div>
        </section>
      </div>
      <div className="business-form__column">
        <section className="business-card">
          <div className="business-card__heading"><h3>가격 정보</h3><span>단위: 만원</span></div>
          <div className="business-toggle"><button type="button" className={form.leaseType === 'MONTHLY' ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, leaseType: 'MONTHLY' }))}>월세</button><button type="button" className={form.leaseType === 'JEONSE' ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, leaseType: 'JEONSE' }))}>전세</button></div>
          <div className="business-form__field-grid"><Field label="보증금 (만원)" name="deposit" value={form.deposit} onChange={updateField} placeholder="예: 1000" /><Field label="월세 (만원)" name="monthlyRent" value={form.monthlyRent} onChange={updateField} disabled={form.leaseType === 'JEONSE'} placeholder="예: 50" /><Field label="관리비 (만원)" name="managementFee" value={form.managementFee} onChange={updateField} placeholder="예: 7" /><Field label="관리비 유형" name="feeType" value={form.feeType} options={['정액', '실비']} onChange={updateField} /></div>
        </section>
        <section className="business-card"><h3>옵션 선택</h3><div className="business-options">{BUSINESS_OPTIONS.map((option) => <button key={option.id} type="button" className={selectedOptions.includes(option.id) ? 'is-active' : ''} onClick={() => toggleOption(option.id)}>{option.label}</button>)}</div></section>
        <section className="business-card"><h3>등기부 및 담당 중개사</h3><div className="business-toggle business-toggle--three">{[['NONE', '없음'], ['AVAILABLE', '있음'], ['UNKNOWN', '잘 모름']].map(([value, label]) => <button key={value} type="button" className={form.registryStatus === value ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, registryStatus: value }))}>{label}</button>)}</div><label htmlFor="business-broker">담당 공인중개사</label><input id="business-broker" name="broker" value={form.broker} onChange={updateField} placeholder="예: 박민준 · 시립대공인중개사" /><label htmlFor="business-broker-license">담당 공인중개사 자격증</label><label className="business-license-upload" htmlFor="business-broker-license"><Icon name="upload" size={17} /><span>{brokerLicense?.name || '자격증 이미지 또는 PDF 업로드'}</span></label><input id="business-broker-license" className="business-license-input" type="file" accept="image/*,application/pdf,.pdf" onChange={(event) => setBrokerLicense(event.target.files?.[0] || null)} /></section>
      </div>
    </div>
  </form>;
}

function Field({ label, name, value, options, onChange, disabled = false, type = 'text', min, max, placeholder, required = false }) {
  return <label className="business-field" htmlFor={`business-${name}`}><span>{label}</span>{options ? <select id={`business-${name}`} name={name} value={value} onChange={onChange} disabled={disabled} required={required}>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input id={`business-${name}`} name={name} value={value} onChange={onChange} disabled={disabled} type={type} min={min} max={max} placeholder={placeholder} required={required} />}</label>;
}
