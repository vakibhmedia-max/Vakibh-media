const fs = require('fs');
const path = require('path');
const root = path.resolve('Vakibh-media/sants/dnyaneshwar');
const files = fs.readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^abhang-/.test(d.name))
  .map((d) => path.join(root, d.name, 'index.html'))
  .filter(fs.existsSync);

let changed = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  // Remove imported source-site title menus. They are navigation lists from the old site, not the reading body.
  html = html.replace(/<section\b(?=[\s\S]*?elementor-section)[\s\S]*?<ul class="elementor-icon-list-items">[\s\S]*?<\/ul>[\s\S]*?<\/section>/gi, '');
  html = html.replace(/<div class="elementor-element[^"]*elementor-widget-icon-list[\s\S]*?<\/ul>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

  // Any remaining old-domain anchors become plain local text so the page never redirects out.
  html = html.replace(/<a\b([^>]*?)href=["']https?:\/\/(?:www\.)?santsahitya\.in\/[^"']*["']([^>]*)>([\s\S]*?)<\/a>/gi, '$3');

  // Remove now-empty Elementor wrapper debris left by source navigation.
  html = html.replace(/<div class="elementor-widget-container">\s*<\/div>/gi, '');
  html = html.replace(/<div class="elementor-widget-wrap elementor-element-populated">\s*<\/div>/gi, '');
  html = html.replace(/<div class="elementor-container elementor-column-gap-default">\s*<\/div>/gi, '');
  html = html.replace(/<div class="elementor elementor-[^"]*"[^>]*>\s*<\/div>/gi, '');

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
    console.log('fixed', path.relative(process.cwd(), file));
  }
}
console.log(`changed=${changed}`);
