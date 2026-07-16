// server.js
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const confirmHandler = require('./api/confirm.js');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API endpoint
    if (pathname === '/api/confirm') {
        // Przekaż do handlera
        const modifiedReq = {
            ...req,
            query: parsedUrl.query,
            body: null
        };

        // Zbierz body dla POST
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    modifiedReq.body = JSON.parse(body);
                } catch (e) {
                    modifiedReq.body = {};
                }
                // Przekaż do handlera
                const mockRes = {
                    statusCode: 200,
                    headers: {},
                    setHeader: (key, value) => { mockRes.headers[key] = value; },
                    status: (code) => { mockRes.statusCode = code; return mockRes; },
                    json: (data) => {
                        res.writeHead(mockRes.statusCode, { 
                            'Content-Type': 'application/json',
                            ...mockRes.headers 
                        });
                        res.end(JSON.stringify(data));
                    },
                    end: () => { res.end(); }
                };
                confirmHandler(modifiedReq, mockRes);
            });
            return;
        }

        // GET
        const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader: (key, value) => { mockRes.headers[key] = value; },
            status: (code) => { mockRes.statusCode = code; return mockRes; },
            json: (data) => {
                res.writeHead(mockRes.statusCode, { 
                    'Content-Type': 'application/json',
                    ...mockRes.headers 
                });
                res.end(JSON.stringify(data));
            },
            end: () => { res.end(); }
        };
        confirmHandler(modifiedReq || req, mockRes);
        return;
    }

    // Pliki statyczne
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        }[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 Panel admina: http://localhost:${PORT}/admin.html`);
    console.log(`🎫 Strona ofiary: http://localhost:${PORT}/`);
});
