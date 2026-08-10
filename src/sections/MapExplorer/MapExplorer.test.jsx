import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getInfrastructuresByCategory } from '../../services';
import MapExplorer from './MapExplorer';

jest.mock('../../components/KakaoMap/KakaoMap', () => function MockKakaoMap({ facilities, onFacilityTypeChange }) {
  return <div><span data-testid="facility-count">{facilities.length}</span><button type="button" onClick={() => onFacilityTypeChange('CCTV')}>CCTV 불러오기</button><button type="button" onClick={() => onFacilityTypeChange(null)}>시설 숨기기</button></div>;
});

jest.mock('../../services', () => ({
  getInfrastructuresByCategory: jest.fn(),
}));

beforeEach(() => {
  getInfrastructuresByCategory.mockReset();
});

test('시설 필터를 처음 누를 때만 API를 호출하고 재선택 시 캐시를 사용한다', async () => {
  getInfrastructuresByCategory.mockImplementation(async (category) => ([
    { infrastructureId: category, category, latitude: 37.5759, longitude: 127.029 },
  ]));

  const { rerender } = render(<MapExplorer listings={[]} />);

  expect(screen.getByTestId('facility-count')).toHaveTextContent('0');
  expect(getInfrastructuresByCategory).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'CCTV 불러오기' }));

  await waitFor(() => expect(screen.getByTestId('facility-count')).toHaveTextContent('1'));
  expect(getInfrastructuresByCategory).toHaveBeenCalledTimes(1);
  expect(getInfrastructuresByCategory).toHaveBeenCalledWith('CCTV');

  fireEvent.click(screen.getByRole('button', { name: '시설 숨기기' }));
  fireEvent.click(screen.getByRole('button', { name: 'CCTV 불러오기' }));
  expect(getInfrastructuresByCategory).toHaveBeenCalledTimes(1);

  rerender(<MapExplorer listings={[]} isLoading />);
  expect(getInfrastructuresByCategory).toHaveBeenCalledTimes(1);
});
