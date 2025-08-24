export function generatePlainText(type, data = {}) {
  const htmlContent = data.html || '';

  let text = htmlContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) {
    const templates = {
      testEmail: `
                INVOLUCK API TEST EMAIL
                Timestamp: ${data.timestamp || 'N/A'}
                Environment: ${data.environment || 'N/A'}
            `.trim(),

      database: `
                INVOLUCK API DATABASE ERROR
                Status: ${data.status || 'N/A'}
                Host: ${data.host || 'N/A'}
                Ready State: ${data.readyState || 'N/A'}
                Error: ${data.error || 'N/A'}
                Timestamp: ${data.timestamp || 'N/A'}
            `.trim(),
    };

    text = templates[type] || '';
  }

  return text;
}
