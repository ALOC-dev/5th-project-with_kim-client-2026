import { useState } from 'react';
import './ChecklistSection.css';

const initialTasks = [
  { id: 'register', title: '등기부등본 확인', detail: '근저당권, 소유자, 압류 여부를 확인하세요.', required: true },
  { id: 'contractor', title: '계약 당사자 확인', detail: '등기부상 소유자와 계약자가 동일한지 확인하세요.', required: true },
  { id: 'insurance', title: '전세보증보험 가입 가능 여부', detail: 'HUG 또는 HF 보증보험 가능 여부를 확인하세요.', required: true },
  { id: 'report', title: '전입신고와 확정일자', detail: '입주 당일 전입신고 및 확정일자를 받으세요.', required: false },
  { id: 'receipt', title: '계약금 영수증 보관', detail: '지급 내역과 특약 사항을 사진으로 보관하세요.', required: false },
];

export default function ChecklistSection() {
  const [checked, setChecked] = useState([]);
  const toggle = (id) => setChecked((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  return <section className="content-section checklist-section"><header><div><h1>계약 체크리스트</h1><p>안전한 계약을 위한 필수 확인 사항이에요.</p></div><b>{checked.length}/{initialTasks.length} 완료</b></header><div className="checklist-section__progress"><i><em style={{ width: `${checked.length / initialTasks.length * 100}%` }} /></i><span>천천히 하나씩 확인해도 괜찮아요.</span></div><div className="checklist-section__tasks">{initialTasks.map((task) => <label className={checked.includes(task.id) ? 'is-complete' : ''} key={task.id}><input type="checkbox" checked={checked.includes(task.id)} onChange={() => toggle(task.id)} /><div><b>{task.title} {task.required && <em>필수</em>}</b><span>{task.detail}</span></div></label>)}</div><aside><b>계약 전 꼭 기억하세요</b><p>등기부등본은 계약 직전에도 다시 확인하고, 특약은 구두 약속 대신 계약서에 기재하세요.</p></aside></section>;
}
