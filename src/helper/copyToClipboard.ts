export const copyToClipBoard = (data: string[]) => {
  const textToCopy = data.join("\n");
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      console.log("Copied to clipboard:", textToCopy);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
};
