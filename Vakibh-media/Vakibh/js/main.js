document.addEventListener('DOMContentLoaded', () => {
  const removeUnwantedTranslationSections = () => {
    document.querySelectorAll('.bilingual-translation-card').forEach((node) => node.remove());
    document.querySelectorAll('section, div, article').forEach((node) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text === 'English Translation English translation will be available soon.') {
        node.remove();
      }
    });
  };
  removeUnwantedTranslationSections();
  const currentPath = window.location.pathname.replace(/\\/g, '/').toLowerCase();
  if (window.location.pathname.replace(/\\/g, '/').toLowerCase().includes('/sants/dnyaneshwar/')) {
    document.body.classList.add('is-dnyaneshwar-page');
  }
  if (currentPath.includes('/sants/dnyaneshwar/adhyay-')) {
    document.body.classList.add('is-dnyaneshwari-adhyay-page');
  }
  if (currentPath.includes('/sants/') && document.querySelector('.abhang-post-main')) {
    document.body.classList.add('is-standard-granth-reading-page');
  }
  if (currentPath.includes('/sants/janabai/sant-janabai-abhang-')) {
    document.body.classList.add('is-janabai-abhang-page');
  }

  if (!document.querySelector('link[data-font-awesome]')) {
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    fontAwesomeLink.dataset.fontAwesome = 'true';
    document.head.appendChild(fontAwesomeLink);
  }

  // --- Dynamically Inject Missing Navbar (for 1000+ static files) ---
  const headerContainer = document.querySelector('.header-container');
  if (headerContainer && !document.querySelector('#navMenu')) {
    const logoLink = document.querySelector('.logo-link');
    const homePath = logoLink ? logoLink.getAttribute('href') : 'index.html';
    const contactPath = homePath.replace(/index\.html(?:#.*)?$/, 'contact/index.html');
    const navHTML = `
      <button class="menu-toggle" id="menuToggle" aria-label="\u092E\u0941\u0916\u094D\u092F \u092E\u0947\u0928\u0942 \u0909\u0918\u0921\u093E">
        <i class="fas fa-bars"></i>
      </button>
      <nav id="navMenu">
        <ul>
          <li><a href="${homePath}">\u092E\u0941\u0916\u092A\u0943\u0937\u094D\u0920</a></li>
          <li><a href="${homePath}#abhangs">\u0905\u092D\u0902\u0917/\u092D\u091C\u0928</a></li>
          <li><a href="${homePath}#saints" class="active">\u0938\u0902\u0924</a></li>
          <li><a href="${homePath}#categories">\u0935\u093F\u092D\u093E\u0917</a></li>
          <li><a href="${contactPath}">\u0938\u0902\u092A\u0930\u094D\u0915</a></li>
        </ul>
      </nav>
      <div class="header-actions">
        <div class="lang-switch-group" aria-label="\u092D\u093E\u0937\u093E \u0928\u093F\u0935\u0921\u093E">
          <button class="lang-switch active" type="button" data-language="marathi">\u092E\u0930\u093E\u0920\u0940</button>
        </div>
        <button class="search-trigger-btn" id="searchTrigger" aria-label="\u0936\u094B\u0927 \u0909\u0918\u0921\u093E">
          <i class="fas fa-search"></i>
        </button>
      </div>
    `;
    headerContainer.insertAdjacentHTML('beforeend', navHTML);
  }

  // --- Standardize Footer Across All Pages ---
  const logoLink = document.querySelector('.logo-link');
  const logoImg = document.querySelector('.logo-img');
  const homePath = logoLink ? logoLink.getAttribute('href') : 'index.html';
  const logoSrc = logoImg ? logoImg.getAttribute('src') : 'Vakibh/vaakibh_logo.svg';
  const mediaBasePath = logoSrc.replace(/vaakibh_logo\.svg(?:\?.*)?$/, '');
  const siteBasePath = homePath.replace(/index\.html(?:#.*)?$/, '');
  const sharedVeenaSrc = `${mediaBasePath}veena.svg`;
  const blogPath = homePath.replace(/index\.html(?:#.*)?$/, 'blog/index.html');
  const contactPath = homePath.replace(/index\.html(?:#.*)?$/, 'contact/index.html');
  const assetBasePath = mediaBasePath.replace(/Vakibh\/?$/, 'assests/');

  // --- Premium Inner Page Breadcrumb Hero ---
  const createInnerBreadcrumbHero = () => {
    if (document.querySelector('.inner-breadcrumb-hero')) return;
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const normalizedPath = path.replace(/\/+$/, '') || '/';
    const isHomePage = normalizedPath === '/' || normalizedPath === '/index.html' || /(?:^|\/)vakibh-media(?:\/index\.html)?$/.test(normalizedPath);
    if (isHomePage) return;

    const decodeEntities = (value = '') => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    };

    const cleanText = (value = '') => decodeEntities(value)
      .replace(/\s+/g, ' ')
      .replace(/\s+-\s+.*$/, '')
      .replace(/\s+\|\s+.*$/, '')
      .trim();

    const isReadableMarathi = (value = '') => /[\u0900-\u097F]/.test(value) && !/[?]{2,}|ÃƒÆ’Ã‚Â Ãƒâ€šÃ‚Â¤|ÃƒÆ’Ã‚Â Ãƒâ€šÃ‚Â¥/.test(value);
    const slugTitle = (slug = '') => slug
      .split('-')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const saintNames = {
      tukaram: '\u0938\u0902\u0924 \u0924\u0941\u0915\u093E\u0930\u093E\u092E \u092E\u0939\u093E\u0930\u093E\u091C',
      dnyaneshwar: '\u0938\u0902\u0924 \u091C\u094D\u091E\u093E\u0928\u0947\u0936\u094D\u0935\u0930 \u092E\u0939\u093E\u0930\u093E\u091C',
      namdev: '\u0938\u0902\u0924 \u0928\u093E\u092E\u0926\u0947\u0935 \u092E\u0939\u093E\u0930\u093E\u091C',
      eknath: '\u0938\u0902\u0924 \u090F\u0915\u0928\u093E\u0925 \u092E\u0939\u093E\u0930\u093E\u091C',
      muktabai: '\u0938\u0902\u0924 \u0938\u094B\u092A\u093E\u0928\u0926\u0947\u0935',
      janabai: '\u0938\u0902\u0924 \u091C\u0928\u093E\u092C\u093E\u0908',
      sopandev: '\u0938\u0902\u0924 \u0938\u094B\u092A\u093E\u0928\u0926\u0947\u0935',
      nivruttinath: '\u0938\u0902\u0924 \u0928\u093F\u0935\u0943\u0924\u094D\u0924\u093F\u0928\u093E\u0925',
      chokhamela: '\u0938\u0902\u0924 \u091A\u094B\u0916\u093E\u092E\u0947\u0933\u093E \u092E\u0939\u093E\u0930\u093E\u091C',
      savata: '\u0938\u0902\u0924 \u0938\u093E\u0935\u0924\u093E \u092E\u093E\u0933\u0940',
      gora: '\u0938\u0902\u0924 \u0917\u094B\u0930\u093E \u0915\u0941\u0902\u092D\u093E\u0930',
      narhari: '\u0938\u0902\u0924 \u0928\u0930\u0939\u0930\u0940 \u0938\u094B\u0928\u093E\u0930'
    };

    const segments = path.split('/').filter(Boolean);
    const santsIndex = segments.indexOf('sants');
    const saintSlug = santsIndex >= 0 ? segments[santsIndex + 1] : '';
    const pageSlug = [...segments].reverse().find(segment => segment && segment !== 'index.html' && segment !== 'contact' && segment !== 'blog' && segment !== 'sants' && segment !== 'vakibh-media-main' && segment !== 'vakibh-media') || '';

    let category = '\u0935\u093E\u0930\u0915\u0930\u0940 \u092A\u0930\u0902\u092A\u0930\u093E';
    let title = cleanText(document.querySelector('h1')?.textContent || document.title);
    let image = `${assetBasePath}vaari.webp`;
    let parentLabel = '\u0935\u093F\u092D\u093E\u0917';
    let parentHref = `${homePath}#categories`;
    let eyebrow = '\u0935\u093F\u0920\u094D\u0920\u0932 \u092D\u0915\u094D\u0924\u0940';

    if (path.includes('/contact/')) {
      category = '\u0938\u0902\u092A\u0930\u094D\u0915';
      title = '\u0938\u0902\u092A\u0930\u094D\u0915';
      image = `${assetBasePath}pandharpur.webp`;
      parentLabel = '\u0935\u093E\u0915\u0940\u092D';
      parentHref = homePath;
      eyebrow = '\u092D\u0915\u094D\u0924\u093F\u092E\u092F \u0938\u0902\u0935\u093E\u0926';
    } else if (path.includes('/blog/')) {
      category = '\u092C\u094D\u0932\u0949\u0917';
      image = `${assetBasePath}pandharpur.webp`;
      parentLabel = '\u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F';
      parentHref = blogPath;
      eyebrow = '\u091A\u093F\u0902\u0924\u0928 \u0906\u0923\u093F \u0938\u093E\u0927\u0928\u093E';
      if (!isReadableMarathi(title)) {
        title = pageSlug ? slugTitle(pageSlug) : '\u0935\u093E\u0915\u0940\u092D \u092C\u094D\u0932\u0949\u0917';
      }
    } else if (santsIndex >= 0) {
      category = saintNames[saintSlug] || '\u0938\u0902\u0924';
      parentLabel = '\u0938\u0902\u0924';
      parentHref = `${homePath}#saints`;
      eyebrow = '\u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F';
      image = `${assetBasePath}vaari.webp`;

      if (pageSlug.includes('haripath') || pageSlug.includes('abhang') || pageSlug.includes('gatha') || path.includes('abhang')) {
        image = `${assetBasePath}sant/haripath-banner.jpg`;
        eyebrow = '\u0905\u092D\u0902\u0917 \u0917\u093E\u092F\u0928';
      }

      if (!isReadableMarathi(title)) {
        title = pageSlug && pageSlug !== saintSlug
          ? `${saintNames[saintSlug] || '\u0938\u0902\u0924'} - ${slugTitle(pageSlug)}`
          : (saintNames[saintSlug] || '\u0938\u0902\u0924');
      }
    } else if (!isReadableMarathi(title)) {
      title = pageSlug ? slugTitle(pageSlug) : '\u0935\u093E\u0915\u0940\u092D';
    }

    const hero = document.createElement('section');
    hero.className = 'inner-breadcrumb-hero';
    hero.dataset.category = category;
    hero.style.setProperty('--breadcrumb-bg', `url("${image}")`);
    hero.innerHTML = `
      <div class="inner-breadcrumb-overlay"></div>
      <div class="inner-breadcrumb-pattern" aria-hidden="true"></div>
      <span class="devotional-float devotional-float-taal" aria-hidden="true"><i class="fas fa-music"></i></span>
      <span class="devotional-float devotional-float-mridang" aria-hidden="true"><i class="fas fa-drum"></i></span>
      <span class="devotional-float devotional-float-tulsi" aria-hidden="true"><i class="fas fa-leaf"></i></span>
      <span class="devotional-float devotional-float-veena" aria-hidden="true"><i class="fas fa-guitar"></i></span>
      <div class="inner-breadcrumb-content">
        <span class="inner-breadcrumb-eyebrow">${eyebrow}</span>
        <h1>${title}</h1>
        <nav class="inner-breadcrumb-nav" aria-label="Breadcrumb">
          <a href="${homePath}">\u092E\u0941\u0916\u094D\u092F\u092A\u0943\u0937\u094D\u0920</a>
          <span>\u203A</span>
          <a href="${parentHref}">${parentLabel}</a>
          <span>\u203A</span>
          <span>${title}</span>
        </nav>
      </div>
    `;

    const header = document.querySelector('body > header');
    if (header) {
      header.insertAdjacentElement('afterend', hero);
      document.body.classList.add('has-inner-breadcrumb');
    }
  };

  createInnerBreadcrumbHero();
  const socialProfiles = {
    facebook: 'https://www.facebook.com/vaakibh',
    instagram:
      'https://www.instagram.com/_vaakibh?igsh=MWJyYndzc3Rzc2k3MQ%3D%3D&utm_source=qr'
  };
  let footer = document.querySelector('footer');

  if (!footer) {
    footer = document.createElement('footer');
    const footerAnchor = document.querySelector('.floating-whatsapp');
    if (footerAnchor) {
      document.body.insertBefore(footer, footerAnchor);
    } else {
      document.body.appendChild(footer);
    }
  }

  footer.dataset.standardized = 'true';
  footer.innerHTML = `
    <div class="footer-container">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="${logoSrc}" alt="\u0935\u093E\u0915\u0940\u092D \u0932\u094B\u0917\u094B">
          <h3>\u0935\u093E\u0915\u0940\u092D</h3>
        </div>
        <p>
          \u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F, \u0905\u092D\u0902\u0917, \u0913\u0935\u094D\u092F\u093E \u0906\u0923\u093F \u0917\u094D\u0930\u0902\u0925\u093E\u0902\u091A\u093E \u0938\u092E\u0943\u0926\u094D\u0927 \u092E\u0930\u093E\u0920\u0940 \u0938\u0902\u0917\u094D\u0930\u0939.
          \u0935\u093E\u0930\u0915\u0930\u0940 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u091C\u0924\u0928, \u0938\u0902\u0935\u0930\u094D\u0927\u0928 \u0906\u0923\u093F \u092A\u094D\u0930\u0938\u093E\u0930 \u0939\u093E \u0906\u092E\u091A\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928.
        </p>
        <div class="footer-socials">
          <a href="${socialProfiles.facebook}" class="social-link" aria-label="\u092B\u0947\u0938\u092C\u0941\u0915" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f"></i></a>
          <a href="${socialProfiles.instagram}" class="social-link" aria-label="\u0907\u0928\u094D\u0938\u094D\u091F\u093E\u0917\u094D\u0930\u093E\u092E" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i></a>
        </div>
      </div>

      <div class="footer-links">
        <h4>\u092E\u0947\u0928\u094D\u092F\u0942</h4>
        <ul>
          <li><a href="${homePath}">\u092E\u0941\u0916\u092A\u0943\u0937\u094D\u0920</a></li>
          <li><a href="${homePath}#abhangs">\u0905\u092D\u0902\u0917/\u092D\u091C\u0928</a></li>
          <li><a href="${homePath}#saints">\u0938\u0902\u0924</a></li>
          <li><a href="${homePath}#categories">\u0935\u093F\u092D\u093E\u0917</a></li>
          <li><a href="${blogPath}">\u092C\u094D\u0932\u0949\u0917</a></li>
          <li><a href="${contactPath}">\u0938\u0902\u092A\u0930\u094D\u0915</a></li>
        </ul>
      </div>

      <div class="footer-links footer-blog-links">
        <h4>\u092C\u094D\u0932\u0949\u0917</h4>
        <ul>
          <li><a href="${blogPath.replace('index.html', 'namasmaran-mahatva/index.html')}">\u0928\u093E\u092E\u0938\u094D\u092E\u0930\u0923\u093E\u091A\u0947 \u092E\u0939\u0924\u094D\u0924\u094D\u0935</a></li>
          <li><a href="${blogPath.replace('index.html', 'abhang-vachan-man-sthir/index.html')}">\u0905\u092D\u0902\u0917 \u0935\u093E\u091A\u0928\u093E\u0928\u0947 \u092E\u0928 \u0938\u094D\u0925\u093F\u0930 \u0915\u0938\u0947 \u0939\u094B\u0924\u0947</a></li>
          <li><a href="${blogPath.replace('index.html', 'digital-sant-sahitya-jatan/index.html')}">\u0921\u093F\u091C\u093F\u091F\u0932 \u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F \u091C\u0924\u0928 \u0915\u093E \u092E\u0939\u0924\u094D\u0924\u094D\u0935\u093E\u091A\u0947 \u0906\u0939\u0947</a></li>
        </ul>
      </div>

      <div class="footer-contact">
        <h4>\u0938\u0902\u092A\u0930\u094D\u0915</h4>
        <ul class="footer-contact-list">
          <li><i class="fas fa-envelope"></i> vakibhmedia@gmail.com</li>
          <li><i class="fas fa-phone"></i> +91 99239 16476</li>
          <li><i class="fas fa-map-marker-alt"></i> \u092A\u0941\u0923\u0947, \u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930</li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; \u0968\u0966\u0968\u096C \u0935\u093E\u0915\u0940\u092D. \u0938\u0930\u094D\u0935 \u0939\u0915\u094D\u0915 \u0930\u093E\u0916\u0940\u0935. \u0938\u0902\u0915\u0947\u0924\u0938\u094D\u0925\u0933\u093E\u091A\u0940 \u0930\u091A\u0928\u093E \u0935 \u0935\u093F\u0915\u093E\u0938 <a href="https://webakoof.com" target="_blank" rel="noopener noreferrer">\u0935\u0947\u092C\u0915\u0942\u092B</a>.</p>
      <button class="scroll-top-btn" id="scrollTopBtn" aria-label="\u0935\u0930 \u091C\u093E">
        <i class="fas fa-chevron-up"></i>
      </button>
    </div>
  `;
  let floatingVeena = document.querySelector('.floating-veena');
  const floatingWhatsapp = document.querySelector('.floating-whatsapp');

  if (!floatingVeena) {
    floatingVeena = document.createElement('button');
    floatingVeena.type = 'button';
    floatingVeena.className = 'floating-veena';
    floatingVeena.setAttribute('aria-label', '?????? ??? ???');
    floatingVeena.innerHTML = `<img src="${sharedVeenaSrc}" alt="????">`;

    if (floatingWhatsapp?.parentNode) {
      floatingWhatsapp.parentNode.insertBefore(floatingVeena, floatingWhatsapp);
    } else {
      document.body.appendChild(floatingVeena);
    }
  } else {
    const veenaImg = floatingVeena.querySelector('img');
    if (veenaImg) {
      veenaImg.src = sharedVeenaSrc;
      veenaImg.alt = '????';
    }
  }

  // --- Mobile Menu Toggle ---
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('active')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      }
    });
  }

  // --- Toast Notification Helper ---
  const showToast = (message) => {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  };


  document.querySelectorAll('.lang-switch-group').forEach((group) => {
    if (!group.querySelector('[data-language-option="marathi"]')) {
      const mrButton = group.querySelector('.lang-switch');
      if (mrButton) {
        mrButton.dataset.languageOption = 'marathi';
        mrButton.textContent = 'मराठी';
      }
    }
    if (!group.querySelector('[data-language-option="english"]')) {
      const englishButton = document.createElement('button');
      englishButton.className = 'lang-switch';
      englishButton.type = 'button';
      englishButton.dataset.languageOption = 'english';
      englishButton.textContent = 'English';
      group.appendChild(englishButton);
    }
  });
  const languageButtons = Array.from(document.querySelectorAll('.lang-switch'));
  const translations = {
    marathi: {
      nav: [
        '\u092E\u0941\u0916\u092A\u0943\u0937\u094D\u0920',
        '\u0905\u092D\u0902\u0917/\u092D\u091C\u0928',
        '\u0938\u0902\u0924',
        '\u0935\u093F\u092D\u093E\u0917'
      ],
      searchLabel: '\u0936\u094B\u0927',
      footerMenu: '\u092E\u0947\u0928\u094D\u092F\u0942',
      footerBlog: '\u092C\u094D\u0932\u0949\u0917',
      footerContact: '\u0938\u0902\u092A\u0930\u094D\u0915',
      footerText: '\u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F, \u0905\u092D\u0902\u0917, \u0913\u0935\u094D\u092F\u093E \u0906\u0923\u093F \u0917\u094D\u0930\u0902\u0925\u093E\u0902\u091A\u093E \u0938\u092E\u0943\u0926\u094D\u0927 \u092E\u0930\u093E\u0920\u0940 \u0938\u0902\u0917\u094D\u0930\u0939. \u0935\u093E\u0930\u0915\u0930\u0940 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u091C\u0924\u0928, \u0938\u0902\u0935\u0930\u094D\u0927\u0928 \u0906\u0923\u093F \u092A\u094D\u0930\u0938\u093E\u0930 \u0939\u093E \u0906\u092E\u091A\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928.',
      footerLinks: [
        '\u092E\u0941\u0916\u092A\u0943\u0937\u094D\u0920',
        '\u0905\u092D\u0902\u0917/\u092D\u091C\u0928',
        '\u0938\u0902\u0924',
        '\u0935\u093F\u092D\u093E\u0917',
        '\u092C\u094D\u0932\u0949\u0917'
      ],
      footerBlogLinks: [
        '\u0928\u093E\u092E\u0938\u094D\u092E\u0930\u0923\u093E\u091A\u0947 \u092E\u0939\u0924\u094D\u0924\u094D\u0935',
        '\u0905\u092D\u0902\u0917 \u0935\u093E\u091A\u0928\u093E\u0928\u0947 \u092E\u0928 \u0938\u094D\u0925\u093F\u0930 \u0915\u0938\u0947 \u0939\u094B\u0924\u0947',
        '\u0921\u093F\u091C\u093F\u091F\u0932 \u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F \u091C\u0924\u0928 \u0915\u093E \u092E\u0939\u0924\u094D\u0924\u094D\u0935\u093E\u091A\u0947 \u0906\u0939\u0947'
      ],
      contactPrefix: [
        '\u0908\u092E\u0947\u0932',
        '\u092B\u094B\u0928',
        '\u092A\u0924\u094D\u0924\u093E'
      ],
      searchButtonLabel: '\u0936\u094B\u0927',
      saintsHeading: '\u0938\u0902\u0924 \u092A\u0930\u0902\u092A\u0930\u093E',
      saintsSubtitle: '\u092D\u0915\u094D\u0924\u0940\u092E\u093E\u0930\u094D\u0917\u093E\u091A\u0947 \u0926\u0940\u092A\u0938\u094D\u0924\u0902\u092D',
      seeAll: '\u0938\u0930\u094D\u0935 \u092A\u0939\u093E',
      saintNames: [
        '\u0938\u0902\u0924 \u091C\u094D\u091E\u093E\u0928\u0947\u0936\u094D\u0935\u0930',
        '\u0938\u0902\u0924 \u0924\u0941\u0915\u093E\u0930\u093E\u092E',
        '\u0938\u0902\u0924 \u0928\u093E\u092E\u0926\u0947\u0935',
        '\u0938\u0902\u0924 \u090F\u0915\u0928\u093E\u0925',
        '\u0938\u0902\u0924 \u0928\u093F\u0935\u0943\u0924\u094D\u0924\u093F\u0928\u093E\u0925',
        '\u0938\u0902\u0924 \u092E\u0941\u0915\u094D\u0924\u093E\u092C\u093E\u0908',
        '\u0938\u0902\u0924 \u0938\u094B\u092A\u093E\u0928\u0926\u0947\u0935',
        '\u0938\u0902\u0924 \u091A\u094B\u0916\u093E\u092E\u0947\u0933\u093E',
        '\u0938\u0902\u0924 \u091C\u0928\u093E\u092C\u093E\u0908',
        '\u0938\u0902\u0924 \u0917\u094B\u0930\u093E \u0915\u0941\u0902\u092D\u093E\u0930',
        '\u0938\u0902\u0924 \u0938\u093E\u0935\u0924\u093E \u092E\u093E\u0933\u0940',
        '\u0938\u0902\u0924 \u0930\u094B\u0939\u093F\u0926\u093E\u0938 \u092E\u0939\u093E\u0930\u093E\u091C'
      ],
      saintDescs: [
        '\u092D\u093E\u0935\u093E\u0930\u094D\u0925\u0926\u0940\u092A\u093F\u0915\u093E \u0906\u0923\u093F \u092D\u0915\u094D\u0924\u0940\u092E\u093E\u0930\u094D\u0917\u093E\u091A\u0947 \u0924\u0947\u091C\u0938\u094D\u0935\u0940 \u0926\u0940\u092A.',
        '\u0905\u092D\u0902\u0917\u093E\u0924\u0942\u0928 \u0935\u093F\u0920\u094D\u0920\u0932\u092D\u0915\u094D\u0924\u0940\u091A\u093E \u0938\u0930\u0933 \u092E\u093E\u0930\u094D\u0917 \u0926\u093E\u0916\u0935\u0923\u093E\u0930\u0947 \u0938\u0902\u0924.',
        '\u0928\u093E\u092E\u0938\u094D\u092E\u0930\u0923 \u0906\u0923\u093F \u0935\u093F\u0920\u094D\u0920\u0932\u092A\u094D\u0930\u0947\u092E\u093E\u091A\u0947 \u092A\u094D\u0930\u0924\u0940\u0915.',
        '\u092D\u093E\u0930\u0941\u0921, \u0905\u092D\u0902\u0917 \u0906\u0923\u093F \u091C\u094D\u091E\u093E\u0928\u0947\u0936\u094D\u0935\u0930\u0940 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u0905\u092D\u094D\u092F\u093E\u0938\u0915.',
        '\u0928\u093E\u0925 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0915 \u0906\u0923\u093F \u0935\u0948\u0930\u093E\u0917\u094D\u092F\u093E\u091A\u0947 \u092A\u094D\u0930\u0924\u0940\u0915.',
        '\u0928\u093F\u0930\u094D\u092E\u0933 \u092D\u0915\u094D\u0924\u0940 \u0906\u0923\u093F \u091C\u094D\u091E\u093E\u0928\u092A\u094D\u0930\u0947\u092E\u093E\u091A\u0940 \u092A\u094D\u0930\u0938\u0928\u094D\u0928 \u0935\u093E\u0923\u0940.',
        '\u0928\u093E\u0925 \u092A\u0930\u0902\u092A\u0930\u0947\u0924\u0940\u0932 \u0938\u0902\u0924 \u0906\u0923\u093F \u0938\u0902\u0924\u0935\u093E\u0923\u0940\u091A\u093E \u0915\u094B\u092E\u0932 \u0938\u094D\u0935\u0930.',
        '\u0936\u0941\u0926\u094D\u0927 \u0905\u0902\u0924\u0903\u0915\u0930\u0923\u093E\u091A\u0947 \u0935\u093F\u0920\u094D\u0920\u0932\u092D\u0915\u094D\u0924.',
        '\u0938\u093E\u0927\u094D\u092F\u093E \u0913\u0935\u094D\u092F\u093E\u0902\u0924\u0942\u0928 \u092D\u0915\u094D\u0924\u0940\u091A\u0947 \u092E\u093E\u0927\u0941\u0930\u094D\u092F.',
        '\u0938\u0930\u0933 \u091C\u0940\u0935\u0928\u093E\u0924\u0942\u0928 \u092A\u0930\u092E\u093E\u0930\u094D\u0925\u093E\u091A\u093E \u092C\u094B\u0927 \u0926\u0947\u0923\u093E\u0930\u0940 \u0935\u093E\u0923\u0940.',
        '\u0936\u0947\u0924\u093E\u0924 \u0935\u093F\u0920\u094D\u0920\u0932 \u092A\u093E\u0939\u0923\u093E\u0930\u0947 \u0935\u093E\u0930\u0915\u0930\u0940 \u0938\u0902\u0924.',
        '\u092D\u0915\u094D\u0924\u0940 \u0906\u0923\u093F \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0938\u092E\u0924\u0947\u091A\u0947 \u092A\u0941\u0930\u0938\u094D\u0915\u0930\u094D\u0924\u0947.'
      ],
      blogTitles: [
        '\u0928\u093E\u092E\u0938\u094D\u092E\u0930\u0923\u093E\u091A\u0947 \u092E\u0939\u0924\u094D\u0924\u094D\u0935',
        '\u0905\u092D\u0902\u0917 \u0935\u093E\u091A\u0928\u093E\u0928\u0947 \u092E\u0928 \u0938\u094D\u0925\u093F\u0930 \u0915\u0938\u0947 \u0939\u094B\u0924\u0947',
        '\u0921\u093F\u091C\u093F\u091F\u0932 \u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F \u091C\u0924\u0928 \u0915\u093E \u092E\u0939\u0924\u094D\u0924\u094D\u0935\u093E\u091A\u0947 \u0906\u0939\u0947'
      ],
      blogTags: [
        '\u0928\u093E\u092E\u0938\u094D\u092E\u0930\u0923',
        '\u0905\u092D\u0902\u0917 \u0935\u093E\u091A\u0928',
        '\u0921\u093F\u091C\u093F\u091F\u0932 \u0938\u0902\u0917\u094D\u0930\u0939'
      ],
      blogAuthor: '\u0935\u093E\u0915\u0940\u092D \u0938\u0902\u092A\u093E\u0926\u0915',
      selectedToast: '\u092E\u0930\u093E\u0920\u0940 \u092D\u093E\u0937\u093E \u0928\u093F\u0935\u0921\u0932\u0940 \u0906\u0939\u0947.'
    },    english: {
      nav: ['Home', 'Abhang/Bhajan', 'Saints', 'Categories', 'Contact'],
      searchLabel: 'Search',
      footerMenu: 'Menu',
      footerBlog: 'Blog',
      footerContact: 'Contact',
      footerText: 'A rich Marathi collection of saint literature, abhangs, ovis and sacred texts. Our effort is to preserve, nurture and share the Warkari tradition.',
      footerLinks: ['Home', 'Abhang/Bhajan', 'Saints', 'Categories', 'Blog', 'Contact'],
      footerBlogLinks: [
        'The Importance of Namasmaran in the Warkari Tradition',
        'How Abhang Reading Steadies the Mind',
        'Why Preserving Sant Literature Matters in the Digital Age'
      ],
      contactPrefix: ['Email', 'Phone', 'Address'],
      searchButtonLabel: 'Search',
      saintsHeading: 'Saint Tradition',
      saintsSubtitle: 'Great saints of Maharashtra',
      seeAll: 'See All',
      saintNames: [
        '\u0938\u0902\u0924 \u091C\u094D\u091E\u093E\u0928\u0947\u0936\u094D\u0935\u0930',
        '\u0938\u0902\u0924 \u0924\u0941\u0915\u093E\u0930\u093E\u092E',
        '\u0938\u0902\u0924 \u0928\u093E\u092E\u0926\u0947\u0935',
        '\u0938\u0902\u0924 \u090F\u0915\u0928\u093E\u0925',
        '\u0938\u0902\u0924 \u0928\u093F\u0935\u0943\u0924\u094D\u0924\u093F\u0928\u093E\u0925',
        '\u0938\u0902\u0924 \u092E\u0941\u0915\u094D\u0924\u093E\u092C\u093E\u0908',
        '\u0938\u0902\u0924 \u0938\u094B\u092A\u093E\u0928\u0926\u0947\u0935',
        '\u0938\u0902\u0924 \u091A\u094B\u0916\u093E\u092E\u0947\u0933\u093E',
        '\u0938\u0902\u0924 \u091C\u0928\u093E\u092C\u093E\u0908',
        '\u0938\u0902\u0924 \u0917\u094B\u0930\u093E \u0915\u0941\u0902\u092D\u093E\u0930',
        '\u0938\u0902\u0924 \u0938\u093E\u0935\u0924\u093E \u092E\u093E\u0933\u0940',
        '\u0938\u0902\u0924 \u0930\u094B\u0939\u093F\u0926\u093E\u0938 \u092E\u0939\u093E\u0930\u093E\u091C'
      ],
      saintDescs: [
        '\u092D\u093E\u0935\u093E\u0930\u094D\u0925\u0926\u0940\u092A\u093F\u0915\u093E \u0906\u0923\u093F \u092D\u0915\u094D\u0924\u0940\u092E\u093E\u0930\u094D\u0917\u093E\u091A\u0947 \u0924\u0947\u091C\u0938\u094D\u0935\u0940 \u0926\u0940\u092A.',
        '\u0905\u092D\u0902\u0917\u093E\u0924\u0942\u0928 \u0935\u093F\u0920\u094D\u0920\u0932\u092D\u0915\u094D\u0924\u0940\u091A\u093E \u0938\u0930\u0933 \u092E\u093E\u0930\u094D\u0917 \u0926\u093E\u0916\u0935\u0923\u093E\u0930\u0947 \u0938\u0902\u0924.',
        '\u0928\u093E\u092E\u0938\u094D\u092E\u0930\u0923 \u0906\u0923\u093F \u0935\u093F\u0920\u094D\u0920\u0932\u092A\u094D\u0930\u0947\u092E\u093E\u091A\u0947 \u092A\u094D\u0930\u0924\u0940\u0915.',
        '\u092D\u093E\u0930\u0941\u0921, \u0905\u092D\u0902\u0917 \u0906\u0923\u093F \u091C\u094D\u091E\u093E\u0928\u0947\u0936\u094D\u0935\u0930\u0940 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u0905\u092D\u094D\u092F\u093E\u0938\u0915.',
        '\u0928\u093E\u0925 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0915 \u0906\u0923\u093F \u0935\u0948\u0930\u093E\u0917\u094D\u092F\u093E\u091A\u0947 \u092A\u094D\u0930\u0924\u0940\u0915.',
        '\u0928\u093F\u0930\u094D\u092E\u0933 \u092D\u0915\u094D\u0924\u0940 \u0906\u0923\u093F \u091C\u094D\u091E\u093E\u0928\u092A\u094D\u0930\u0947\u092E\u093E\u091A\u0940 \u092A\u094D\u0930\u0938\u0928\u094D\u0928 \u0935\u093E\u0923\u0940.',
        '\u0928\u093E\u0925 \u092A\u0930\u0902\u092A\u0930\u0947\u0924\u0940\u0932 \u0938\u0902\u0924 \u0906\u0923\u093F \u0938\u0902\u0924\u0935\u093E\u0923\u0940\u091A\u093E \u0915\u094B\u092E\u0932 \u0938\u094D\u0935\u0930.',
        '\u0936\u0941\u0926\u094D\u0927 \u0905\u0902\u0924\u0903\u0915\u0930\u0923\u093E\u091A\u0947 \u0935\u093F\u0920\u094D\u0920\u0932\u092D\u0915\u094D\u0924.',
        '\u0938\u093E\u0927\u094D\u092F\u093E \u0913\u0935\u094D\u092F\u093E\u0902\u0924\u0942\u0928 \u092D\u0915\u094D\u0924\u0940\u091A\u0947 \u092E\u093E\u0927\u0941\u0930\u094D\u092F.',
        '\u0938\u0930\u0933 \u091C\u0940\u0935\u0928\u093E\u0924\u0942\u0928 \u092A\u0930\u092E\u093E\u0930\u094D\u0925\u093E\u091A\u093E \u092C\u094B\u0927 \u0926\u0947\u0923\u093E\u0930\u0940 \u0935\u093E\u0923\u0940.',
        '\u0936\u0947\u0924\u093E\u0924 \u0935\u093F\u0920\u094D\u0920\u0932 \u092A\u093E\u0939\u0923\u093E\u0930\u0947 \u0935\u093E\u0930\u0915\u0930\u0940 \u0938\u0902\u0924.',
        '\u092D\u0915\u094D\u0924\u0940 \u0906\u0923\u093F \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0938\u092E\u0924\u0947\u091A\u0947 \u092A\u0941\u0930\u0938\u094D\u0915\u0930\u094D\u0924\u0947.'
      ],
      blogTitles: [
        'The Importance of Namasmaran in the Warkari Tradition',
        'How Abhang Reading Steadies the Mind',
        'Why Preserving Sant Literature Matters in the Digital Age'
      ],
      blogTags: ['Warkari Tradition', 'Abhang Reflection', 'Digital Preservation'],
      blogAuthor: 'Vakibh Editorial Team',
      selectedToast: 'English view enabled for common labels.'
    }
  };


  // --- Bilingual Devotional Literature Support ---
  const bilingualState = {
    ready: false,
    pageKey: window.location.pathname.replace(/\\/g, '/').replace(/\/index\.html$/i, '/index.html'),
    data: {},
    model: null,
    originalTitle: document.title
  };

  const devotionalUiDictionary = {
    'गृहपृष्ठ': 'Home',
    'मुखपृष्ठ': 'Home',
    'साहित्य': 'Literature',
    'अभंग': 'Abhangs',
    'अभंग सूची': 'Abhang List',
    'आरती': 'Aarti',
    'चरित्र': 'Biography',
    'माहिती': 'Information',
    'तीर्थक्षेत्र': 'Pilgrimage Place',
    'समाधी': 'Samadhi',
    'मंदिर': 'Temple',
    'गाथा': 'Gatha',
    'हरिपाठ': 'Haripath',
    'अध्याय': 'Chapter',
    'ग्रंथ': 'Sacred Texts',
    'संत ज्ञानेश्वर महाराज': 'Sant Dnyaneshwar Maharaj',
    'संत तुकाराम महाराज': 'Sant Tukaram Maharaj',
    'संत नामदेव महाराज': 'Sant Namdev Maharaj',
    'संत एकनाथ महाराज': 'Sant Eknath Maharaj',
    'संत सावता माळी': 'Sant Savata Mali',
    'संत गोरा कुंभार': 'Sant Gora Kumbhar',
    'संत सोपानदेव': 'Sant Sopandev',
    'संत मुक्ताबाई': 'Sant Muktabai',
    'संत निवृत्तीनाथ': 'Sant Nivruttinath',
    'संत निवृत्तिनाथ': 'Sant Nivruttinath',
    'संत चोखामेळा': 'Sant Chokhamela',
    'संत चोखामेळा महाराज': 'Sant Chokhamela Maharaj',
    'संत रोहिदास महाराज': 'Sant Rohidas Maharaj',
    'संत जनाबाई': 'Sant Janabai',
    'संत सावता माळीचे चरित्र': 'Sant Savata Mali Biography',
    'संत सावता माळींचे अभंग': 'Sant Savata Mali Abhangs',
    'संत गोरा कुंभार चरित्र': 'Sant Gora Kumbhar Biography',
    'संत गोरा कुंभार अभंग': 'Sant Gora Kumbhar Abhangs',
    'संत सोपानदेव चरित्र': 'Sant Sopandev Biography',
    'संत सोपानदेव अभंग': 'Sant Sopandev Abhangs',
    'संत मुक्ताबाई चरित्र': 'Sant Muktabai Biography',
    'संत मुक्ताबाई अभंग': 'Sant Muktabai Abhangs',
    'संत मुक्ताबाई आरती': 'Sant Muktabai Aarti',
    'संत निवृत्तीनाथ चरित्र': 'Sant Nivruttinath Biography',
    'संत निवृत्तीनाथ अभंग': 'Sant Nivruttinath Abhangs',
    'संत निवृत्तीनाथ समाधी': 'Sant Nivruttinath Samadhi',
    'संत चोखामेळा चरित्र': 'Sant Chokhamela Biography',
    'संत चोखामेळा अभंग': 'Sant Chokhamela Abhangs',
    'संत चोखामेळा समाधी मंदिर': 'Sant Chokhamela Samadhi Temple',
    'हरिविण व्यर्थ आचार': 'Harivin Vyarth Achar',
    'वरती करा कर दोन्ही': 'Varti Kara Kar Donhi'
  };

  const devanagariToEnglishDigits = (value = '') => value.replace(/[०-९]/g, (digit) => '०१२३४५६७८९'.indexOf(digit));

  const englishUiLabel = (value = '') => {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (!clean) return clean;
    if (devotionalUiDictionary[clean]) return devotionalUiDictionary[clean];
    let translated = clean;
    Object.keys(devotionalUiDictionary).sort((a, b) => b.length - a.length).forEach((mr) => {
      translated = translated.split(mr).join(devotionalUiDictionary[mr]);
    });
    return devanagariToEnglishDigits(translated)
      .replace(/संत/g, 'Sant')
      .replace(/महाराज/g, 'Maharaj')
      .replace(/अभंग/g, 'Abhang')
      .replace(/आरती/g, 'Aarti')
      .replace(/चरित्र/g, 'Biography')
      .replace(/साहित्य/g, 'Literature')
      .replace(/सूची/g, 'List')
      .replace(/ते/g, 'to')
      .replace(/–\s*वाकीभ/g, '- Vakibh')
      .replace(/\s+/g, ' ')
      .trim() || clean;
  };

  const restoreOrTranslateUiText = (selector, selectedLanguage) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (!node.dataset.mrText) node.dataset.mrText = node.textContent.trim();
      node.textContent = selectedLanguage === 'english' ? englishUiLabel(node.dataset.mrText) : node.dataset.mrText;
    });
  };

  const loadBilingualData = async () => {
    if (bilingualState.ready) return bilingualState.data;
    bilingualState.ready = true;
    const inline = document.getElementById('vakibh-bilingual-content');
    if (inline?.textContent?.trim()) {
      try { bilingualState.data = JSON.parse(inline.textContent); } catch (error) { console.warn('Invalid bilingual content JSON.', error); }
    }
    try {
      const response = await fetch(`${siteBasePath}Vakibh/data/bilingual-content.json`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        bilingualState.data = { ...data, ...bilingualState.data };
      }
    } catch (error) {
      // Static/file previews may block fetch; the fallback card still works.
    }
    return bilingualState.data;
  };

  const findPageBilingualRecord = () => {
    const data = bilingualState.data || {};
    const normalizedPath = window.location.pathname.replace(/\\/g, '/');
    const candidates = [
      normalizedPath,
      normalizedPath.replace(/^.*?\/Vakibh-media\//, 'Vakibh-media/'),
      normalizedPath.replace(/^.*?\/sants\//, 'sants/'),
      normalizedPath.replace(/\/index\.html$/i, '/'),
      bilingualState.pageKey
    ];
    return candidates.map((key) => data[key]).find(Boolean) || {};
  };

  const ensureDevotionalBilingualModel = () => null;

  const ensureEnglishSeo = (record, model) => {
    if (!record?.title_en && !record?.description_en) return;
    let alt = document.querySelector('link[rel="alternate"][hreflang="en"]');
    if (!alt) {
      alt = document.createElement('link');
      alt.rel = 'alternate';
      alt.hreflang = 'en';
      document.head.appendChild(alt);
    }
    alt.href = window.location.href;
    let meta = document.querySelector('meta[name="description"][data-lang="en"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.dataset.lang = 'en';
      document.head.appendChild(meta);
    }
    meta.content = record.description_en || `${record.title_en || model.title_mr} - English translation.`;
    if (!document.querySelector('script[type="application/ld+json"][data-lang="en"]')) {
      const ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.dataset.lang = 'en';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        inLanguage: ['mr', 'en'],
        name: record.title_en || model.title_mr,
        translationOfWork: model.title_mr,
        url: window.location.href
      });
      document.head.appendChild(ld);
    }
  };

  const applyBilingualDevotionalContent = (selectedLanguage) => {
    document.querySelectorAll('.post-content.is-english-mode').forEach((node) => {
      node.classList.remove('is-english-mode');
    });
    document.body.classList.toggle('language-english', selectedLanguage === 'english');
  };

  const applyBilingualUiLabels = (selectedLanguage) => {
    restoreOrTranslateUiText('.sahitya-link, .dnyaneshwar-link, .tukaram-link, .sant-quick-link, .post-category-link, .sahitya-heading, .sant-page-h1', selectedLanguage);
    restoreOrTranslateUiText('.sant-breadcrumb a, .sant-breadcrumb span:not(.bc-sep), .inner-breadcrumb-nav a, .inner-breadcrumb-nav span:last-child, .inner-breadcrumb-eyebrow', selectedLanguage);
    document.querySelectorAll('[data-bilingual-label="originalMarathi"]').forEach((node) => {
      node.textContent = selectedLanguage === 'english' ? 'Original Marathi' : 'मराठी';
    });
  };
  const applyLanguageSelection = (language) => {
    const selectedLanguage = translations[language] ? language : 'marathi';
    const languagePack = translations[selectedLanguage];

    languageButtons.forEach((button) => {
      const option = button.dataset.languageOption || button.dataset.language || 'marathi';
      button.dataset.language = selectedLanguage;
      button.textContent = option === 'english' ? 'English' : 'मराठी';
      button.classList.toggle('active', option === selectedLanguage);
      button.setAttribute('aria-pressed', option === selectedLanguage ? 'true' : 'false');
      button.setAttribute('title', selectedLanguage === 'english' ? 'Click to switch language' : '\u092D\u093E\u0937\u093E \u092C\u0926\u0932\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0915\u094D\u0932\u093F\u0915 \u0915\u0930\u093E');
    });

    document.documentElement.lang = selectedLanguage === 'english' ? 'en' : 'mr';
    document.body.dataset.language = selectedLanguage;

    const navLinks = Array.from(document.querySelectorAll('#navMenu ul li a')).slice(0, 5);
    navLinks.forEach((link, index) => {
      if (languagePack.nav[index]) {
        link.textContent = languagePack.nav[index];
      }
    });

    const searchButton = document.getElementById('searchTrigger');
    if (searchButton) {
      searchButton.setAttribute('aria-label', languagePack.searchLabel);
      searchButton.setAttribute('title', languagePack.searchLabel);
    }

    const footerMenuHeading = Array.from(document.querySelectorAll('.footer-links h4'))[0];
    const footerBlogHeading = Array.from(document.querySelectorAll('.footer-links h4'))[1];
    const footerContactHeading = document.querySelector('.footer-contact h4');
    const footerBrandText = document.querySelector('.footer-brand p');
    const footerMenuLinks = Array.from(document.querySelectorAll('.footer-links ul li a')).slice(0, 6);
    const footerBlogLinks = Array.from(document.querySelectorAll('.footer-blog-links ul li a')).slice(0, 3);
    const footerContactItems = Array.from(document.querySelectorAll('.footer-contact-list li'));
    const saintsHeading = document.querySelector('.saints-section .section-title-container h2');
    const saintsSubtitle = document.querySelector('.saints-section .section-title-container p');
    const saintsSeeAll = document.querySelector('.saints-section .see-all-btn');
    const saintNames = Array.from(document.querySelectorAll('.saints-section .saint-name')).slice(0, 12);
    const saintDescs = Array.from(document.querySelectorAll('.saints-section .saint-desc')).slice(0, 12);
    const blogCardTitles = Array.from(document.querySelectorAll('.blog-card .arrival-title a')).slice(0, 3);
    const blogCardTags = Array.from(document.querySelectorAll('.blog-card .arrival-tag')).slice(0, 3);
    const blogCardAuthors = Array.from(document.querySelectorAll('.blog-card .arrival-author')).slice(0, 3);

    if (footerMenuHeading) footerMenuHeading.textContent = languagePack.footerMenu;
    if (footerBlogHeading) footerBlogHeading.textContent = languagePack.footerBlog;
    if (footerContactHeading) footerContactHeading.textContent = languagePack.footerContact;
    if (footerBrandText) footerBrandText.textContent = languagePack.footerText;

    footerMenuLinks.forEach((link, index) => {
      if (languagePack.footerLinks[index]) {
        link.textContent = languagePack.footerLinks[index];
      }
    });

    footerBlogLinks.forEach((link, index) => {
      if (languagePack.footerBlogLinks[index]) {
        link.textContent = languagePack.footerBlogLinks[index];
      }
    });

    footerContactItems.forEach((item, index) => {
      const icon = item.querySelector('i');
      const textNode = item.childNodes[item.childNodes.length - 1];
      const currentText = (textNode?.textContent || '').trim();
      const value = currentText.replace(/^[^:]+:\s*/, '');
      if (textNode && languagePack.contactPrefix[index]) {
        textNode.textContent = ` ${languagePack.contactPrefix[index]}: ${value}`;
      } else if (!textNode && icon && languagePack.contactPrefix[index]) {
        item.append(` ${languagePack.contactPrefix[index]}: ${value}`);
      }
    });

    if (saintsHeading) saintsHeading.textContent = languagePack.saintsHeading;
    if (saintsSubtitle) saintsSubtitle.textContent = languagePack.saintsSubtitle;
    if (saintsSeeAll) saintsSeeAll.textContent = languagePack.seeAll;

    saintNames.forEach((item, index) => {
      if (languagePack.saintNames[index]) {
        item.textContent = languagePack.saintNames[index];
      }
    });

    saintDescs.forEach((item, index) => {
      if (languagePack.saintDescs[index]) {
        item.textContent = languagePack.saintDescs[index];
      }
    });

    blogCardTitles.forEach((item, index) => {
      if (languagePack.blogTitles[index]) {
        item.textContent = languagePack.blogTitles[index];
      }
    });

    blogCardTags.forEach((item, index) => {
      if (languagePack.blogTags[index]) {
        item.textContent = languagePack.blogTags[index];
      }
    });

    blogCardAuthors.forEach((item) => {
      item.textContent = languagePack.blogAuthor;
    });

    applyBilingualUiLabels(selectedLanguage);
    applyBilingualDevotionalContent(selectedLanguage);
    removeUnwantedTranslationSections();
  };

  if (languageButtons.length) {
    const storedLanguage = localStorage.getItem('vakibh-language');
    applyLanguageSelection(storedLanguage === 'english' ? 'english' : 'marathi');
    loadBilingualData().then(() => applyLanguageSelection(localStorage.getItem('vakibh-language') === 'english' ? 'english' : 'marathi'));

    languageButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextLanguage = button.dataset.languageOption || (button.dataset.language === 'english' ? 'marathi' : 'english');
        applyLanguageSelection(nextLanguage);
        localStorage.setItem('vakibh-language', nextLanguage);

        if (nextLanguage === 'english') {
          showToast(translations.english.selectedToast);
        } else {
          showToast(translations.marathi.selectedToast);
        }
      });
    });
  }

  const normalizeText = (value) => (value || '').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();

  const copyTextToClipboard = async (text) => {
    if (!text) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.error('Clipboard API copy failed:', error);
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);
      return copied;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      return false;
    }
  };

  const getAbhangPostActionsMarkup = () => `
    <div class="abhang-post-actions abhang-card-footer" data-share-scope="post">
      <div class="abhang-actions-left">
        <button class="abhang-btn copy-abhang-btn" aria-label="???? ???? ???">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="??????????? ???? ???">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="???????? ???? ???">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="??????????????? ???? ???">
            <i class="fab fa-instagram"></i>
          </button>
          <button class="abhang-btn social-share-btn copy-link-share-btn" data-platform="copylink" aria-label="???? ???? ???? ???">
            <i class="fas fa-link"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const getAbhangItemActionsMarkup = (targetId, itemLabel) => `
    <div class="abhang-item-actions abhang-card-footer" data-share-scope="item" data-share-target="${targetId}" data-share-label="${itemLabel}">
      <div class="abhang-actions-left">
        <button class="abhang-btn copy-abhang-btn" aria-label="????? ???? ???">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="??????????? ???? ???">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="???????? ???? ???">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="??????????????? ???? ???">
            <i class="fab fa-instagram"></i>
          </button>
          <button class="abhang-btn social-share-btn copy-link-share-btn" data-platform="copylink" aria-label="???? ???? ???? ???">
            <i class="fas fa-link"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const createAbhangPostActions = () => {
    const abhangPosts = document.querySelectorAll('.abhang-post, .post-article');
    abhangPosts.forEach((post) => {
      const existingActions = post.querySelector('.abhang-post-actions');
      const legacyActions = post.querySelector('.post-actions');

      if (existingActions && legacyActions) {
        legacyActions.remove();
        return;
      }

      if (!existingActions && legacyActions) {
        legacyActions.outerHTML = getAbhangPostActionsMarkup();
        return;
      }

      if (post.querySelector('.abhang-post-actions')) return;

      const postContent = post.querySelector('.post-content');
      if (!postContent) return;

      postContent.insertAdjacentHTML('afterbegin', getAbhangPostActionsMarkup());
    });
  };

  createAbhangPostActions();

  const formatSarthHaripathPage = () => {
    if (!location.pathname.includes('/sants/dnyaneshwar/sarth-haripath/')) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    if (!postContent || postContent.querySelector('.abhang-readable-list')) return;

    const actions = postContent.querySelector('.abhang-post-actions');
    const nodesToFormat = Array.from(postContent.childNodes).filter((node) => node !== actions);
    const rawText = normalizeText(nodesToFormat.map((node) => node.textContent || '').join('\n'));
    if (!rawText) return;

    const itemPattern = /(^|\n|\s)([\u0966-\u096F]+)\s+(?=[^\n]*\u0965\u0967\u0965)/g;
    const verseMarkerPattern = /[\u0964\u0965]/;
    const meaningLabelPattern = /^\s*(\u0905\u0930\u094D\u0925|\u092D\u093E\u0935\u093E\u0930\u094D\u0925|meaning)\s*[:：\-–—]?\s*$/i;
    const matches = Array.from(rawText.matchAll(itemPattern));
    if (!matches.length) return;

    const cleanText = (value) => normalizeText(value
      .replace(/[^\n]*\u0935\u093F\u0921\u093F\u0913[^\n]*/g, '')
      .replace(/\([^\n]*\u0939\u0930\u093F\u092A\u093E\u0920[^\n]*\)/g, ''));

    const splitMeaningParagraphs = (value) => cleanText(value)
      .split(/\n{2,}|(?<=\u0965[\u0966-\u096F]+\u0965)\s+(?=[^\u0965\n]{18,})/)
      .map((part) => cleanText(part))
      .filter(Boolean);
    const renderVerseLines = (value) => {
      const compact = cleanText(value).replace(/\s+/g, ' ');
      const pieces = compact.split(verseMarkerPattern).map((part) => part.trim()).filter(Boolean);
      const lines = [];

      for (let index = 0; index < pieces.length; index += 2) {
        const textPart = pieces[index] || '';
        const markerPart = pieces[index + 1] || '';
        const line = cleanText(`${textPart} ${markerPart}`);
        if (line) lines.push(line);
      }

      return lines;
    };

    const list = document.createElement('div');
    list.className = 'abhang-readable-list';

    matches.forEach((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? rawText.length;
      const number = match[2];
      const chunk = cleanText(rawText.slice(start, end));
      if (!chunk) return;

      const parts = chunk.split(meaningLabelPattern);
      let verseText = parts.shift() || '';
      let meaningText = parts.join('\u0905\u0930\u094D\u0925:');

      if (!meaningText) {
        const verseMarkers = Array.from(verseText.matchAll(/\u0965[\u0966-\u096F]+\u0965/g));
        const lastMarker = verseMarkers[verseMarkers.length - 1];

        if (lastMarker) {
          const splitAt = lastMarker.index + lastMarker[0].length;
          meaningText = verseText.slice(splitAt);
          verseText = verseText.slice(0, splitAt);
        }
      }

      const verseLines = renderVerseLines(verseText);
      const meaningParagraphs = splitMeaningParagraphs(meaningText);

      if (!verseLines.length && !meaningParagraphs.length) return;

      const section = document.createElement('section');
      section.className = 'abhang-readable-item';
      section.id = `haripath-${number}`;
      section.dataset.abhangItem = 'true';
      section.dataset.abhangNumber = number;

      const numberEl = document.createElement('div');
      numberEl.className = 'abhang-readable-number';
      numberEl.textContent = number;
      section.appendChild(numberEl);

      const verseBlock = document.createElement('div');
      verseBlock.className = 'abhang-readable-verses';
      verseLines.forEach((line, lineIndex) => {
        const lineEl = document.createElement('p');
        lineEl.textContent = line;
        if (lineIndex === 0) {
          lineEl.dataset.verseNumber = number;
        }
        verseBlock.appendChild(lineEl);
      });
      section.appendChild(verseBlock);

      if (meaningParagraphs.length) {
        const meaningBlock = document.createElement('div');
        meaningBlock.className = 'abhang-readable-meaning';
        meaningParagraphs.forEach((paragraph) => {
          const paragraphEl = document.createElement('p');
          paragraphEl.textContent = paragraph;
          meaningBlock.appendChild(paragraphEl);
        });
        section.appendChild(meaningBlock);
      }

      list.appendChild(section);
    });

    if (!list.children.length) return;
    nodesToFormat.forEach((node) => node.remove());
    postContent.appendChild(list);
  };

  formatSarthHaripathPage();

  const cleanupDnyaneshwariAudioBlocks = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const isDnyaneshwariDetail = path.includes('/sants/dnyaneshwar/adhyay-') || path.includes('/sants/dnyaneshwar/sarth-dnyaneshwari/');
    const isGranthDetail = document.querySelector('.abhang-post-main .post-content .ovi, .abhang-post-main .post-content .oviar');
    if (!isDnyaneshwariDetail && !isGranthDetail) return;

    const postContent = document.querySelector('.abhang-post-main .post-content');
    if (!postContent) return;

    const audioTextPattern = /(\u0911\u0921\u093F\u0913|\u0911\u0921\u093F\u092F\u094B|audio|mp3|\u0935\u0930\u0940\u0932\s+\u0911\u0921\u093F\u0913|\u091F\u093E\u0915\u093E\u092F\u091A\u0940\s+\u092A\u0930\u0935\u093E\u0928\u0917\u0940|\u092E\u0928\u0940\u0937\u093E\s+\u092D\u093E\u0938\u094D\u0915\u0930|\u0906\u092D\u093E\u0930|video\s+.*audio)/i;
    const protectedSelector = '.ovi, .oviar, .abhang-readable-verses, .abhang-readable-meaning, .devotional-numbered-verse';

    postContent.querySelectorAll('audio, .wp-audio-shortcode, .mejs-container, .mejs-audio, .elementor-widget-audio, [class*="audio"], [id*="audio"]').forEach((element) => {
      const removable = element.closest('.elementor-section, .elementor-widget, p, figure, div') || element;
      if (!removable.closest(protectedSelector)) removable.remove();
    });

    postContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span.elementor-heading-title, .elementor-heading-title, .elementor-widget-container').forEach((element) => {
      if (element.closest(protectedSelector)) return;
      const text = normalizeText(element.textContent || '');
      if (!audioTextPattern.test(text)) return;
      const removable = element.closest('.elementor-section, .elementor-widget, .elementor-widget-container, p, div') || element;
      if (!removable.closest(protectedSelector)) removable.remove();
    });

    postContent.querySelectorAll('.elementor-section, .elementor-column, .elementor-widget, .elementor-widget-wrap, .elementor-container').forEach((element) => {
      if (element.closest(protectedSelector)) return;
      if (!normalizeText(element.textContent || '') && !element.querySelector('img, iframe, canvas, svg, .ovi, .oviar')) {
        element.remove();
      }
    });
  };

  cleanupDnyaneshwariAudioBlocks();

  const splitLegacyDnyaneshwariParagraphs = () => {
    if (!document.body.classList.contains('is-dnyaneshwari-adhyay-page')) return;

    const trimBreaks = (html = '') => html
      .replace(/^(?:\s|&nbsp;|<br\s*\/?\s*>)+/gi, '')
      .replace(/(?:\s|&nbsp;|<br\s*\/?\s*>)+$/gi, '')
      .trim();

    const roots = document.querySelectorAll('.abhang-post-main .entry-content, .abhang-post-main .post-content, .post-article .entry-content');

    roots.forEach((root) => {
      root.querySelectorAll('p').forEach((paragraph) => {
        if (paragraph.closest('.ovi, .oviar, .abhang-readable-meaning, .devotional-numbered-verse')) return;
        if (paragraph.querySelector('iframe, img, video, audio, table')) return;

        const rawHtml = paragraph.innerHTML || '';
        const rawText = normalizeText(paragraph.innerText || paragraph.textContent || '');
        const hasBreaks = /<br\s*\/?\s*>/i.test(rawHtml);
        const startsAsVerse = paragraph.firstElementChild?.tagName === 'STRONG' || /^\s*<strong[\s>]/i.test(rawHtml);
        const hasVerseMarker = /[\u0964\u0965]/.test(rawText);

        if (!hasBreaks || !startsAsVerse || !hasVerseMarker) return;

        const verseParts = [];
        const meaningParts = [];
        let collectingMeaning = false;
        let hasVerseContent = false;

        Array.from(paragraph.childNodes).forEach((node) => {
          const wrapper = document.createElement('div');
          wrapper.appendChild(node.cloneNode(true));
          const nodeHtml = wrapper.innerHTML;
          const nodeText = normalizeText(node.textContent || '');
          const isBreak = node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR';
          const isWhitespace = !nodeText && !/<\w+/i.test(nodeHtml);
          const isStrong = node.nodeType === Node.ELEMENT_NODE && node.tagName === 'STRONG';

          if (!collectingMeaning && (isStrong || isBreak || isWhitespace)) {
            verseParts.push(nodeHtml);
            if (isStrong && nodeText) hasVerseContent = true;
            return;
          }

          collectingMeaning = true;
          meaningParts.push(nodeHtml);
        });

        const verseHtml = trimBreaks(verseParts.join(''));
        const meaningHtml = trimBreaks(meaningParts.join(''));
        if (!hasVerseContent || !meaningHtml) return;

        const verseBlock = document.createElement('div');
        verseBlock.className = 'ovi';
        verseBlock.innerHTML = verseHtml;

        const meaningBlock = document.createElement('div');
        meaningBlock.className = 'oviar';
        meaningBlock.innerHTML = meaningHtml;

        paragraph.replaceWith(verseBlock, meaningBlock);
      });
    });
  };
  const normalizeStandardReadingBlocks = () => {
    if (!document.body.classList.contains('is-standard-granth-reading-page')) return;

    const contentRoots = document.querySelectorAll('.abhang-post-main .post-content, .abhang-post-main .entry-content, .post-article .entry-content');
    const verseMarkerPattern = /[\u0964\u0965]/;
    const numberStartPattern = /^\s*([0-9\u0966-\u096F]+)\s*(?:[.)\u0964\u0965]|$)/;
    const meaningLabelPattern = /^\s*(\u0905\u0930\u094D\u0925|\u092D\u093E\u0935\u093E\u0930\u094D\u0925|meaning)\s*[:：\-–—]?\s*$/i;

    contentRoots.forEach((root) => {
      root.querySelectorAll('p, div').forEach((element) => {
        if (element.closest('.abhang-readable-meaning')) return;
        const text = normalizeText(element.innerText || element.textContent || '');
        if (!text) return;

        if (meaningLabelPattern.test(text)) {
          element.classList.add('devotional-meaning-label');
          return;
        }

        const rawHtml = element.innerHTML || '';
        const hasBreaks = /<br\s*\/?\s*>/i.test(rawHtml);
        const startsWithStrongNumber = /^\s*<strong\b[^>]*>\s*[0-9\u0966-\u096F]+\s*[.)]?\s*<\/strong>/i.test(rawHtml);
        const hasOrangeVerse = Boolean(element.querySelector('[style*="#ff6600"], [style*="rgb(255, 102, 0)"]'));
        const isCentered = /text-align\s*:\s*center/i.test(element.getAttribute('style') || '');
        const looksNumberedVerse = (numberStartPattern.test(text) || startsWithStrongNumber) && (hasBreaks || verseMarkerPattern.test(text));

        if ((hasOrangeVerse || looksNumberedVerse || (isCentered && verseMarkerPattern.test(text))) && !/^\s*\u0905\u0930\u094D\u0925\s*[:：\-–—]/i.test(text)) {
          element.classList.add('devotional-verse-block');
        }
      });
    });
  };

  splitLegacyDnyaneshwariParagraphs();
  normalizeStandardReadingBlocks();
  const normalizeLegacyNumberedDevotionalBlocks = () => {
    const contentRoots = document.querySelectorAll('.abhang-post .entry-content, .abhang-post .post-content, .post-article .entry-content, .post-article [itemprop="text"]');
    const numberPrefixPattern = /^\s*(?:<strong\b[^>]*>\s*)?([\u0966-\u096F0-9]+[.)]?)(?:\s*<\/strong>)?\s*(?:<br\s*\/?>(?:\s|&nbsp;)*)?/i;
    const hasVerseMarker = (value = '') => /[\u0964\u0965]/.test(value);

    contentRoots.forEach((root) => {
      const paragraphs = Array.from(root.querySelectorAll('p'));

      paragraphs.forEach((paragraph) => {
        if (paragraph.closest('.abhang-readable-meaning')) return;
        if (paragraph.closest('.devotional-numbered-verse')) return;
        if (paragraph.querySelector('iframe, img, video, audio, table')) return;

        const rawHtml = paragraph.innerHTML.trim();
        const rawText = normalizeText(paragraph.innerText || '');
        const startsWithNumber = /^[\u0966-\u096F0-9]+[.)]?\s*/.test(rawText);
        const hasLineBreak = /<br\s*\/?\s*>/i.test(rawHtml);

        if (!startsWithNumber || (!hasLineBreak && !hasVerseMarker(rawText))) return;

        const match = rawHtml.match(numberPrefixPattern);
        if (!match) return;

        const number = match[1].trim().replace(/[.)]+$/, '');
        const contentHtml = rawHtml.slice(match[0].length).trim();
        if (!contentHtml) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'devotional-numbered-verse';
        const cleanNumber = number.replace(/[.)]+$/g, '');
        wrapper.id = paragraph.id || `abhang-${cleanNumber}`;
        if (paragraph.dataset.abhangItem) wrapper.dataset.abhangItem = paragraph.dataset.abhangItem;
        wrapper.dataset.abhangNumber = paragraph.dataset.abhangNumber || cleanNumber;
        wrapper.innerHTML = `<span class="devotional-verse-number">${cleanNumber}.</span> <span class="devotional-verse-content">${contentHtml}</span>`;
        paragraph.replaceWith(wrapper);
      });
    });
  };

  const createIndividualAbhangActions = () => {
    const abhangEntries = document.querySelectorAll('.abhang-post .entry-content, .post-article .entry-content, .post-article [itemprop="text"]');

    abhangEntries.forEach((entryContent, postIndex) => {
      const paragraphs = Array.from(entryContent.querySelectorAll('p'));
      let itemIndex = 0;

      paragraphs.forEach((paragraph) => {
        const nextElement = paragraph.nextElementSibling;
        const paragraphText = normalizeText(paragraph.innerText || '');
        const firstLine = paragraphText.split('\n')[0] || '';
        const numberMatch = firstLine.match(/^[0-9?-?]+/);
        const isAbhangItem = nextElement?.tagName === 'HR' && Boolean(numberMatch) && paragraphText.includes('\n');

        if (!isAbhangItem) return;
        if (nextElement.previousElementSibling?.classList?.contains('abhang-item-actions')) return;

        itemIndex += 1;
        const itemId = `abhang-item-${postIndex + 1}-${itemIndex}`;
        const itemLabel = numberMatch[0];

        paragraph.id = paragraph.id || itemId;
        paragraph.dataset.abhangItem = 'true';
        paragraph.dataset.abhangNumber = itemLabel;

        nextElement.insertAdjacentHTML('beforebegin', getAbhangItemActionsMarkup(paragraph.id, itemLabel));
      });
    });
  };

  const markDevotionalMeaningBlocks = () => {
    const roots = document.querySelectorAll('.abhang-post-main .post-content, .abhang-post-main .entry-content, .post-article .post-content, .post-article .entry-content, .post-article [itemprop="text"], .verse_style');
    const meaningStartPattern = /^\s*(?:\u0905\u0930\u094D\u0925(?:\u0903)?|\u092D\u093E\u0935\u093E\u0930\u094D\u0925|meaning|translation)\s*[:\uFF1A\-\u2013\u2014]?/i;
    const meaningOnlyPattern = /^\s*(?:\u0905\u0930\u094D\u0925(?:\u0903)?|\u092D\u093E\u0935\u093E\u0930\u094D\u0925|meaning|translation)\s*[:\uFF1A\-\u2013\u2014]?\s*$/i;
    const verseMarkerPattern = /\u0965\s*[\u0966-\u096F0-9]+\s*\u0965/;

    roots.forEach((root) => {
      const children = Array.from(root.children || []);
      let inMeaning = false;

      children.forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        if (element.matches('script, style, iframe, video, audio, table')) return;

        const text = normalizeText(element.innerText || element.textContent || '');
        const isDivider = element.tagName === 'HR';
        const isHeadingBoundary = inMeaning && /^H[1-2]$/.test(element.tagName);
        const looksLikeNextVerse = inMeaning && verseMarkerPattern.test(text) && !meaningStartPattern.test(text);

        if (isDivider || isHeadingBoundary || looksLikeNextVerse) {
          inMeaning = false;
          return;
        }

        if (meaningStartPattern.test(text)) {
          element.classList.add('devotional-meaning-block');
          if (meaningOnlyPattern.test(text)) element.classList.add('devotional-meaning-label');
          inMeaning = true;
          return;
        }

        if (inMeaning && text) {
          element.classList.add('devotional-meaning-block');
        }
      });
    });
  };
  const wrapVerseEndMarkers = () => {
    const roots = document.querySelectorAll('.abhang-post-main .post-content, .abhang-post-main .entry-content, .post-article .post-content, .post-article .entry-content, .post-article [itemprop="text"], .verse_style');
    const markerPattern = /॥\s*[०-९0-9]+\s*॥/g;

    roots.forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('script, style, textarea, input, .verse-end')) return NodeFilter.FILTER_REJECT;
          if (!markerPattern.test(node.nodeValue || '')) return NodeFilter.FILTER_REJECT;
          markerPattern.lastIndex = 0;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        const value = node.nodeValue || '';
        let lastIndex = 0;
        value.replace(markerPattern, (match, offset) => {
          if (offset > lastIndex) fragment.appendChild(document.createTextNode(value.slice(lastIndex, offset)));
          const span = document.createElement('span');
          span.className = 'verse-end';
          span.textContent = match.replace(/\s+/g, '');
          fragment.appendChild(span);
          lastIndex = offset + match.length;
          return match;
        });
        if (lastIndex < value.length) fragment.appendChild(document.createTextNode(value.slice(lastIndex)));
        node.replaceWith(fragment);
      });
    });
  };
  createIndividualAbhangActions();
  normalizeLegacyNumberedDevotionalBlocks();
  markDevotionalMeaningBlocks();
  wrapVerseEndMarkers();

  const getPageShareUrl = () => window.location.href.split('#')[0];

  const getPostVerseText = (scope) => {
    const verseStrongNodes = Array.from(scope.querySelectorAll('.abhang-verse p strong'));
    const verseLines = verseStrongNodes
      .map((node) => normalizeText(node.innerText))
      .filter(Boolean);

    if (verseLines.length > 1) {
      return verseLines.slice(1).join('\n');
    }

    const verseContainer = scope.querySelector('.abhang-verse, .verse_style');
    return normalizeText(verseContainer?.innerText || scope.querySelector('.post-content')?.innerText || '');
  };

  const resolveShareScope = (element) => (
    element.closest('.abhang-item-actions') ||
    element.closest('.abhang-card') ||
    element.closest('.arrival-card') ||
    element.closest('.abhang-post') ||
    element.closest('.post-article')
  );

  const getAbhangShareData = (scope) => {
    const shareTargetId = scope?.dataset?.shareTarget;
    const shareTarget = shareTargetId ? document.getElementById(shareTargetId) : null;
    const abhangPost = scope?.closest('.abhang-post, .post-article');
    const itemLabel = normalizeText(scope?.dataset?.shareLabel || shareTarget?.dataset?.abhangNumber || '');
    const title = normalizeText(
      (shareTarget && abhangPost?.querySelector('.post-title')?.innerText
        ? `${abhangPost.querySelector('.post-title').innerText} - ${itemLabel}`
        : '') ||
      shareTarget?.querySelector('.abhang-card-title')?.innerText ||
      shareTarget?.querySelector('.arrival-title')?.innerText ||
      shareTarget?.querySelector('.post-title')?.innerText ||
      scope?.querySelector('.abhang-card-title')?.innerText ||
      scope?.querySelector('.arrival-title')?.innerText ||
      scope?.querySelector('.post-title')?.innerText ||
      '?????'
    );
    const body = normalizeText(
      shareTarget?.innerText ||
      scope?.querySelector('.abhang-content')?.innerText ||
      scope?.querySelector('.arrival-excerpt')?.innerText ||
      getPostVerseText(scope) ||
      ''
    );
    const author = normalizeText(
      abhangPost?.querySelector('.post-category-link')?.innerText ||
      shareTarget?.querySelector('.abhang-tag')?.innerText ||
      shareTarget?.querySelector('.arrival-author')?.innerText ||
      shareTarget?.querySelector('.post-category-link')?.innerText ||
      scope?.querySelector('.abhang-tag')?.innerText ||
      scope?.querySelector('.arrival-author')?.innerText ||
      scope?.querySelector('.post-category-link')?.innerText ||
      ''
    );
    const pageUrl = scope?.classList?.contains('abhang-item-actions') && shareTarget?.id
      ? `${getPageShareUrl()}#${shareTarget.id}`
      : (scope?.classList?.contains('abhang-post') || scope?.classList?.contains('post-article'))
      ? getPageShareUrl()
      : `${getPageShareUrl()}#abhangs`;
    const formattedText = [title, author, body, '?????', pageUrl]
      .filter(Boolean)
      .join('\n\n');

    return {
      title,
      body,
      author,
      pageUrl,
      formattedText
    };
  };

  // --- Copy Abhang Content ---
  const copyBtns = document.querySelectorAll('.copy-abhang-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const scope = resolveShareScope(btn);
      if (!scope) return;

      const shareData = getAbhangShareData(scope);
      if (!shareData.body) return;

      const copied = await copyTextToClipboard(shareData.formattedText);
      if (copied) {
        showToast('???? ????????? ???? ????.');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = 'fas fa-check';
          icon.style.color = '#25d366';
          setTimeout(() => {
            icon.className = 'far fa-copy';
            icon.style.color = '';
          }, 2000);
        }
      } else {
        showToast('???? ???? ??? ????. ????? ?????? ??????? ???.');
      }
    });
  });

  // --- Like Button Toggle ---
  const likeBtns = document.querySelectorAll('.like-abhang-btn');
  likeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fas');
        icon.classList.toggle('far');
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
          icon.style.color = '#e74c3c';
          showToast('????? ?????.');
        } else {
          icon.style.color = '';
        }
      }
    });
  });

  // --- Abhang Social Share Buttons ---
  const shareBtns = document.querySelectorAll('.social-share-btn');
  shareBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const scope = resolveShareScope(btn);
      if (!scope) return;

      const shareData = getAbhangShareData(scope);
      const platform = btn.dataset.platform;

      if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareData.formattedText)}`, '_blank', 'noopener');
        return;
      }

      if (platform === 'facebook') {
        const facebookQuote = [shareData.title, shareData.author, shareData.body]
          .filter(Boolean)
          .join('\n\n');
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.pageUrl)}&quote=${encodeURIComponent(facebookQuote)}`,
          '_blank',
          'noopener'
        );
        return;
      }

      if (platform === 'instagram') {
        const copied = await copyTextToClipboard(shareData.formattedText);
        if (copied) {
          showToast('??????????????? ????? ???? ????.');
        } else {
          showToast('??????????? ????? ???? ????? ????? ???.');
        }
        window.open('https://www.instagram.com/', '_blank', 'noopener');
      }
    });
  });


  // --- Scroll To Top Floating Button ---
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollTopBtn.style.display = 'flex';
        scrollTopBtn.style.opacity = '1';
      } else {
        scrollTopBtn.style.opacity = '0';
        setTimeout(() => {
          if (window.scrollY <= 300) {
            scrollTopBtn.style.display = 'none';
          }
        }, 300);
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- Interactive Local Search ---
  const searchInput = document.getElementById('heroSearchInput');
  const searchBtn = document.getElementById('heroSearchBtn');

  const performSearch = () => {
    const query = searchInput?.value.trim().toLowerCase();
    if (!query) {
      showToast('????? ??????????? ???? ????.');
      return;
    }

    // List of searchable elements
    const searchableCards = document.querySelectorAll('.abhang-card, .saint-card, .granth-card, .arrival-card');
    let matchedElement = null;

    searchableCards.forEach(card => {
      const text = card.innerText.toLowerCase();
      // Reset any previous highlighting
      card.style.borderColor = '';
      card.style.boxShadow = '';

      if (text.includes(query) && !matchedElement) {
        matchedElement = card;
      }
    });

    if (matchedElement) {
      matchedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      matchedElement.style.borderColor = 'var(--primary)';
      matchedElement.style.boxShadow = '0 0 15px rgba(255, 122, 0, 0.6)';
      showToast(`??????: ${query}`);
    } else {
      showToast('??????? ??????? ?????? ????.');
    }
  };

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  // --- Site-wide Search Override ---
  let siteSearchInput = document.getElementById('heroSearchInput');
  let siteSearchBtn = document.getElementById('heroSearchBtn');
  const searchTrigger = document.getElementById('searchTrigger');
  const searchResults = document.getElementById('searchResults');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchResultsTitle = document.getElementById('searchResultsTitle');
  const searchResultsClose = document.getElementById('searchResultsClose');
  const homepageSearchIndexUrl = 'Vakibh/data/search-index.json';
  let searchIndexPromise = null;
  let headerSearchInput = null;
  let headerSearchResultsTitle = null;
  let headerSearchResultsList = null;
  let headerSearchModal = null;


  if (siteSearchInput && siteSearchBtn) {
    const replacementInput = siteSearchInput.cloneNode(true);
    const replacementBtn = siteSearchBtn.cloneNode(true);
    siteSearchInput.parentNode.replaceChild(replacementInput, siteSearchInput);
    siteSearchBtn.parentNode.replaceChild(replacementBtn, siteSearchBtn);
    siteSearchInput = replacementInput;
    siteSearchBtn = replacementBtn;
  }

  const escapeHtml = (value = '') =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normalizeSearchText = (value = '') => value.toLowerCase().trim();

  const closeSearchResults = () => {
    if (searchResults) {
      searchResults.hidden = true;
    }
    if (searchResultsList) {
      searchResultsList.innerHTML = '';
    }
  };

  const fetchSearchIndex = async () => {
    if (!searchIndexPromise) {
      searchIndexPromise = fetch(homepageSearchIndexUrl).then(response => {
        if (!response.ok) {
          throw new Error(`Search index request failed with ${response.status}`);
        }
        return response.json();
      });
    }

    return searchIndexPromise;
  };

  const scoreEntry = (entry, normalizedQuery, terms) => {
    const title = normalizeSearchText(entry.title);
    const heading = normalizeSearchText(entry.heading);
    const description = normalizeSearchText(entry.description);
    const excerpt = normalizeSearchText(entry.excerpt);
    const saint = normalizeSearchText(entry.saint);
    const haystack = `${title} ${heading} ${description} ${excerpt} ${saint}`;

    if (!terms.every(term => haystack.includes(term))) {
      return -1;
    }

    let score = 0;
    if (title.includes(normalizedQuery)) score += 80;
    if (heading.includes(normalizedQuery)) score += 50;
    if (saint.includes(normalizedQuery)) score += 35;
    if (description.includes(normalizedQuery)) score += 20;
    if (excerpt.includes(normalizedQuery)) score += 10;

    terms.forEach(term => {
      if (title.includes(term)) score += 12;
      if (heading.includes(term)) score += 8;
      if (saint.includes(term)) score += 6;
      if (description.includes(term)) score += 4;
      if (excerpt.includes(term)) score += 2;
    });

    return score;
  };

  const renderSearchResults = (query, results) => {
    if (!searchResults || !searchResultsList || !searchResultsTitle) return;

    searchResults.hidden = false;
    searchResultsTitle.textContent = `"${query}" \u0938\u093e\u0920\u0940 ${results.length} \u0928\u093f\u0915\u093e\u0932`;

    if (!results.length) {
      searchResultsList.innerHTML = '<div class="search-empty-state">??????? ??? ??????? ?????? ????.</div>';
      return;
    }

    searchResultsList.innerHTML = results.map(result => `
      <a class="search-result-item" href="${escapeHtml(result.path)}">
        <div class="search-result-topline">
          <span class="search-result-type">${escapeHtml(result.type || '???????')}</span>
          <span class="search-result-saint">${escapeHtml(result.saint || '')}</span>
        </div>
        <div class="search-result-title">${escapeHtml(result.title || result.heading || 'Vakibh')}</div>
        <div class="search-result-description">${escapeHtml(result.description || result.excerpt || '')}</div>
      </a>
    `).join('');
  };

  const renderResultList = (query, results, titleNode, listNode) => {
    if (!titleNode || !listNode) return;

    titleNode.textContent = `"${query}" \u0938\u093e\u0920\u0940 ${results.length} \u0928\u093f\u0915\u093e\u0932`;

    if (!results.length) {
      listNode.innerHTML = '<div class="search-empty-state">??????? ??? ??????? ?????? ????.</div>';
      return;
    }

    listNode.innerHTML = results.map(result => `
      <a class="search-result-item" href="${escapeHtml(result.path)}">
        <div class="search-result-topline">
          <span class="search-result-type">${escapeHtml(result.type || '???????')}</span>
          <span class="search-result-saint">${escapeHtml(result.saint || '')}</span>
        </div>
        <div class="search-result-title">${escapeHtml(result.title || result.heading || 'Vakibh')}</div>
        <div class="search-result-description">${escapeHtml(result.description || result.excerpt || '')}</div>
      </a>
    `).join('');
  };

  const performSiteSearch = async () => {
    const query = siteSearchInput?.value.trim();
    if (!query) {
      closeSearchResults();
      showToast('????? ??????????? ???? ????.');
      return;
    }

    try {
      const index = await fetchSearchIndex();
      const normalizedQuery = normalizeSearchText(query);
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      const results = index
        .map(entry => ({ ...entry, score: scoreEntry(entry, normalizedQuery, terms) }))
        .filter(entry => entry.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 24);

      renderSearchResults(query, results);
      if (searchResults) {
        searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (error) {
      console.error('Search failed:', error);
      closeSearchResults();
      showToast('??? ???? ??? ????.');
    }
  };

  const buildHeaderSearchModal = () => {
    if (document.getElementById('headerSearchModal')) {
      headerSearchModal = document.getElementById('headerSearchModal');
      headerSearchInput = document.getElementById('headerSearchInput');
      headerSearchResultsTitle = document.getElementById('headerSearchResultsTitle');
      headerSearchResultsList = document.getElementById('headerSearchResultsList');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'header-search-modal';
    modal.id = 'headerSearchModal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="header-search-backdrop" data-close-search-modal="true"></div>
      <div class="header-search-dialog" role="dialog" aria-modal="true" aria-label="??????? ???">
        <div class="header-search-topbar">
          <input type="text" class="header-search-input" id="headerSearchInput" placeholder="\u0938\u0902\u092a\u0942\u0930\u094d\u0923 \u0938\u0902\u0924 \u0938\u093e\u0939\u093f\u0924\u094d\u092f \u0936\u094b\u0927\u093e..." aria-label="\u0938\u0902\u092a\u0942\u0930\u094d\u0923 \u0938\u0902\u0924 \u0938\u093e\u0939\u093f\u0924\u094d\u092f \u0936\u094b\u0927\u093e">
          <button class="header-search-submit" id="headerSearchSubmit" type="button">\u0936\u094b\u0927\u093e</button>
          <button class="header-search-close" id="headerSearchClose" type="button" aria-label="??? ??? ???">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="header-search-results">
          <div class="search-results-header">
            <span class="search-results-title" id="headerSearchResultsTitle">\u0936\u094b\u0927 \u092a\u0930\u093f\u0923\u093e\u092e</span>
          </div>
          <div class="search-results-list" id="headerSearchResultsList"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    headerSearchModal = modal;
    headerSearchInput = document.getElementById('headerSearchInput');
    headerSearchResultsTitle = document.getElementById('headerSearchResultsTitle');
    headerSearchResultsList = document.getElementById('headerSearchResultsList');

    document.getElementById('headerSearchClose')?.addEventListener('click', () => {
      headerSearchModal.hidden = true;
    });

    document.querySelector('[data-close-search-modal="true"]')?.addEventListener('click', () => {
      headerSearchModal.hidden = true;
    });

    document.getElementById('headerSearchSubmit')?.addEventListener('click', async () => {
      const query = headerSearchInput?.value.trim();
      if (!query) {
        showToast('????? ??????????? ???? ????.');
        return;
      }

      try {
        const index = await fetchSearchIndex();
        const normalizedQuery = normalizeSearchText(query);
        const terms = normalizedQuery.split(/\s+/).filter(Boolean);
        const results = index
          .map(entry => ({ ...entry, score: scoreEntry(entry, normalizedQuery, terms) }))
          .filter(entry => entry.score >= 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 24);

        renderResultList(query, results, headerSearchResultsTitle, headerSearchResultsList);
      } catch (error) {
        console.error('Header search failed:', error);
        showToast('??? ???? ??? ????.');
      }
    });

    headerSearchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('headerSearchSubmit')?.click();
      }
    });
  };

  if (siteSearchBtn && siteSearchInput) {
    siteSearchBtn.addEventListener('click', performSiteSearch);
    siteSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSiteSearch();
      }
    });
    siteSearchInput.addEventListener('input', () => {
      if (!siteSearchInput.value.trim()) {
        closeSearchResults();
      }
    });
  }

  if (searchResultsClose) {
    searchResultsClose.addEventListener('click', closeSearchResults);
  }

  if (searchTrigger) {
    searchTrigger.addEventListener('click', () => {
      buildHeaderSearchModal();
      if (headerSearchModal) {
        headerSearchModal.hidden = false;
      }
      if (headerSearchInput) {
        headerSearchInput.value = siteSearchInput?.value?.trim() || '';
        headerSearchInput.focus();
      }
    });
  }

  if (siteSearchInput) {
    const initialQuery = new URLSearchParams(window.location.search).get('search');
    if (initialQuery) {
      siteSearchInput.value = initialQuery;
      performSiteSearch();
    }
  }
  // --- Homepage Hero Video ---
  const heroVideo = document.querySelector('.hero-bg-video');
  const heroSoundToggle = document.getElementById('heroSoundToggle');

  const updateHeroSoundToggle = () => {
    if (!heroVideo || !heroSoundToggle) return;
    const isMuted = heroVideo.muted || heroVideo.volume === 0;
    const icon = heroSoundToggle.querySelector('i');
    const label = heroSoundToggle.querySelector('span');
    heroSoundToggle.setAttribute('aria-label', isMuted ? '\u0927\u094D\u0935\u0928\u0940 \u091A\u093E\u0932\u0942 \u0915\u0930\u093E' : '\u0927\u094D\u0935\u0928\u0940 \u092C\u0902\u0926 \u0915\u0930\u093E');
    if (icon) icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-high';
    if (label) label.textContent = isMuted ? '\u0927\u094D\u0935\u0928\u0940 \u091A\u093E\u0932\u0942 \u0915\u0930\u093E' : '\u0927\u094D\u0935\u0928\u0940 \u092C\u0902\u0926 \u0915\u0930\u093E';
  };

  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.volume = 0;
    heroVideo.play().catch(() => {
      heroVideo.setAttribute('controls', 'controls');
    });
    updateHeroSoundToggle();
  }

  heroSoundToggle?.addEventListener('click', async () => {
    if (!heroVideo) return;
    const shouldUnmute = heroVideo.muted || heroVideo.volume === 0;
    heroVideo.muted = !shouldUnmute;
    heroVideo.volume = shouldUnmute ? 1 : 0;

    try {
      await heroVideo.play();
      heroVideo.removeAttribute('controls');
    } catch (error) {
      heroVideo.setAttribute('controls', 'controls');
    }

    updateHeroSoundToggle();
  });

  document.querySelectorAll('.abhang-card-play-btn').forEach((button) => {
    button.remove();
  });



  document.querySelectorAll('.abhang-share-group').forEach((group) => {
    if (group.querySelector('.copy-link-share-btn')) return;
    group.insertAdjacentHTML('beforeend', `
      <button class="abhang-btn social-share-btn copy-link-share-btn" data-platform="copylink" aria-label="लिंक कॉपी करा">
        <i class="fas fa-link"></i>
      </button>
    `);
  });

  document.addEventListener('click', async (event) => {
    const copyLinkButton = event.target.closest('.copy-link-share-btn');
    if (!copyLinkButton) return;
    const scope = resolveShareScope(copyLinkButton);
    const shareData = scope ? getAbhangShareData(scope) : { pageUrl: window.location.href.split('#')[0] };
    const copied = await copyTextToClipboard(shareData.pageUrl);
    showToast(copied ? 'लिंक कॉपी झाली.' : 'लिंक कॉपी करता आली नाही.');
  });
  // --- Abhang & Gatha Digital Library Search ---
  const librarySearchIndexUrl = `${siteBasePath}Vakibh/data/search-index.json`;
  const librarySearchPageUrl = `${siteBasePath}search/index.html`;
  let librarySearchIndexPromise = null;
  let librarySearchDebounce = null;

  const libraryNormalize = (value = '') => value
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[।॥.,:;!?()\[\]{}"'`~|/\\_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const libraryResolveUrl = (entryPath = '') => {
    if (/^(?:https?:|mailto:|tel:|#)/i.test(entryPath)) return entryPath;
    return `${siteBasePath}${entryPath}`;
  };

  const libraryFetchIndex = async () => {
    if (!librarySearchIndexPromise) {
      librarySearchIndexPromise = fetch(librarySearchIndexUrl).then((response) => {
        if (!response.ok) throw new Error(`Search index failed: ${response.status}`);
        return response.json();
      });
    }
    return librarySearchIndexPromise;
  };

  const libraryScoreEntry = (entry, query) => {
    const normalizedQuery = libraryNormalize(query);
    const terms = normalizedQuery.split(' ').filter(Boolean);
    if (!terms.length) return -1;

    const title = libraryNormalize(entry.title || entry.heading || '');
    const heading = libraryNormalize(entry.heading || '');
    const saint = libraryNormalize(entry.saint || entry.saintSlug || '');
    const type = libraryNormalize(entry.type || '');
    const excerpt = libraryNormalize(entry.excerpt || entry.description || '');
    const aliases = libraryNormalize(entry.aliases || '');
    const searchText = libraryNormalize(entry.searchText || `${title} ${heading} ${saint} ${type} ${excerpt} ${aliases}`);

    if (!terms.every((term) => searchText.includes(term))) return -1;

    let score = 0;
    if (title.includes(normalizedQuery)) score += 120;
    if (heading.includes(normalizedQuery)) score += 90;
    if (saint.includes(normalizedQuery)) score += 70;
    if (type.includes(normalizedQuery)) score += 25;
    if (aliases.includes(normalizedQuery)) score += 55;
    if (excerpt.includes(normalizedQuery)) score += 15;

    terms.forEach((term) => {
      if (title.includes(term)) score += 18;
      if (heading.includes(term)) score += 14;
      if (saint.includes(term)) score += 12;
      if (aliases.includes(term)) score += 10;
      if (excerpt.includes(term)) score += 4;
    });

    return score;
  };

  const librarySearch = async (query, limit = 12) => {
    const index = await libraryFetchIndex();
    return index
      .map((entry) => ({ ...entry, score: libraryScoreEntry(entry, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };

  const libraryHighlight = (value = '', query = '') => {
    const escaped = escapeHtml(value || '');
    const terms = libraryNormalize(query).split(' ').filter((term) => term.length > 1).slice(0, 5);
    if (!terms.length) return escaped;
    return terms.reduce((html, term) => {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return html.replace(new RegExp(`(${safeTerm})`, 'gi'), '<mark>$1</mark>');
    }, escaped);
  };

  const libraryResultMarkup = (result, query, compact = false) => `
    <a class="search-result-item library-search-result" href="${escapeHtml(libraryResolveUrl(result.path || '#'))}">
      <div class="search-result-main">
        <div class="search-result-topline">
          <span class="search-result-type">${escapeHtml(result.type || 'साहित्य')}</span>
          <span class="search-result-saint">${escapeHtml(result.saint || '')}</span>
        </div>
        <div class="search-result-title">${libraryHighlight(result.title || result.heading || 'वाकीभ', query)}</div>
        <div class="search-result-description">${libraryHighlight(result.excerpt || result.description || '', query)}</div>
      </div>
      ${compact ? '' : '<span class="search-result-view-btn">पहा</span>'}
    </a>
  `;

  const libraryRenderResults = (query, results, titleNode, listNode, compact = false) => {
    if (!titleNode || !listNode) return;
    titleNode.textContent = query ? `"${query}" साठी ${results.length} निकाल` : 'शोध परिणाम';
    listNode.innerHTML = results.length
      ? results.map((result) => libraryResultMarkup(result, query, compact)).join('')
      : '<div class="search-empty-state">या शोधासाठी परिणाम सापडले नाहीत.</div>';
  };

  const libraryGoToSearchPage = (query) => {
    const value = (query || '').trim();
    if (!value) {
      showToast('कृपया शोध शब्द लिहा.');
      return;
    }
    window.location.href = `${librarySearchPageUrl}?q=${encodeURIComponent(value)}`;
  };

  const libraryWireInput = (input, listNode, titleNode, options = {}) => {
    if (!input || input.dataset.librarySearchReady === 'true') return;
    input.dataset.librarySearchReady = 'true';
    input.setAttribute('placeholder', 'अभंग, गाथा किंवा संतांचे नाव शोधा...');

    const runSuggestions = async () => {
      const query = input.value.trim();
      if (!query) {
        if (listNode) listNode.innerHTML = '';
        if (titleNode) titleNode.textContent = options.title || 'शोध सूचना';
        return;
      }
      try {
        const results = await librarySearch(query, options.limit || 8);
        libraryRenderResults(query, results, titleNode, listNode, true);
      } catch (error) {
        console.error('Library search failed:', error);
      }
    };

    input.addEventListener('input', () => {
      clearTimeout(librarySearchDebounce);
      librarySearchDebounce = setTimeout(runSuggestions, 120);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        libraryGoToSearchPage(input.value);
      }
    });
  };

  const libraryCreateSearchBar = (target, mode = 'inline') => {
    if (!target || target.previousElementSibling?.classList?.contains('library-search-section')) return;
    const section = document.createElement('section');
    section.className = `library-search-section library-search-${mode}`;
    section.innerHTML = `
      <div class="library-search-inner">
        <div class="library-search-box">
          <i class="fas fa-search" aria-hidden="true"></i>
          <input class="library-search-input" type="search" placeholder="अभंग, गाथा किंवा संतांचे नाव शोधा..." aria-label="अभंग, गाथा किंवा संतांचे नाव शोधा">
          <button class="library-search-submit" type="button">शोधा</button>
        </div>
        <div class="library-search-suggestions" hidden>
          <div class="search-results-header">
            <span class="search-results-title">शोध सूचना</span>
          </div>
          <div class="search-results-list"></div>
        </div>
      </div>
    `;
    target.insertAdjacentElement('beforebegin', section);
    const input = section.querySelector('.library-search-input');
    const dropdown = section.querySelector('.library-search-suggestions');
    const titleNode = section.querySelector('.search-results-title');
    const listNode = section.querySelector('.search-results-list');
    libraryWireInput(input, listNode, titleNode, { limit: 7, title: 'शोध सूचना' });
    input.addEventListener('input', () => { dropdown.hidden = !input.value.trim(); });
    input.addEventListener('focus', () => { dropdown.hidden = !input.value.trim(); });
    document.addEventListener('click', (event) => {
      if (!section.contains(event.target)) dropdown.hidden = true;
    });
    section.querySelector('.library-search-submit')?.addEventListener('click', () => libraryGoToSearchPage(input.value));
  };

  const libraryInitSearchBars = () => {
    document.querySelectorAll('#abhangs, .abhang-grid-section, .tukaram-landing-container, .dnyaneshwar-landing-container').forEach((target) => {
      if (target.closest('.sant-page-main')?.querySelector('#abhangSearch')) return;
      libraryCreateSearchBar(target, target.id === 'abhangs' ? 'featured' : 'listing');
    });
  };

  const libraryInitSearchPage = async () => {
    const pageRoot = document.querySelector('[data-library-search-page="true"]');
    if (!pageRoot) return;
    const input = document.getElementById('librarySearchPageInput');
    const button = document.getElementById('librarySearchPageButton');
    const titleNode = document.getElementById('librarySearchPageTitle');
    const listNode = document.getElementById('librarySearchPageResults');
    libraryWireInput(input, listNode, titleNode, { limit: 30, title: 'शोध परिणाम' });
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('search') || '';
    if (query) {
      input.value = query;
      const results = await librarySearch(query, 60);
      libraryRenderResults(query, results, titleNode, listNode, false);
    }
    button?.addEventListener('click', async () => {
      const queryValue = input.value.trim();
      if (!queryValue) return;
      history.replaceState(null, '', `?q=${encodeURIComponent(queryValue)}`);
      const results = await librarySearch(queryValue, 60);
      libraryRenderResults(queryValue, results, titleNode, listNode, false);
    });
  };

  document.addEventListener('click', (event) => {
    const submit = event.target.closest('#headerSearchSubmit');
    if (!submit) return;
    const modalInput = document.getElementById('headerSearchInput');
    if (!modalInput) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    libraryGoToSearchPage(modalInput.value);
  }, true);

  searchTrigger?.addEventListener('click', () => {
    setTimeout(() => {
      const modalInput = document.getElementById('headerSearchInput');
      const titleNode = document.getElementById('headerSearchResultsTitle');
      const listNode = document.getElementById('headerSearchResultsList');
      libraryWireInput(modalInput, listNode, titleNode, { limit: 8, title: 'शोध सूचना' });
    }, 0);
  });


  const initVisitorOtpLogin = () => {
    if (document.body.dataset.visitorLoginReady === 'true') return;
    document.body.dataset.visitorLoginReady = 'true';

    const apiBase = window.location.origin === 'null' ? '' : '';
    const state = { name: '', phone: '', resendTimer: 0, resendInterval: null };

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'visitor-login-floating-btn';
    trigger.setAttribute('aria-label', 'Login with OTP');
    trigger.innerHTML = '<i class="fas fa-user-check" aria-hidden="true"></i><span>Login</span>';

    const modal = document.createElement('div');
    modal.className = 'visitor-login-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="visitor-login-backdrop" data-visitor-login-close></div>
      <section class="visitor-login-dialog" role="dialog" aria-modal="true" aria-labelledby="visitorLoginTitle">
        <button class="visitor-login-close" type="button" data-visitor-login-close aria-label="Close login popup">&times;</button>
        <span class="visitor-login-eyebrow">वाकीभ</span>
        <h2 id="visitorLoginTitle">OTP Login</h2>
        <p class="visitor-login-subtitle">Enter your name and phone number to receive OTP.</p>
        <div class="visitor-login-alert" data-visitor-login-message hidden></div>
        <form class="visitor-login-form" data-visitor-step="details">
          <label>
            <span>Name</span>
            <input type="text" name="name" autocomplete="name" maxlength="120" required>
          </label>
          <label>
            <span>Phone number</span>
            <input type="tel" name="phone" autocomplete="tel" inputmode="numeric" placeholder="10 digit mobile number" required>
          </label>
          <button class="visitor-login-primary" type="submit">Send OTP</button>
        </form>
        <form class="visitor-login-form" data-visitor-step="otp" hidden>
          <label>
            <span>OTP</span>
            <input type="text" name="otp" inputmode="numeric" maxlength="6" placeholder="Enter 6 digit OTP" required>
          </label>
          <button class="visitor-login-primary" type="submit">Verify OTP</button>
          <button class="visitor-login-resend" type="button" data-visitor-resend disabled>Resend OTP in 30s</button>
        </form>
        <div class="visitor-login-success" data-visitor-step="success" hidden>
          <i class="fas fa-check-circle" aria-hidden="true"></i>
          <strong>Login successful</strong>
        </div>
      </section>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(modal);

    const detailsForm = modal.querySelector('[data-visitor-step="details"]');
    const otpForm = modal.querySelector('[data-visitor-step="otp"]');
    const successPanel = modal.querySelector('[data-visitor-step="success"]');
    const message = modal.querySelector('[data-visitor-login-message]');
    const resendButton = modal.querySelector('[data-visitor-resend]');

    const showMessage = (text, type = 'error') => {
      if (!message) return;
      message.textContent = text;
      message.className = `visitor-login-alert ${type}`;
      message.hidden = !text;
    };

    const setOpen = (open) => {
      modal.hidden = !open;
      document.body.classList.toggle('visitor-login-open', open);
      if (open) setTimeout(() => modal.querySelector('input:not([hidden])')?.focus(), 80);
    };

    const setStep = (step) => {
      detailsForm.hidden = step !== 'details';
      otpForm.hidden = step !== 'otp';
      successPanel.hidden = step !== 'success';
    };

    const normalizePhone = (value) => String(value || '').trim();
    const isValidOtpPhone = (value) => {
      const digits = String(value || '').replace(/\\D+/g, '');
      return /^[6-9]\\d{9}$/.test(digits) || /^91[6-9]\\d{9}$/.test(digits) || /^9\\d{10}$/.test(digits);
    };

    const postJson = async (url, payload) => {
      let response;
      try {
        response = await fetch(apiBase + url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });
      } catch (error) {
        throw new Error('Unable to reach OTP service. Please check server connection.');
      }
      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || raw || `OTP request failed (${response.status}).`);
      }
      return data;
    };
    const startResendTimer = (seconds = 30) => {
      clearInterval(state.resendInterval);
      state.resendTimer = seconds;
      resendButton.disabled = true;
      const tick = () => {
        resendButton.textContent = state.resendTimer > 0 ? `Resend OTP in ${state.resendTimer}s` : 'Resend OTP';
        resendButton.disabled = state.resendTimer > 0;
        state.resendTimer -= 1;
        if (state.resendTimer < 0) clearInterval(state.resendInterval);
      };
      tick();
      state.resendInterval = setInterval(tick, 1000);
    };

    detailsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      showMessage('');
      const formData = new FormData(detailsForm);
      state.name = String(formData.get('name') || '').trim();
      state.phone = normalizePhone(formData.get('phone'));
      if (!state.name || !/^[6-9]\d{9}$/.test(state.phone)) {
        showMessage('Please enter a valid name and Indian mobile number.');
        return;
      }
      const button = detailsForm.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Sending...';
      try {
        const result = await postJson('/api/visitor-login/send-otp', { name: state.name, phone: state.phone });
        showMessage(result.message || 'OTP sent successfully.', 'success');
        setStep('otp');
        startResendTimer(result.resendAfter || 30);
      } catch (error) {
        showMessage(error.message || 'Unable to send OTP.');
      } finally {
        button.disabled = false;
        button.textContent = 'Send OTP';
      }
    });

    otpForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      showMessage('');
      const otp = String(new FormData(otpForm).get('otp') || '').replace(/\D+/g, '');
      const button = otpForm.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Verifying...';
      try {
        const result = await postJson('/api/visitor-login/verify-otp', { name: state.name, phone: state.phone, otp });
        showMessage(result.message || 'Login successful', 'success');
        setStep('success');
        trigger.classList.add('is-logged-in');
        trigger.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>Logged in</span>';
        setTimeout(() => setOpen(false), 1400);
      } catch (error) {
        showMessage(error.message || 'Unable to verify OTP.');
      } finally {
        button.disabled = false;
        button.textContent = 'Verify OTP';
      }
    });

    resendButton.addEventListener('click', async () => {
      if (resendButton.disabled) return;
      showMessage('');
      resendButton.disabled = true;
      try {
        const result = await postJson('/api/visitor-login/send-otp', { name: state.name, phone: state.phone });
        showMessage(result.message || 'OTP sent successfully.', 'success');
        startResendTimer(result.resendAfter || 30);
      } catch (error) {
        showMessage(error.message || 'Unable to resend OTP.');
        resendButton.disabled = false;
      }
    });

    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-visitor-login-close]')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) setOpen(false);
    });
    trigger.addEventListener('click', () => {
      showMessage('');
      setStep(trigger.classList.contains('is-logged-in') ? 'success' : 'details');
      setOpen(true);
    });

    fetch('/api/visitor-login/status', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.loggedIn) {
          trigger.classList.add('is-logged-in');
          trigger.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>Logged in</span>';
        }
      })
      .catch(() => {});
  };
  const wrapDevotionalVerseEndings = () => {
    const verseSelector = [
      '.verse-text',
      '.haripath-verse',
      '.abhang-verse',
      '.abhang-readable-verses p',
      '.devotional-numbered-verse',
      '.devotional-verse-content',
      '.gatha-verse',
      '.ovi-verse',
      '.ovi'
    ].join(', ');
    const verseEndPattern = /॥\s*[०-९0-9]+(?:[-–][०-९0-9]+)?\s*॥/g;

    document.querySelectorAll(verseSelector).forEach((root) => {
      if (root.dataset.verseEndsWrapped === 'true') return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !verseEndPattern.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
          verseEndPattern.lastIndex = 0;
          if (node.parentElement?.closest('.verse-end')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        node.nodeValue.replace(verseEndPattern, (match, index) => {
          if (index > lastIndex) fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex, index)));
          const span = document.createElement('span');
          span.className = 'verse-end';
          span.textContent = match;
          fragment.appendChild(span);
          lastIndex = index + match.length;
          return match;
        });
        if (lastIndex < node.nodeValue.length) fragment.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex)));
        node.parentNode.replaceChild(fragment, node);
      });

      root.dataset.verseEndsWrapped = 'true';
    });
  };
  const hashTarget = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
  if (hashTarget) {
    setTimeout(() => hashTarget.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }

  initVisitorOtpLogin();
  wrapDevotionalVerseEndings();
  libraryInitSearchBars();
  libraryInitSearchPage();});












