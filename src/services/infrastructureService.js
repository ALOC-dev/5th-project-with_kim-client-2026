import { apiRequest } from './apiClient';

export async function getInfrastructuresByCategory(category) {
  const response = await apiRequest(`/api/infrastructures/category/${encodeURIComponent(category)}`);
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  return [];
}
