export function getRegistryStatus(registryUpload) {
  if (!registryUpload) return 'NOT_UPLOADED';

  const status = String(registryUpload.status || '').toUpperCase();
  if (!status) return 'ANALYZED';
  if (['ANALYZED', 'COMPLETED', 'DONE', 'SUCCESS'].includes(status)) return 'ANALYZED';
  if (['NEEDS_MORE_DOCS', 'MORE_DOCS_REQUIRED'].includes(status)) return 'NEEDS_MORE_DOCS';
  if (['FAILED', 'ERROR'].includes(status)) return 'FAILED';

  return 'PENDING';
}

export function canRequestRegistryUpload(registryStatus) {
  return ['NOT_UPLOADED', 'NEEDS_MORE_DOCS', 'FAILED'].includes(registryStatus);
}
