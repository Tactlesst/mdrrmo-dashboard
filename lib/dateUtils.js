export function formatPHDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const formatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return formatter.format(new Date(dateStr));
}

export function formatPHDate(dateStr) {
  if (!dateStr) return 'N/A';
  const formatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(new Date(dateStr));
}
