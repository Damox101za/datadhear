const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/winpe/upload') {

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      res.writeHead(400);
      return res.end('Invalid content type');
    }

    const boundary = Buffer.from('--' + contentType.split('boundary=')[1]);
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));

    req.on('end', () => {
      const buffer = Buffer.concat(chunks);

      const uploadDir = path.join(__dirname, 'uploads', Date.now().toString());
      fs.mkdirSync(uploadDir, { recursive: true });

      let start = buffer.indexOf(boundary);

      while (start !== -1) {
        let end = buffer.indexOf(boundary, start + boundary.length);
        if (end === -1) break;

        const part = buffer.slice(start, end);

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
          start = end;
          continue;
        }

        const header = part.slice(0, headerEnd).toString();
        const match = header.match(/filename="(.+?)"/);

        if (match) {
          const filename = match[1];
          const fileData = part.slice(headerEnd + 4, part.length - 2); // trim \r\n

          fs.writeFileSync(path.join(uploadDir, filename), fileData);
        }

        start = end;
      }

      res.writeHead(200);
      res.end('OK');
    });

  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});