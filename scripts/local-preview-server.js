const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'Vakibh-media');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp', '.json':'application/json; charset=utf-8' };
http.createServer((req,res)=>{
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const requested = path.resolve(root, '.' + urlPath);
  if (!requested.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  let file = requested;
  try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); } catch {}
  fs.readFile(file, (err,data)=>{ if (err) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, {'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'}); res.end(data); });
}).listen(3000, '127.0.0.1', ()=>console.log('Vakibh preview: http://localhost:3000/'));
