import { useState } from 'react';
import Icon from '../../components/Icon';
import './ChatAssistant.css';

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const sendMessage = () => { if (message.trim()) { setMessages([...messages, message]); setMessage(''); } };
  return <><button className="chat-fab" onClick={() => setOpen(!open)} aria-label="AI 챗봇 열기"><Icon name="message" size={21} /></button>{open && <section className="chat-window"><header><div><b>UOS AI 매물 도우미</b><small>원하는 방을 자연어로 찾아보세요.</small></div><button onClick={() => setOpen(false)}><Icon name="close" size={15} /></button></header><div className="chat-window__messages"><p className="chat-window__bot">어떤 방을 찾고 있나요? 예: “보증금 500만원, 월세 45만원 이하, 학교 10분 이내”</p>{messages.map((item, index) => <p key={`${item}-${index}`} className="chat-window__user">{item}</p>)}</div><form onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="원하는 조건을 입력하세요" /><button>전송</button></form></section>}</>;
}
