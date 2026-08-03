import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatAssistant from './ChatAssistant';

test('채팅 컴포넌트가 다시 마운트되어도 새로고침 전 검색 기록을 유지한다', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ([{
      id: 1,
      contractType: 'MONTHLY',
      price: 550000,
      address: '서울 동대문구 전농동 295-1',
      roomNumber: 1,
      area: 24.2,
      campusWalkMinutes: 3,
    }]),
  });

  const firstRender = render(<ChatAssistant />);
  fireEvent.click(screen.getByRole('button', { name: 'AI 챗봇 열기' }));
  fireEvent.change(screen.getByLabelText('매물 검색 조건'), { target: { value: '학교 10분 이내 원룸' } });
  fireEvent.click(screen.getByRole('button', { name: '전송' }));

  await waitFor(() => expect(screen.getByText('서울 동대문구 전농동 295-1')).toBeInTheDocument());

  firstRender.unmount();
  render(<ChatAssistant />);
  fireEvent.click(screen.getByRole('button', { name: 'AI 챗봇 열기' }));

  expect(screen.getByText('학교 10분 이내 원룸')).toBeInTheDocument();
  expect(screen.getByText('서울 동대문구 전농동 295-1')).toBeInTheDocument();
});
