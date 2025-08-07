export function formatPHDateTime(dateStr) {
  if (!dateStr || isNaN(new Date(dateStr))) return "Invalid Date";
  return new Date(dateStr).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPHDate(dateStr) {
  if (!dateStr || isNaN(new Date(dateStr))) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
