import { useState } from 'react';
import Icon from '../Icon';
import { BUSINESS_OPTIONS } from '../../constants';
import './BusinessListingForm.css';

const initialForm = {
  title: '', address: '', buildingType: '오피스텔', roomType: '원룸', floor: '4', totalFloors: '6',
  area: '26', supplyArea: '31', leaseType: 'MONTHLY', deposit: '1000', monthlyRent: '50',
  managementFee: '7', feeType: '정액', registryStatus: 'NONE', broker: '박민준 · 시립대공인중개사',
};

export default function BusinessListingForm({ onCreate }) {
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(['fullOption', 'elevator', 'cctv', 'doorLock']);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const toggleOption = (optionId) => setSelectedOptions((current) => current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId]);
  const handlePhotos = (event) => setPhotos(Array.from(event.target.files || []).slice(0, 10));
  const handleSubmit = (event) => {
    event.preventDefault();
    onCreate({
      ...form,
      id: `draft-${Date.now()}`,
      leaseType: form.leaseType,
      deposit: Number(form.deposit) || 0,
      monthlyRent: form.leaseType === 'JEONSE' ? 0 : Number(form.monthlyRent) || 0,
      managementFee: Number(form.managementFee) || 0,
      imageCount: photos.length,
      options: selectedOptions,
      status: '등록 대기',
      updatedAt: '방금 등록',
    });
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
          <label htmlFor="business-title">매물 이름</label>
          <input id="business-title" name="title" value={form.title} onChange={updateField} placeholder="예: 전농동 리모델링 원룸" required />
          <label htmlFor="business-address">주소</label>
          <input id="business-address" name="address" value={form.address} onChange={updateField} placeholder="도로명 또는 지번 주소" required />
          <div className="business-form__field-grid">
            <Field label="건물 유형" name="buildingType" value={form.buildingType} options={['오피스텔', '원룸', '다세대', '아파트']} onChange={updateField} />
            <Field label="방 유형" name="roomType" value={form.roomType} options={['원룸', '투룸', '쓰리룸']} onChange={updateField} />
            <Field label="해당 층" name="floor" value={form.floor} onChange={updateField} />
            <Field label="전체 층" name="totalFloors" value={form.totalFloors} onChange={updateField} />
            <Field label="전용면적(m²)" name="area" value={form.area} onChange={updateField} />
            <Field label="공급면적(m²)" name="supplyArea" value={form.supplyArea} onChange={updateField} />
          </div>
        </section>
      </div>
      <div className="business-form__column">
        <section className="business-card">
          <div className="business-card__heading"><h3>가격 정보</h3><span>단위: 만원</span></div>
          <div className="business-toggle"><button type="button" className={form.leaseType === 'MONTHLY' ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, leaseType: 'MONTHLY' }))}>월세</button><button type="button" className={form.leaseType === 'JEONSE' ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, leaseType: 'JEONSE' }))}>전세</button></div>
          <div className="business-form__field-grid"><Field label="보증금 (만원)" name="deposit" value={form.deposit} onChange={updateField} /><Field label="월세 (만원)" name="monthlyRent" value={form.monthlyRent} onChange={updateField} disabled={form.leaseType === 'JEONSE'} /><Field label="관리비 (만원)" name="managementFee" value={form.managementFee} onChange={updateField} /><Field label="관리비 유형" name="feeType" value={form.feeType} options={['정액', '실비']} onChange={updateField} /></div>
        </section>
        <section className="business-card"><h3>옵션 선택</h3><div className="business-options">{BUSINESS_OPTIONS.map((option) => <button key={option.id} type="button" className={selectedOptions.includes(option.id) ? 'is-active' : ''} onClick={() => toggleOption(option.id)}>{option.label}</button>)}</div></section>
        <section className="business-card"><h3>등기부 및 담당 중개사</h3><div className="business-toggle business-toggle--three">{[['NONE', '없음'], ['AVAILABLE', '있음'], ['UNKNOWN', '잘 모름']].map(([value, label]) => <button key={value} type="button" className={form.registryStatus === value ? 'is-active' : ''} onClick={() => setForm((current) => ({ ...current, registryStatus: value }))}>{label}</button>)}</div><label htmlFor="business-broker">담당 공인중개사</label><input id="business-broker" name="broker" value={form.broker} onChange={updateField} /></section>
      </div>
    </div>
  </form>;
}

function Field({ label, name, value, options, onChange, disabled = false }) {
  return <label className="business-field" htmlFor={`business-${name}`}><span>{label}</span>{options ? <select id={`business-${name}`} name={name} value={value} onChange={onChange} disabled={disabled}>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input id={`business-${name}`} name={name} value={value} onChange={onChange} disabled={disabled} />}</label>;
}
