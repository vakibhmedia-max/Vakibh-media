(() => {
  const browser = document.querySelector('.puravni-browser');
  const indexPanel = document.querySelector('.puravni-index-panel');
  const content = document.querySelector('.puravni-text-content');
  const categoryButtons = [...document.querySelectorAll('.puravni-index-button')];
  const abhangSections = [...document.querySelectorAll('.puravni-abhang-group')];

  if (!browser || !indexPanel || !content || !categoryButtons.length || !abhangSections.length) return;

  const categoryViewHeader = document.createElement('div');
  categoryViewHeader.className = 'puravni-category-view-header';
  categoryViewHeader.hidden = true;
  categoryViewHeader.innerHTML = `
    <button type="button" class="puravni-back-button" aria-label="सर्व विभागांकडे परत जा">
      <span aria-hidden="true">←</span> सर्व विभाग
    </button>
    <div>
      <p>अभंग विभाग</p>
      <h2 class="puravni-selected-category"></h2>
    </div>
  `;
  content.before(categoryViewHeader);

  const selectedCategoryTitle = categoryViewHeader.querySelector('.puravni-selected-category');
  const backButton = categoryViewHeader.querySelector('.puravni-back-button');

  const showIndex = (updateHash = true) => {
    indexPanel.hidden = false;
    categoryViewHeader.hidden = true;
    content.hidden = true;
    browser.classList.remove('is-viewing-category');

    categoryButtons.forEach((button) => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
    abhangSections.forEach((section) => { section.hidden = true; });

    if (updateHash) history.pushState(null, '', location.pathname + location.search);
    requestAnimationFrame(() => browser.scrollIntoView({ block: 'start' }));
  };

  const showCategory = (categoryId, preferredAbhang, updateHash = true) => {
    const categoryButton = categoryButtons.find((button) => button.dataset.category === categoryId);
    if (!categoryButton) {
      showIndex(false);
      return;
    }

    categoryButtons.forEach((button) => {
      const active = button === categoryButton;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    abhangSections.forEach((section) => { section.hidden = section.dataset.category !== categoryId; });

    selectedCategoryTitle.textContent = categoryButton.querySelector('span')?.textContent.trim() || categoryId;
    indexPanel.hidden = true;
    categoryViewHeader.hidden = false;
    content.hidden = false;
    browser.classList.add('is-viewing-category');

    if (updateHash) history.pushState(null, '', `#category-${categoryId}`);
    const hashTarget = preferredAbhang && document.getElementById(preferredAbhang);
    requestAnimationFrame(() => (hashTarget || categoryViewHeader).scrollIntoView({ block: 'start' }));
  };

  const applyLocation = () => {
    const hashTarget = location.hash.slice(1);
    const initialSection = document.getElementById(hashTarget);

    if (initialSection?.classList.contains('puravni-abhang-group')) {
      showCategory(initialSection.dataset.category, initialSection.id, false);
    } else if (hashTarget.startsWith('category-')) {
      showCategory(hashTarget.replace('category-', ''), null, false);
    } else {
      showIndex(false);
    }
  };

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => showCategory(button.dataset.category));
  });
  backButton.addEventListener('click', () => showIndex());
  window.addEventListener('popstate', applyLocation);
  applyLocation();
})();
