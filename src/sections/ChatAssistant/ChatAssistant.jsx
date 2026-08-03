import { useState } from 'react';
import Icon from '../../components/Icon';
import { searchHouses } from '../../services';
import './ChatAssistant.css';

const welcomeMessage = {
  role: 'assistant',
  type: 'text',
  text: '어떤 방을 찾고 있나요? 예: “보증금 500만원, 월세 45만원 이하, 학교 10분 이내”',
};
let sessionMessages = [welcomeMessage];

export default function ChatAssistant({ onSelectListing }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(() => sessionMessages);
  const [isSearching, setIsSearching] = useState(false);

  const appendMessages = (nextMessages) => {
    sessionMessages = [...sessionMessages, ...nextMessages];
    setMessages(sessionMessages);
  };

  const sendMessage = async () => {
    const query = message.trim();
    if (!query || isSearching) return;

    appendMessages([{ role: 'user', type: 'text', text: query }]);
    setMessage('');
    setIsSearching(true);

    try {
      const listings = await searchHouses(query, 5);
      appendMessages([{
        role: 'assistant',
        type: 'results',
        listings,
        text: listings.length ? `${listings.length}개의 매물을 찾았어요.` : '조건에 맞는 매물을 찾지 못했어요. 조건을 조금 바꿔 다시 검색해 보세요.',
      }]);
    } catch {
      appendMessages([{
        role: 'assistant',
        type: 'text',
        text: '매물을 찾는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  return <>
    <button className="chat-fab" onClick={() => setOpen(!open)} aria-label="AI 챗봇 열기"><Icon name="message" size={21} /></button>
    {open && <section className="chat-window" aria-label="UOS AI 매물 도우미">
      <header>
        <div><b>UOS AI 매물 도우미</b><small>원하는 방을 자연어로 찾아보세요.</small></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="채팅 닫기"><Icon name="close" size={15} /></button>
      </header>
      <div className="chat-window__messages">
        {messages.map((item, index) => <ChatMessage key={`${item.role}-${index}`} message={item} onSelectListing={onSelectListing} />)}
        {isSearching && <p className="chat-window__bot chat-window__loading">조건에 맞는 매물을 찾고 있어요...</p>}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="원하는 조건을 입력하세요" aria-label="매물 검색 조건" />
        <button type="submit" disabled={isSearching || !message.trim()}>전송</button>
      </form>
    </section>}
  </>;
}

function ChatMessage({ message, onSelectListing }) {
  if (message.type === 'results') {
    return <div className="chat-window__result-message">
      <p className="chat-window__bot">{message.text}</p>
      {message.listings.map((listing) => <ChatListingCard key={listing.id} listing={listing} onClick={() => onSelectListing?.(listing)} />)}
    </div>;
  }

  return <p className={message.role === 'user' ? 'chat-window__user' : 'chat-window__bot'}>{message.text}</p>;
}

function ChatListingCard({ listing, onClick }) {
  const isJeonse = listing.contractType === 'JEONSE' || listing.dealType === '전세';
  const price = isJeonse
    ? `전세 ${listing.deposit}만원`
    : `월세 ${listing.rent ? `${listing.rent}만원` : '정보 없음'}`;
  const walking = listing.walkingMinutes ? `학교 도보 ${listing.walkingMinutes}분` : '학교 거리 정보 없음';

  return <button type="button" className="chat-window__listing" onClick={onClick}>
    <span className="chat-window__listing-type">{listing.dealType}</span>
    <strong>{price}</strong>
    <span className="chat-window__listing-address">{listing.address}</span>
    <span className="chat-window__listing-meta">{listing.roomType} · {listing.area} · {walking}</span>
  </button>;
}
