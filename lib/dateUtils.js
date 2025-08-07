// Format date and time for Manila (or specified timezone)
export function formatPHDateTime(dateStr) {
  const timeZone = process.env.APP_TIMEZONE || "Asia/Manila";
  try {
    return new Date(dateStr).toLocaleString("en-PH", {
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

// Format date only for Manila (or specified timezone)
export function formatPHDate(dateStr) {
  const timeZone = process.env.APP_TIMEZONE || "Asia/Manila";
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-PH", {
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