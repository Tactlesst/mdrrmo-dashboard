// lib/dateUtils.js

function parseUTC(dateStr) {
  if (!dateStr) return null;

  // If dateStr doesn't have Z or offset, treat it as UTC explicitly
  if (!/[Zz]|[+\-]\d\d:?\d\d$/.test(dateStr)) {
    return new Date(dateStr + "Z");
  }

  return new Date(dateStr);
}

// Format date and time for Manila (or specified timezone)
export function formatPHDateTime(dateStr) {
  if (!dateStr) return "N/A";
  const timeZone = process.env.APP_TIMEZONE || "Asia/Manila";

  try {
    const date = parseUTC(dateStr);

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleString("en-PH", {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

// Format date only (no time)
export function formatPHDate(dateStr) {
  if (!dateStr) return "N/A";
  const timeZone = process.env.APP_TIMEZONE || "Asia/Manila";

  try {
    const date = parseUTC(dateStr);

    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-PH", {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
}
