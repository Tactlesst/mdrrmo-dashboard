// Format date & time for Manila (always UTC first)
export function formatPHDateTime(dateStr) {
  if (!dateStr) return "N/A";
  try {
    // If date is missing day/month/year, add today's date
    let parsedStr = dateStr;
    if (!dateStr.includes("-")) {
      const today = new Date().toISOString().split("T")[0];
      parsedStr = `${today}T${dateStr.replace(/^.*T/, "")}`;
    }

    // Ensure it ends with Z so it's treated as UTC
    if (!parsedStr.endsWith("Z")) {
      parsedStr += "Z";
    }

    // Parse in UTC, then format to Manila time
    const utcDate = new Date(parsedStr);
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

// Format date only for Manila (from UTC)
export function formatPHDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    let parsedStr = dateStr;
    if (!dateStr.includes("-")) {
      const today = new Date().toISOString().split("T")[0];
      parsedStr = `${today}T${dateStr.replace(/^.*T/, "")}`;
    }

    const utcDate = new Date(parsedStr);

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
