export function destinationUrl(value) {
 if (!value?.trim()) return null;
 try {
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
  return url.href;
 } catch { return null; }
}
