import { fireEvent, render, screen } from '@testing-library/react';
import BuildingListingsPanel from './BuildingListingsPanel';

const listings = [{
  id: 1,
  title: '서울 동대문구 전농동 295-1',
  address: '서울 동대문구 전농동 295-1',
  dealType: '월세',
  deposit: 500,
  rent: 55,
  roomType: '원룸',
  floor: '3층',
  direction: '남향',
  area: '24.2m²',
  maintenance: '월 6만원',
  summary: '시립대 정문 앞 신축 원룸',
}];

test('모바일 드래그 핸들을 아래로 끌면 같은 건물 매물 패널을 닫는다', () => {
  const onClose = jest.fn();
  render(<BuildingListingsPanel listings={listings} onClose={onClose} onSelect={jest.fn()} />);

  const handle = screen.getByLabelText('매물 목록을 아래로 끌어 지도 화면으로 돌아가기');
  fireEvent(handle, new MouseEvent('pointerdown', { bubbles: true, clientY: 100 }));
  fireEvent(handle, new MouseEvent('pointermove', { bubbles: true, clientY: 230 }));
  fireEvent(handle, new MouseEvent('pointerup', { bubbles: true }));

  expect(onClose).toHaveBeenCalledTimes(1);
});
