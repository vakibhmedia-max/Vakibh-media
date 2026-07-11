const fs = require('fs');
const index = JSON.parse(fs.readFileSync('Vakibh-media/Vakibh/data/search-index.json','utf8'));
console.log('entries', index.length);
const hits = index.filter((item) => JSON.stringify(item).includes('ज्ञानेश्वर') && JSON.stringify(item).includes('१ते२००'));
console.log('hits', hits.length);
for (const hit of hits.slice(0,5)) {
  console.log(Object.keys(hit));
  console.log(JSON.stringify(hit).slice(0,2000));
}
const hits2 = index.filter((item) => JSON.stringify(item).includes('तुज सगुण') || JSON.stringify(item).includes('अभंग १ ते २००'));
console.log('hits2', hits2.length);
for (const hit of hits2.slice(0,5)) console.log(JSON.stringify(hit).slice(0,1000));