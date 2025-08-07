import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatPHDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  return dayjs(dateStr).tz('Asia/Manila').format('MMM D, YYYY, h:mm A');
}

export function formatPHDate(dateStr) {
  if (!dateStr) return 'N/A';
  return dayjs(dateStr).tz('Asia/Manila').format('MMM D, YYYY');
}
