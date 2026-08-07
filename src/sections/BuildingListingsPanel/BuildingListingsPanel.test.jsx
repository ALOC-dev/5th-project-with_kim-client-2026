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

test('같은 건물 전세 매물 가격은 월 0 없이 전세금으로 보여준다', () => {
  render(<BuildingListingsPanel listings={[{ ...listings[0], dealType: '전세', deposit: '13000', rent: '0' }]} onClose={jest.fn()} onSelect={jest.fn()} />);

  expect(screen.getByText('전세금 13,000만원')).toBeInTheDocument();
  expect(screen.queryByText(/월 0/)).not.toBeInTheDocument();
});

test('같은 건물 목록에서 월세는 파란색이고 전세는 주황색으로 구분한다', () => {
  render(
    <BuildingListingsPanel
      listings={[
        listings[0],
        { ...listings[0], id: 2, dealType: '전세', deposit: '13000', rent: '0' },
      ]}
      onClose={jest.fn()}
      onSelect={jest.fn()}
    />,
  );

  expect(screen.getByText('월세')).toHaveClass('status-badge--blue');
  expect(screen.getByText('전세')).toHaveClass('status-badge--orange');
});
