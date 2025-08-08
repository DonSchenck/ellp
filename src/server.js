import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleTerminalConnection, setSharedTerminalMode } from './terminal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
setSharedTerminalMode(false); // Set this to false to allow a shared session
const port = 6060;

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        const routeName = req.url.slice(1);
        const assetObj = {
            '': { file: "output.html", contentType: "text/html" },
            'client.js': { file: "client.js", contentType: "text/javascript" }
        }[routeName];

        if (!assetObj) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Path not found');
        }

        // Read the HTML template
        let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

        // Read the content to insert
        let content = fs.readFileSync(path.join(__dirname, 'assignment.md'), 'utf8');

        // Replace the placeholder with actual content
        let updatedHtml = html.replace('#instructions_go_here#', content);

        // Save to a new file or overwrite
        fs.writeFileSync(path.join(__dirname, 'output.html'), updatedHtml);

        console.log('Content inserted into output.html');



        const filePath = path.join(__dirname, assetObj.file);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Failed to load file');
            } else {
                res.writeHead(200, { 'Content-Type': assetObj.contentType });
                res.end(data);
            }
        });
    }
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', handleTerminalConnection);

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(port, () => {
    console.log(`HTTP and WebSocket server is running on port ${port}`);
});

