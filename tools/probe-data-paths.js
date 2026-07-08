const fs = require('fs');
const path = require('path');
const candidates = [
  path.join('Vakibh-media','data','saints_data.json'),
  path.join('Vakibh-media','Vakibh','data','saints_data.json'),
  path.join('Vakibh-media','Vakibh','audio','..','..','data','saints_data.json'),
];
for (const file of candidates) {
  console.log(file, fs.existsSync(file), fs.existsSync(file) ? fs.statSync(file).size : '');
}