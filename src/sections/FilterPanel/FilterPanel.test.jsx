import { render, screen } from '@testing-library/react';
import FilterPanel from './FilterPanel';

const filters = {
  dealType: '전체',
  depositLimit: 30000,
  jeonseLimit: 30000,
  rentLimit: 100,
  roomType: '전체',
  walking: '전체',
  safety: '전체',
  options: { elevator: false, parking: false, cctv: false, pets: false },
};

test('전체 거래 유형에서는 월세 보증금, 월세, 전세금 필터를 각각 표시한다', () => {
  render(
    <FilterPanel
      filters={filters}
      onChange={jest.fn()}
      onClose={jest.fn()}
      onReset={jest.fn()}
      count={44}
    />,
  );

  const sliders = screen.getAllByRole('slider');

  expect(screen.getByRole('heading', { name: '월세 보증금' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '월세' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '전세금' })).toBeInTheDocument();
  expect(sliders).toHaveLength(3);
  expect(sliders[0]).toHaveAttribute('max', '30000');
  expect(sliders[2]).toHaveAttribute('max', '30000');
});

test('월세와 전세 거래 유형에는 필요한 금액 필터만 표시한다', () => {
  const { rerender } = render(
    <FilterPanel
      filters={{ ...filters, dealType: '월세' }}
      onChange={jest.fn()}
      onClose={jest.fn()}
      onReset={jest.fn()}
      count={44}
    />,
  );

  expect(screen.getByRole('heading', { name: '월세 보증금' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '월세' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '전세금' })).not.toBeInTheDocument();

  rerender(
    <FilterPanel
      filters={{ ...filters, dealType: '전세' }}
      onChange={jest.fn()}
      onClose={jest.fn()}
      onReset={jest.fn()}
      count={44}
    />,
  );

  expect(screen.queryByRole('heading', { name: '월세 보증금' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '월세' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '전세금' })).toBeInTheDocument();
});
