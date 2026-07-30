import { render, screen } from '@testing-library/react';
import MapPin from './MapPin';

const listing = {
  title: '전농동 원룸',
  dealType: '월세',
  deposit: '500',
  rent: '50',
  position: { left: '50%', top: '50%' },
};

test('월세 마커에는 월세 색상 클래스가 붙는다', () => {
  render(<MapPin listing={listing} isSelected={false} onClick={jest.fn()} />);

  expect(screen.getByRole('button')).toHaveClass('map-pin--monthly');
  expect(screen.getByRole('button')).not.toHaveClass('map-pin--jeonse');
});

test('전세 마커에는 전세 색상 클래스가 붙는다', () => {
  render(<MapPin listing={{ ...listing, dealType: '전세', rent: '0' }} isSelected={false} onClick={jest.fn()} />);

  expect(screen.getByRole('button')).toHaveClass('map-pin--jeonse');
  expect(screen.getByRole('button')).not.toHaveClass('map-pin--monthly');
});
