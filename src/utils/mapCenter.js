const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_MAP_CENTER_UPDATE_DISTANCE_METERS = 250;

export function getMapCenterDistanceMeters(currentCenter, nextCenter) {
  const currentLat = Number(currentCenter?.lat);
  const currentLng = Number(currentCenter?.lng);
  const nextLat = Number(nextCenter?.lat);
  const nextLng = Number(nextCenter?.lng);

  if (![currentLat, currentLng, nextLat, nextLng].every(Number.isFinite)) return Number.POSITIVE_INFINITY;

  const latitudeDelta = ((nextLat - currentLat) * Math.PI) / 180;
  const longitudeDelta = ((nextLng - currentLng) * Math.PI) / 180;
  const currentLatitude = (currentLat * Math.PI) / 180;
  const nextLatitude = (nextLat * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(currentLatitude) * Math.cos(nextLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function shouldUpdateMapSearchCenter(
  currentCenter,
  nextCenter,
  minimumDistanceMeters = DEFAULT_MAP_CENTER_UPDATE_DISTANCE_METERS,
) {
  return getMapCenterDistanceMeters(currentCenter, nextCenter) >= minimumDistanceMeters;
}
