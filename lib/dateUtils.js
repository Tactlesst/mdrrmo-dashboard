export function formatPHDateTime(dateStr) {
  if (!dateStr) return "N/A";
  try {
    // If the string is missing a year, add today's date
    let parsedStr = dateStr;
    if (!dateStr.includes("-")) {
      const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
      parsedStr = `${today}T${dateStr.replace(/^.*T/, "")}`;
    }

    return new Date(parsedStr).toLocaleString("en-PH", {
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
// Format date only for Manila
export function formatPHDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }}