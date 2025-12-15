const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const filePath = process.argv[2] || '../../Presentation 6.pdf';

 (async () => {
  let parser;
  try {
    const dataBuffer = fs.readFileSync(filePath);
    parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    console.log(result.text);
  } catch (err) {
    console.error('Error extracting PDF text:', err.message || err);
    process.exit(1);
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try { await parser.destroy(); } catch (_) { /* ignore */ }
    }
  }
})();
