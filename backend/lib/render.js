const ejs = require('ejs');
const path = require('path');

const VIEW_ROOT = path.join(__dirname, '..', 'views');

async function renderPage(template, data = {}, layout = 'public') {
  const templatePath = path.join(VIEW_ROOT, template);
  const layoutPath = path.join(VIEW_ROOT, 'layouts', `${layout}.ejs`);

  const body = await ejs.renderFile(templatePath, data, { async: true });
  return ejs.renderFile(layoutPath, { ...data, body }, { async: true });
}

module.exports = {
  renderPage
};
