export const handleError = (data: string) => {
  try {
    const jsonPart = data.replace(/^(\d+:)?\s*/, "").replace(/'/g, '"');
    const parsedData = JSON.parse(jsonPart);
    return parsedData;
  } catch (error) {
    console.error("Failed to parse error data:", error);
    return null;
  }
};
