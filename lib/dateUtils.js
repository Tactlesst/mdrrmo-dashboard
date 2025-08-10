// Force UTC → Manila conversion no matter where the code runs
export function formatPHDateTime(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const utcDate = new Date(dateStr); // interprets timestamptz as UTC
    return utcDate.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
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

export function formatPHDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const utcDate = new Date(dateStr);
    return utcDate.toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
}

// Helper for YYYY-MM-DD comparisons in filters
export function formatPHDateISO(dateStr) {
  if (!dateStr) return "";
  try {
    const utcDate = new Date(dateStr);
    return utcDate.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }); // YYYY-MM-DD
  } catch {
    return "";
  }
}
