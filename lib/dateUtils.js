// Format date & time for Manila (from UTC)
export function formatPHDateTime(dateStr) {
  if (!dateStr) return "N/A";
  try {
    // Handle partial timestamp (missing date)
    let parsedStr = dateStr;
    if (!dateStr.includes("-")) {
      const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
      parsedStr = `${today}T${dateStr.replace(/^.*T/, "")}`;
    }

    // Parse as UTC
    const utcDate = new Date(parsedStr);

    // Convert to Manila time
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
