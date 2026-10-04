/** Add paragraph breaks around labeled links without rewriting the message. */
export function formatOutreachDraft(message: string) {
  const label = '(?:Lihat demo|Demo|Detail design(?: dan pemesanan|/pemesanan)?|Info NAKI CODE|Informasi NAKI CODE)';
  const link = `${label}:\\s*https?:\\/\\/[^\\s]+`;
  return message
    .replace(new RegExp(`\\s*(${link})\\s*`, 'gi'), '\n\n$1\n\n')
    .replace(new RegExp(`(${link})\\s+(?=${label}:)`, 'gi'), '$1\n')
    .trim();
}
