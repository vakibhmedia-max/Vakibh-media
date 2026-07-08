const fs = require('fs');
const xml = fs.readFileSync('C:/tmp/post-sitemap.xml','utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const dny = urls.filter(u => u.includes('/dnyaneshwar/'));
console.log('dny urls', dny.length);
for (const u of dny.slice(0,120)) console.log(u);