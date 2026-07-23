// Convert raw Markdown text to simplified safe HTML to render
export const renderMarkdown = (text) => {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Bullets
  html = html.replace(/^\s*\-\s+(.*$)/gim, '<li>$1</li>');
  
  // Convert newlines to br
  html = html.replace(/\n/g, '<br />');

  return html;
};

export const getProblemKey = (prob) => {
  if (!prob) return "";
  const baseKey = `${prob.year}-${prob.number}`;
  const isVerbal = prob.subject === "언어이해" || (prob.year && prob.year.toString().includes("언어이해"));
  return isVerbal ? `${baseKey}_verbal` : baseKey;
};
