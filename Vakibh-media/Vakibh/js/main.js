document.addEventListener('DOMContentLoaded', () => {
  const toMarathiDigits = (value) => String(value ?? '').replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
  window.VakibhText = Object.freeze({ toMarathiDigits });

  const socialLinks = Object.freeze({
    instagramUrl: 'https://www.instagram.com/_vaakibh?igsh=MWJyYndzc3Rzc2k3MQ%3D%3D&utm_source=qr',
    whatsappUrl: 'https://wa.me/919923916476',
    youtubeUrl: 'https://www.youtube.com/',
    facebookUrl: 'https://www.facebook.com/vaakibh'
  });

  if (!document.querySelector('script[data-blog-feedback-client]')) {
    const feedbackClient = document.createElement('script');
    feedbackClient.src = '/Vakibh/js/blog-feedback.js?v=4';
    feedbackClient.dataset.blogFeedbackClient = 'true';
    document.head.appendChild(feedbackClient);
  }
  const cleanIndexUrl = () => {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    if (!/\/index\.html$/i.test(pathname)) return;

    const cleanPath = pathname.replace(/index\.html$/i, '');
    window.history.replaceState(
      window.history.state,
      document.title,
      `${cleanPath}${window.location.search}${window.location.hash}`
    );
  };
  cleanIndexUrl();

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

  const normalizeMarathiNumberSpacing = () => {
    const marathiLetter = '[\\u0900-\\u0939\\u0958-\\u0961]';
    const letterBeforeNumber = new RegExp(`(${marathiLetter})(?=[०-९0-9])`, 'g');
    const numberBeforeLetter = new RegExp(`([०-९0-9])(?=${marathiLetter})`, 'g');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];

    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      if (node.parentElement?.closest('script, style, textarea, input, select, .fa, .fas, .far, .fab')) return;
      node.nodeValue = node.nodeValue
        .replace(letterBeforeNumber, '$1 ')
        .replace(numberBeforeLetter, '$1 ');
    });
  };
  normalizeMarathiNumberSpacing();

  const removeAbhangCollectionBreadcrumbs = () => {
    document.querySelectorAll('.sant-breadcrumb a').forEach((link) => {
      const label = (link.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/अभंग/.test(label)) return;

      const separator = link.nextElementSibling;
      link.remove();
      if (separator?.classList.contains('bc-sep')) separator.remove();
    });
  };
  removeAbhangCollectionBreadcrumbs();
  const currentPath = window.location.pathname.replace(/\\/g, '/').toLowerCase();
  if (currentPath.includes('/sants/')) {
    document.body.classList.add('is-sant-site-page');
  }
  if (currentPath.includes('/sants/')) {
    document.body.classList.add('is-sant-site-page');
  }
  if (/\/sants\/[^/]+\/?(?:index\.html)?$/.test(currentPath)) {
    document.body.classList.add('is-sant-category-page');
  }

  const orderSantCategories = () => {
    if (!/\/sants\/[^/]+\/?(?:index\.html)?$/.test(currentPath)) return;

    const categoryLinks = Array.from(document.querySelectorAll([
      '.dnyaneshwar-link',
      '.tukaram-link',
      '.sahitya-link',
      '.remaining-sant-link',
      '.rohidas-link'
    ].join(',')));
    if (!categoryLinks.length) return;

    const groups = new Map();
    categoryLinks.forEach((link) => {
      const parent = link.parentElement;
      if (!parent) return;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(link);
    });

    groups.forEach((links, parent) => {
      const getCategoryIdentity = (link) => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        const label = (link.textContent || '').replace(/\s+/g, ' ').trim();
        const isAarti = /(?:^|[\/_-])(?:aarti|arati|arti)(?:[\/_-]|$)/i.test(href) || /आरती/.test(label);
        const isTirthakshetra = /(?:tirth|kshetra|mandir|samadhi|temple)/i.test(href)
          || /(?:तीर्थक्षेत्र|मंदिर|समाधी)/.test(label);
        return isTirthakshetra ? 'tirthakshetra' : (isAarti ? 'aarti' : 'normal');
      };

      const aartiLinks = links.filter((link) => getCategoryIdentity(link) === 'aarti');
      const tirthakshetraLinks = links.filter((link) => getCategoryIdentity(link) === 'tirthakshetra');
      parent.append(...aartiLinks, ...tirthakshetraLinks);
    });
  };

  orderSantCategories();
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

  const removeRepeatedNatacheAbhangNumbers = () => {
    if (!currentPath.includes('/sants/tukaram/natache-abhang/')) return;

    document.querySelectorAll('.abhang-content-block .natache-verse').forEach((verse) => {
      const firstLine = verse.querySelector('.natache-stanza:first-child .natache-line');
      if (!firstLine) return;

      const originalText = firstLine.textContent || '';
      const cleanedText = originalText.replace(/^\s*[०-९0-9]+\s*[.)]\s*/u, '');
      if (cleanedText !== originalText) firstLine.textContent = cleanedText;
    });
  };

  removeRepeatedNatacheAbhangNumbers();

  const initMarathiLiteratureDigits = () => {
    if (/^\/admin(?:\/|$)/i.test(currentPath) || currentPath.includes('/blog/')) return;

    const isLiteraturePage = /\/(?:sants|granth|abhangs?|puravni-abhang|aarti)(?:\/|$)/i.test(currentPath);
    const excludedParentSelector = [
      'script', 'style', 'noscript', 'template', 'code', 'pre',
      'textarea', 'input', 'select', 'option',
      '[contenteditable="true"]', '[data-keep-english-digits]', '.marathi-digit-glyph'
    ].join(',');

    const wrapMarathiDigitGlyphs = (root) => {
      if (!root) return;
      const textNodes = [];
      if (root.nodeType === Node.TEXT_NODE) textNodes.push(root);
      if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) textNodes.push(walker.currentNode);
      }

      textNodes.forEach((node) => {
        const parent = node.parentElement;
        const value = node.nodeValue || '';
        if (!parent || parent.closest(excludedParentSelector) || !/[०-९]/.test(value)) return;

        const fragment = document.createDocumentFragment();
        value.split(/([०-९]+)/).filter(Boolean).forEach((part) => {
          if (!/^[०-९]+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }
          const span = document.createElement('span');
          span.className = 'marathi-digit-glyph';
          span.textContent = part;
          span.style.setProperty('font-family', "'Vakibh Devanagari Digits', serif", 'important');
          span.style.setProperty('font-size', '1em', 'important');
          span.style.setProperty('line-height', 'inherit', 'important');
          span.style.setProperty('font-weight', parent.closest('.abhang-range-label') ? '700' : 'inherit', 'important');
          span.style.setProperty('font-style', 'inherit', 'important');
          span.style.setProperty('vertical-align', 'baseline', 'important');
          if (
            parent.matches('.sahitya-link, .tukaram-link, .dnyaneshwar-link, .remaining-sant-link, .rohidas-link') &&
            !parent.closest('.abhang-range-label')
          ) {
            span.style.setProperty('margin-left', '0.32em', 'important');
          }
          fragment.appendChild(span);
        });
        node.replaceWith(fragment);
      });
    };

    const formatVisibleText = (root, normalizeVerseBars = isLiteraturePage) => {
      if (!root) return;
      const textNodes = [];
      if (root.nodeType === Node.TEXT_NODE) textNodes.push(root);
      if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) textNodes.push(walker.currentNode);
      }

      textNodes.forEach((node) => {
        const parent = node.parentElement;
        if (!parent || parent.closest(excludedParentSelector)) return;
        let displayText = node.nodeValue || '';
        const isSearchResultText = Boolean(parent.closest(
          '.search-results-panel, .header-search-results, .library-search-suggestions, [data-library-search-page="true"]'
        ));
        if (normalizeVerseBars) {
          displayText = displayText.replace(/\|\|\s*([0-9०-९]+)\s*\|\|/g, '॥$1॥');
        }
        if (isSearchResultText) {
          displayText = displayText
            .replace(/\bAbhang(?=\s*[0-9०-९])/gi, 'अभंग')
            .replace(/\bGatha(?=\s*[0-9०-९])/gi, 'गाथा')
            .replace(/\bOvi(?=\s*[0-9०-९])/gi, 'ओवी');
        }
        displayText = toMarathiDigits(displayText);
        if (displayText !== node.nodeValue) node.nodeValue = displayText;
      });
    };

    const formatCurrentPage = () => {
      const roots = document.querySelectorAll('main, footer');
      roots.forEach((root) => {
        formatVisibleText(root);
        wrapMarathiDigitGlyphs(root);
      });
      document.querySelectorAll('.search-results-panel, .header-search-results, .library-search-suggestions')
        .forEach((root) => formatVisibleText(root, false));
    };

    formatCurrentPage();
    window.addEventListener('load', formatCurrentPage, { once: true });
    [0, 100, 500, 1500, 4000].forEach((delay) => window.setTimeout(formatCurrentPage, delay));
    if (isLiteraturePage) {
      const startedAt = Date.now();
      const postRenderGuard = window.setInterval(() => {
        formatCurrentPage();
        if (Date.now() - startedAt >= 30000) window.clearInterval(postRenderGuard);
      }, 400);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          const node = mutation.target;
          const element = node.parentElement;
          const insidePublicContent = element?.closest('main, footer');
          const insideSearch = element?.closest('.search-results-panel, .header-search-results, .library-search-suggestions');
          if (insidePublicContent || insideSearch) {
            formatVisibleText(node, isLiteraturePage && Boolean(insidePublicContent));
            wrapMarathiDigitGlyphs(node);
          }
          return;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) return;
          const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
          const insidePublicContent = element?.closest('main, footer');
          const insideSearch = element?.closest('.search-results-panel, .header-search-results, .library-search-suggestions');
          if (insidePublicContent || insideSearch) {
            formatVisibleText(node, isLiteraturePage && Boolean(insidePublicContent));
            wrapMarathiDigitGlyphs(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  };
  initMarathiLiteratureDigits();

  if (!document.querySelector('link[data-font-awesome]')) {
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    fontAwesomeLink.dataset.fontAwesome = 'true';
    document.head.appendChild(fontAwesomeLink);
  }

  const initFloatingSocialBar = () => {
    if (/^\/admin(?:\/|$)/i.test(window.location.pathname) || document.querySelector('.floating-social-bar')) return;

    const currentWhatsApp = document.querySelector('a.floating-whatsapp');
    const whatsappUrl = currentWhatsApp?.getAttribute('href') || socialLinks.whatsappUrl;
    const items = [
      { name: 'Instagram', url: socialLinks.instagramUrl, icon: 'fa-instagram', network: 'instagram' },
      { name: 'WhatsApp', url: whatsappUrl, icon: 'fa-whatsapp', network: 'whatsapp' },
      { name: 'YouTube', url: socialLinks.youtubeUrl, icon: 'fa-youtube', network: 'youtube' },
      { name: 'Facebook', url: socialLinks.facebookUrl, icon: 'fa-facebook-f', network: 'facebook' }
    ];
    const bar = document.createElement('nav');
    bar.className = 'floating-social-bar';
    bar.setAttribute('aria-label', 'वाकीभ सोशल मीडिया');

    items.forEach(({ name, url, icon, network }) => {
      const link = document.createElement('a');
      link.className = `floating-social-link floating-social-${network}`;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', name);
      link.innerHTML = `<span class="floating-social-tooltip" aria-hidden="true">${name}</span><i class="fab ${icon}" aria-hidden="true"></i>`;
      bar.appendChild(link);
    });

    currentWhatsApp?.remove();
    document.body.appendChild(bar);
  };
  initFloatingSocialBar();

  // --- Standardize Header Across All Pages ---
  const getRelativeSitePrefix = () => {
    const logo = document.querySelector('.logo-img');
    const logoSrc = logo?.getAttribute('src') || '';
    const logoMatch = logoSrc.match(/^(.*?)(?:Vakibh\/)?vaakibh_logo\.svg(?:\?.*)?$/i);
    if (logoMatch) return logoMatch[1] || '';

    const stylesheet = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((link) => link.getAttribute('href') || '')
      .find((href) => /Vakibh\/css\/(?:style|sant)\.css/i.test(href));
    const styleMatch = stylesheet?.match(/^(.*?)Vakibh\/css\/(?:style|sant)\.css/i);
    if (styleMatch) return styleMatch[1] || '';

    const segments = window.location.pathname.split('/').filter(Boolean);
    const mediaIndex = Math.max(segments.lastIndexOf('Vakibh-media'), segments.lastIndexOf('vakibh-media'));
    const depth = mediaIndex >= 0 ? Math.max(0, segments.length - mediaIndex - 2) : Math.max(0, segments.length - 1);
    return depth ? '../'.repeat(depth) : '';
  };

  const sitePrefix = getRelativeSitePrefix();
  const standardHomePath = '/';
  const standardLogoSrc = '/Vakibh/vaakibh_logo.svg';
  const standardContactPath = '/contact/';

  const standardizeHeader = () => {
    let header = document.querySelector('body > header');
    if (!header) {
      header = document.createElement('header');
      document.body.prepend(header);
    }

    header.innerHTML = `
      <div class="header-container">
        <a href="${standardHomePath}" class="logo-link">
          <img src="${standardLogoSrc}" alt="\u0935\u093e\u0915\u0940\u092d \u0932\u094b\u0917\u094b" class="logo-img">
        </a>
        <button class="menu-toggle" id="menuToggle" aria-label="\u092e\u0941\u0916\u094d\u092f \u092e\u0947\u0928\u0942 \u0909\u0918\u0921\u093e" type="button">
          <i class="fas fa-bars"></i>
        </button>
        <nav id="navMenu" aria-label="\u092e\u0941\u0916\u094d\u092f \u092e\u0947\u0928\u0942">
          <ul>
            <li><a href="${standardHomePath}">\u092e\u0941\u0916\u092a\u0943\u0937\u094d\u0920</a></li>
            <li><a href="${standardHomePath}#saints">\u0938\u0902\u0924</a></li>
            <li><a href="${standardHomePath}#categories">\u0935\u093f\u092d\u093e\u0917</a></li>
            <li><a href="${standardContactPath}">\u0938\u0902\u092a\u0930\u094d\u0915</a></li>
          </ul>
        </nav>
        <div class="header-actions">
          <div class="lang-switch-group" aria-label="\u092d\u093e\u0937\u093e \u0928\u093f\u0935\u0921\u093e">
            <button class="lang-switch active" type="button" data-language="marathi" data-language-option="marathi">\u092e\u0930\u093e\u0920\u0940</button>
            <button class="lang-switch" type="button" data-language="english" data-language-option="english">English</button>
          </div>
          <button class="search-trigger-btn" id="searchTrigger" aria-label="\u0936\u094b\u0927 \u0909\u0918\u0921\u093e" type="button">
            <i class="fas fa-search"></i>
          </button>
        </div>
      </div>
    `;
  };

  standardizeHeader();
  // --- Standardize Footer Across All Pages ---
  const logoLink = document.querySelector('.logo-link');
  const logoImg = document.querySelector('.logo-img');
  const homePath = logoLink ? logoLink.getAttribute('href') : 'index.html';
  const logoSrc = logoImg ? logoImg.getAttribute('src') : 'Vakibh/vaakibh_logo.svg';
  const mediaBasePath = logoSrc.replace(/vaakibh_logo\.svg(?:\?.*)?$/, '');
  const siteBasePath = homePath.replace(/index\.html(?:#.*)?$/, '');
  const sharedVeenaSrc = `${siteBasePath}assets/veena.svg`;
  const sharedWhatsappSrc = `${siteBasePath}assets/whatsapp_icon.svg`;
  const whatsappMessage = encodeURIComponent('\u0928\u092e\u0938\u094d\u0915\u093e\u0930, \u092e\u0932\u093e \u0935\u093e\u0915\u0940\u092d \u0935\u093f\u0937\u092f\u0940 \u092e\u093e\u0939\u093f\u0924\u0940 \u0939\u0935\u0940 \u0906\u0939\u0947.');
  const sharedWhatsappHref = `https://wa.me/919923916476?text=${whatsappMessage}`;
  const blogPath = '/blog/';
  const contactPath = '/contact/';
  // Shared page assets live in the public `assests` directory.  This base is
  // also used by the dynamically-created breadcrumb hero backgrounds.
  const assetBasePath = `${siteBasePath}assests/`;

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

    const isReadableMarathi = (value = '') => /[\u0900-\u097F]/.test(value) && !/[?]{2,}|ÃƒÆ’Ã†’Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤|ÃƒÆ’Ã†’Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥/.test(value);
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
      muktabai: '\u0938\u0902\u0924 \u092E\u0941\u0915\u094D\u0924\u093E\u092C\u093E\u0908 \u092E\u0939\u093E\u0930\u093E\u091C',
      janabai: '\u0938\u0902\u0924 \u091C\u0928\u093E\u092C\u093E\u0908 \u092E\u0939\u093E\u0930\u093E\u091C',
      sopandev: '\u0938\u0902\u0924 \u0938\u094B\u092A\u093E\u0928\u0926\u0947\u0935 \u092E\u0939\u093E\u0930\u093E\u091C',
      nivruttinath: '\u0938\u0902\u0924 \u0928\u093F\u0935\u0943\u0924\u094D\u0924\u093F\u0928\u093E\u0925 \u092E\u0939\u093E\u0930\u093E\u091C',
      chokhamela: '\u0938\u0902\u0924 \u091A\u094B\u0916\u093E\u092E\u0947\u0933\u093E \u092E\u0939\u093E\u0930\u093E\u091C',
      'savata-mali': '\u0938\u0902\u0924 \u0938\u093E\u0935\u0924\u093E \u092E\u093E\u0933\u0940 \u092E\u0939\u093E\u0930\u093E\u091C',
      'gora-kumbhar': '\u0938\u0902\u0924 \u0917\u094B\u0930\u093E \u0915\u0941\u0902\u092D\u093E\u0930 \u092E\u0939\u093E\u0930\u093E\u091C',
      'narhari-sonar': '\u0938\u0902\u0924 \u0928\u0930\u0939\u0930\u0940 \u0938\u094B\u0928\u093E\u0930 \u092E\u0939\u093E\u0930\u093E\u091C',
      nilobaray: '\u0938\u0902\u0924 \u0928\u093F\u0933\u094B\u092C\u093E\u0930\u093E\u092F \u092E\u0939\u093E\u0930\u093E\u091C',
      rohidas: '\u0938\u0902\u0924 \u0930\u094B\u0939\u093F\u0926\u093E\u0938 \u092E\u0939\u093E\u0930\u093E\u091C',
      'santaji-jagnade': '\u0938\u0902\u0924 \u0938\u0902\u0924\u093E\u091C\u0940 \u091C\u0917\u0928\u093E\u0921\u0947 \u092E\u0939\u093E\u0930\u093E\u091C',
      'visoba-khechar': '\u0938\u0902\u0924 \u0935\u093F\u0938\u094B\u092C\u093E \u0916\u0947\u091A\u0930 \u092E\u0939\u093E\u0930\u093E\u091C'
    };

    const segments = path.split('/').filter(Boolean);
    const santsIndex = segments.indexOf('sants');
    const saintSlug = santsIndex >= 0 ? segments[santsIndex + 1] : '';
    const pageSlug = [...segments].reverse().find(segment => segment && segment !== 'index.html' && segment !== 'contact' && segment !== 'blog' && segment !== 'sants' && segment !== 'vakibh-media-main' && segment !== 'vakibh-media') || '';
    const isAbhangRangePage = /\/sants\/[^/]+\/abhang-\d+(?:(?:-to-)|-)\d+(?:\/|\.html|$)/.test(normalizedPath);
    const cleanAbhangRangeTitle = (value = '') => value
      .replace(/\s*[०-९0-9]+\s*ते\s*[०-९0-9]+(?=\s*(?:[–-]|$))/u, '')
      .replace(/\s*[०-९0-9]+ते[०-९0-9]+(?=\s*(?:[–-]|$))/u, '')
      .replace(/\s*[–-]\s*वाकीभ\s*$/u, '')
      .trim();
    

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
        image = path.includes('/dnyaneshwar/') ? `${assetBasePath}sant/sant-dnyaneshwar-abhang.jpg` : `${assetBasePath}sant/haripath-banner.jpg`;
        eyebrow = '';
      }

      if (!isReadableMarathi(title)) {
        title = pageSlug && pageSlug !== saintSlug
          ? `${saintNames[saintSlug] || '\u0938\u0902\u0924'} - ${slugTitle(pageSlug)}`
          : (saintNames[saintSlug] || '\u0938\u0902\u0924');
      }
      if (pageSlug === saintSlug && saintNames[saintSlug]) {
        title = saintNames[saintSlug];
      }
    } else if (!isReadableMarathi(title)) {
      title = pageSlug ? slugTitle(pageSlug) : '\u0935\u093E\u0915\u0940\u092D';
    }

    if (isAbhangRangePage) {
      title = path.includes('/dnyaneshwar/') ? 'संत ज्ञानेश्वर अभंग' : cleanAbhangRangeTitle(title);
    }

    const namdevGathaCategorySlugs = new Set([
      'aatmsukh', 'balkrida-2', 'bhaktwatsalta', 'dhruvcharitra',
      'dronparw-katha', 'dyaneshwar-samadhi', 'dyaneshwarsamadhi-mahima',
      'gatha-1-2', 'gatha-1to25', 'gavlan', 'karuna', 'muktabai-samadhi-2',
      'naammahima', 'naamsankirtan-mahatmya', 'naamdev-charitra',
      'nivruttinath-samadhi-2', 'pandharimahatmya', 'pouranik-charitra',
      'rupke', 'santcharitra', 'santmahima', 'shrichangdewanchi-samadhi',
      'shridyaneshwaranchi-samadhi', 'shrikrushnlila', 'shrirammahatmya',
      'shivratrmahatmya', 'shukakhyan', 'shrivitthalmahatmya',
      'sopan-samadhi', 'sudamcharitra', 'tirthawali', 'updesh', 'updesh-2',
      'vitthache-abhang'
    ]);

    if (
      saintSlug === 'namdev' &&
      (/^संत नामदेव गाथा/.test(title) || namdevGathaCategorySlugs.has(pageSlug))
    ) {
      const categoryHeading = document.querySelector('.abhang-post-main .post-title');
      if (categoryHeading) {
        const categoryTitle = pageSlug === 'updesh-2'
          ? 'उपदेश'
          : categoryHeading.textContent
            .replace(/^संत नामदेव(?:ांची)?\s+(?:गाथा|अभंग)\s*/u, '')
            .trim();
        if (categoryTitle) categoryHeading.textContent = categoryTitle;
      }
      title = 'संत नामदेव गाथा';
    }

    if (saintSlug === 'tukaram' && pageSlug === 'aarti') {
      const categoryHeading = document.querySelector('.abhang-post-main .post-title');
      if (categoryHeading) categoryHeading.textContent = 'आरती';
      title = 'संत तुकाराम महाराज';
    }

    const dnyaneshwariChapterMatch = normalizedPath.match(/\/sants\/dnyaneshwar\/adhyay-(\d+)(?:\/|\.html|$)/);
    if (dnyaneshwariChapterMatch) {
      const chapterNumber = Number(dnyaneshwariChapterMatch[1]);
      const chapterOrdinals = [
        '', 'पहिला', 'दुसरा', 'तिसरा', 'चौथा', 'पाचवा', 'सहावा',
        'सातवा', 'आठवा', 'नववा', 'दहावा', 'अकरावा', 'बारावा',
        'तेरावा', 'चौदावा', 'पंधरावा', 'सोळावा', 'सतरावा', 'अठरावा'
      ];
      const chapterLabel = chapterOrdinals[chapterNumber] || toMarathiDigits(chapterNumber);
      const contentHeading = document.querySelector('.abhang-post-main .post-title');
      if (contentHeading) contentHeading.textContent = `अध्याय ${chapterLabel}`;

      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = 'सार्थ ज्ञानेश्वरी';
      title = 'सार्थ ज्ञानेश्वरी';
    }

    if (saintSlug === 'dnyaneshwar' && pageSlug === 'sarth-dnyaneshwari') {
      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = 'सार्थ ज्ञानेश्वरी';
      title = 'सार्थ ज्ञानेश्वरी';
    }

    if (saintSlug === 'eknath' && /^rukminiswayamwar-prasang-/.test(pageSlug)) {
      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = 'रुक्मिणी स्वयंवर';
      title = 'रुक्मिणी स्वयंवर';
    }

    if (
      saintSlug === 'narhari-sonar'
      && new Set(['mandir-samadhi', 'aarti', 'abhang', 'charitra']).has(pageSlug)
    ) {
      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = 'संत नरहरी सोनार महाराज';
      title = 'संत नरहरी सोनार महाराज';
    }

    if (
      saintSlug === 'santaji-jagnade'
      && new Set(['mandir-samadhi', 'aarti', 'abhang', 'charitra']).has(pageSlug)
    ) {
      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = 'संत संताजी जगनाडे महाराज';
      title = 'संत संताजी जगनाडे महाराज';
    }

    if (
      saintSlug === 'nilobaray'
      && new Set(['charitra', 'abhang-gatha', 'aarti']).has(pageSlug)
    ) {
      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = 'संत निळोबाराय महाराज';
      title = 'संत निळोबाराय महाराज';
    }

    const eknathiChapterSlugs = [
      'adhyay-pahila', 'eknathi-bhagvat-adhyay-dusra', 'adhyay-tisara',
      'adhyay-choutha', 'adhyay-pachava', 'adhyay-sahava', 'adhyay-satava',
      'adhyay-athva', 'chapter-nine', 'adhyay-dahava', 'chapter-eleven',
      'adhyay-barava', 'adhyay-tera', 'adhyay-chaudava', 'adhyay-pandhrava',
      'adhyay-solava', 'adhyay-satrava', 'adhyay-athrava', 'adhyay-ekunvis',
      'adhyay-vis', 'adhyay-ekvis', 'adhyay-bavis', 'adhyay-teviswa',
      'adhyay-chovis', 'adhyay-panchvis', 'adhyay-savvis', 'adhyay-sattavis',
      'adhyay-atthavis', 'adhyay-ekuntees', 'adhyay-tisawa', 'adhyay-ektisawa'
    ];
    const eknathiChapterIndex = eknathiChapterSlugs.indexOf(pageSlug);
    if (saintSlug === 'eknath' && eknathiChapterIndex >= 0) {
      const chapterOrdinals = [
        'पहिला', 'दुसरा', 'तिसरा', 'चौथा', 'पाचवा', 'सहावा', 'सातवा',
        'आठवा', 'नववा', 'दहावा', 'अकरावा', 'बारावा', 'तेरावा', 'चौदावा',
        'पंधरावा', 'सोळावा', 'सतरावा', 'अठरावा', 'एकोणिसावा', 'विसावा',
        'एकविसावा', 'बाविसावा', 'तेविसावा', 'चोविसावा', 'पंचविसावा',
        'सव्विसावा', 'सत्ताविसावा', 'अठ्ठाविसावा', 'एकोणतिसावा', 'तिसावा',
        'एकतिसावा'
      ];
      const contentHeading = document.querySelector('.post-main .post-title, .post-article .post-title');
      if (contentHeading) contentHeading.textContent = `अध्याय ${chapterOrdinals[eknathiChapterIndex]}`;

      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = 'एकनाथी भागवत';
      title = 'एकनाथी भागवत';
    }

    const bhavarthChapterMatch = normalizedPath.match(
      /\/sants\/eknath\/bhawarth-ramayan-(?:(kishkindhakand|sundarkand|yudhkand|uttarkand)-)?adhyay-[^/]+(?:\/|\.html|$)/
    );
    if (bhavarthChapterMatch) {
      const workTitles = {
        kishkindhakand: 'किष्किंधाकाण्ड',
        sundarkand: 'सुंदरकाण्ड',
        yudhkand: 'युद्धकाण्ड',
        uttarkand: 'उत्तरकाण्ड'
      };
      const workTitle = workTitles[bhavarthChapterMatch[1]] || 'भावार्थ रामायण';
      const sourceChapterHeading = Array.from(document.querySelectorAll('.bhavarth-ramayan-source-heading'))
        .map((heading) => (heading.textContent || '').replace(/\s+/g, ' ').replace(/॥/g, '').trim())
        .find((heading) => /^अध्याय\s+/u.test(heading));
      const contentHeading = document.querySelector('.post-main .post-title, .post-article .post-title');
      if (contentHeading && sourceChapterHeading) contentHeading.textContent = sourceChapterHeading;

      const sourceBreadcrumbCurrent = document.querySelector('.sant-breadcrumb span:last-child');
      if (sourceBreadcrumbCurrent) sourceBreadcrumbCurrent.textContent = workTitle;
      title = workTitle;
    }

    if (/\/sants\/tukaram\/gatha-\d+(?:\/|\.html|$)/.test(normalizedPath)) {
      title = '\u0938\u0902\u0924 \u0924\u0941\u0915\u093E\u0930\u093E\u092E \u0917\u093E\u0925\u093E';
    }

    const hero = document.createElement('section');
    hero.className = 'inner-breadcrumb-hero';
    hero.dataset.category = category;
    hero.style.setProperty('--breadcrumb-bg', `url("${image}")`);
    hero.style.backgroundImage = `url("${image}")`;
    hero.style.position = 'relative';
    hero.style.width = '100%';
    hero.style.minHeight = '410px';
    hero.style.margin = '0';
    hero.style.padding = '0 1.5rem';
    hero.style.display = 'flex';
    hero.style.alignItems = 'center';
    hero.style.overflow = 'hidden';
    hero.style.color = '#ffffff';
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
    hero.innerHTML = `
      <div class="inner-breadcrumb-overlay" style="position:absolute;inset:0;z-index:0;background:linear-gradient(90deg, rgba(36,59,90,.84) 0%, rgba(36,59,90,.58) 45%, rgba(16,22,32,.58) 100%), rgba(0,0,0,.55);"></div>
      <div class="inner-breadcrumb-pattern" aria-hidden="true"></div>
      <span class="devotional-float devotional-float-taal" aria-hidden="true"><img src="${assetBasePath}harmonium.png" alt=""></span>
      <span class="devotional-float devotional-float-mridang" aria-hidden="true"><img src="${assetBasePath}mrudang.png" alt=""></span>
      <span class="devotional-float devotional-float-tulsi" aria-hidden="true"><img src="${assetBasePath}tal.png" alt=""></span>
      <span class="devotional-float devotional-float-veena" aria-hidden="true"><img src="${assetBasePath}veena.png" alt=""></span>
      <div class="inner-breadcrumb-content" style="position:relative;z-index:1;width:min(100%,1120px);margin:0 auto;">
        ${eyebrow ? `<span class="inner-breadcrumb-eyebrow">${eyebrow}</span>` : ''}
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
  const standardizeAbhangRangeSelectors = () => {
    const rangeSelectors = document.querySelectorAll('.sahitya-links-grid, .dnyaneshwar-links-1col, .dnyaneshwar-links-grid');

    rangeSelectors.forEach((grid) => {
      const rangeLinks = Array.from(grid.querySelectorAll("a[href*=\"abhang-\"]"))
        .filter((link) => /abhang-\d+(?:-to-|-|\/)\d+|abhang-\d+-\d+/i.test(link.getAttribute('href') || ''));

      if (!rangeLinks.length) return;

      grid.classList.add('abhang-range-selector-grid');
      document.body.classList.add('abhang-range-selector-page');

      rangeLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        const rangeMatch = href.match(/abhang-(\d+)(?:-to-|-)(\d+)/i);
        if (!rangeMatch) return;

        const label = document.createElement('span');
        label.className = 'abhang-range-label';
        ['अभंग', toMarathiDigits(rangeMatch[1]), 'ते', toMarathiDigits(rangeMatch[2])]
          .forEach((part) => {
            const segment = document.createElement('span');
            segment.textContent = part;
            label.appendChild(segment);
          });
        link.replaceChildren(label);
        link.dataset.rangeStart = rangeMatch[1];
        link.dataset.rangeEnd = rangeMatch[2];
        link.dataset.mrText = `अभंग ${toMarathiDigits(rangeMatch[1])} ते ${toMarathiDigits(rangeMatch[2])}`;
        link.setAttribute('aria-label', link.dataset.mrText);
      });

      const section = grid.closest('.abhang-grid-section, section, main');
      const heading = section?.querySelector('.abhang-grid-heading, .dnyaneshwar-heading, h2');
      if (heading) heading.textContent = '\u0905\u092d\u0902\u0917 \u0938\u0902\u0917\u094d\u0930\u0939';
    });
  };

  standardizeAbhangRangeSelectors();
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
        </div>
        <p>
          \u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F, \u0905\u092D\u0902\u0917, \u0913\u0935\u094D\u092F\u093E \u0906\u0923\u093F \u0917\u094D\u0930\u0902\u0925\u093E\u0902\u091A\u093E \u0938\u092E\u0943\u0926\u094D\u0927 \u092E\u0930\u093E\u0920\u0940 \u0938\u0902\u0917\u094D\u0930\u0939.
          \u0935\u093E\u0930\u0915\u0930\u0940 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u091C\u0924\u0928, \u0938\u0902\u0935\u0930\u094D\u0927\u0928 \u0906\u0923\u093F \u092A\u094D\u0930\u0938\u093E\u0930 \u0939\u093E \u0906\u092E\u091A\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928.
        </p>
        <div class="footer-socials" aria-label="\u0935\u093E\u0915\u0940\u092D \u0938\u094B\u0936\u0932 \u092E\u0940\u0921\u093F\u092F\u093E">
          <a href="${socialLinks.instagramUrl}" class="floating-social-link floating-social-instagram footer-social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram" aria-hidden="true"></i></a>
          <a href="${sharedWhatsappHref}" class="floating-social-link floating-social-whatsapp footer-social-link" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i></a>
          <a href="${socialLinks.youtubeUrl}" class="floating-social-link floating-social-youtube footer-social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube" aria-hidden="true"></i></a>
          <a href="${socialLinks.facebookUrl}" class="floating-social-link floating-social-facebook footer-social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>
        </div>
      </div>

      <div class="footer-links">
        <h4>\u092E\u0947\u0928\u094D\u092F\u0942</h4>
        <ul>
          <li><a href="${homePath}">\u092E\u0941\u0916\u092A\u0943\u0937\u094D\u0920</a></li>
          <li><a href="${homePath}#saints">\u0938\u0902\u0924</a></li>
          <li><a href="${homePath}#categories">\u0935\u093F\u092D\u093E\u0917</a></li>
          <li><a href="${blogPath}">\u092C\u094D\u0932\u0949\u0917</a></li>
          <li><a href="${contactPath}">\u0938\u0902\u092A\u0930\u094D\u0915</a></li>
        </ul>
      </div>

      <div class="footer-links footer-blog-links">
        <h4>\u092C\u094D\u0932\u0949\u0917</h4>
        <ul data-footer-recent-blogs>
          <li><a href="${blogPath}">\u0928\u0935\u0940\u0928 \u0932\u0947\u0916 \u092A\u0939\u093E</a></li>
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

    <div class="footer-visitor-stats" data-footer-visitor-stats aria-label="भेटींची आकडेवारी">
      <div><span>एकूण भेटी:</span> <strong data-total-visitors>०</strong></div>
      <span class="visitor-divider" aria-hidden="true">|</span>
      <div><span>आजच्या भेटी:</span> <strong data-today-visitors>०</strong></div>
    </div>

    <div class="footer-bottom">
      <p>&copy; \u0968\u0966\u0968\u096C \u0935\u093E\u0915\u0940\u092D. \u0938\u0930\u094D\u0935 \u0939\u0915\u094D\u0915 \u0930\u093E\u0916\u0940\u0935. \u0938\u0902\u0915\u0947\u0924\u0938\u094D\u0925\u0933\u093E\u091A\u0940 \u0930\u091A\u0928\u093E \u0935 \u0935\u093F\u0915\u093E\u0938 <a href="https://webakoof.com" target="_blank" rel="noopener noreferrer">\u0935\u0947\u092C\u0915\u0942\u092B</a>.</p>
      <button class="scroll-top-btn" id="scrollTopBtn" aria-label="\u0935\u0930 \u091C\u093E">
        <i class="fas fa-chevron-up"></i>
      </button>
    </div>
  `;
  const loadFooterVisitorStats = async () => {
    const stats = footer.querySelector('[data-footer-visitor-stats]');
    if (!stats) return;
    try {
      const page = `${window.location.pathname}${window.location.search}`;
      const response = await fetch(`/api/visitor-stats?page=${encodeURIComponent(page)}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Visitor stats unavailable');
      const values = await response.json();
      const formatCount = (value) => toMarathiDigits(Number(value || 0).toLocaleString('en-IN'));
      stats.querySelector('[data-total-visitors]').textContent = formatCount(values.totalVisitors);
      stats.querySelector('[data-today-visitors]').textContent = formatCount(values.todayVisitors);
    } catch (error) {
      stats.hidden = true;
    }
  };
  loadFooterVisitorStats();

  const populateRecentFooterBlogs = async () => {
    const list = footer.querySelector('[data-footer-recent-blogs]');
    if (!list) return;

    try {
      let source = document;
      if (!document.querySelector('.blog-grid .blog-card')) {
        const response = await fetch('/blog/', { credentials: 'same-origin' });
        if (!response.ok) return;
        source = new DOMParser().parseFromString(await response.text(), 'text/html');
      }

      const recentPosts = Array.from(source.querySelectorAll('.blog-grid .blog-card'))
        .slice(0, 3)
        .map((card) => {
          const link = card.querySelector('.arrival-title a[href]');
          const href = link?.getAttribute('href');
          return link && href
            ? { title: link.textContent.trim(), href: new URL(href, `${window.location.origin}/blog/`).href }
            : null;
        })
        .filter(Boolean);
      if (!recentPosts.length) return;

      list.textContent = '';
      recentPosts.forEach(({ title, href }) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = href;
        link.textContent = title;
        item.appendChild(link);
        list.appendChild(item);
      });
    } catch (_) {
      // Keep the link to the blog listing if the static page cannot be fetched.
    }
  };
  populateRecentFooterBlogs();

  const ensureFloatingWhatsapp = () => {
    document.querySelectorAll('a.floating-whatsapp').forEach((link) => link.remove());
    return document.querySelector('.floating-social-bar');
  };

  const floatingWhatsapp = ensureFloatingWhatsapp();
  let floatingVeena = document.querySelector('.floating-veena');

  if (!floatingVeena) {
    floatingVeena = document.createElement('button');
    floatingVeena.type = 'button';
    floatingVeena.className = 'floating-veena';
    floatingVeena.setAttribute('aria-label', 'Play music');
    floatingVeena.title = 'Play Veena Music';
    floatingVeena.innerHTML = `
      <img src="${sharedVeenaSrc}" alt="Veena">
      <span class="veena-status-icon" aria-hidden="true">
        <i class="fas fa-volume-up"></i>
      </span>
    `;

    if (floatingWhatsapp?.parentNode) {
      floatingWhatsapp.parentNode.insertBefore(floatingVeena, floatingWhatsapp);
    } else {
      document.body.appendChild(floatingVeena);
    }
  } else {
    const veenaImg = floatingVeena.querySelector('img');
    if (veenaImg) {
      veenaImg.src = sharedVeenaSrc;
      veenaImg.alt = 'Veena';
    }
    if (!floatingVeena.querySelector('.veena-status-icon')) {
      const status = document.createElement('span');
      status.className = 'veena-status-icon';
      status.setAttribute('aria-hidden', 'true');
      status.innerHTML = '<i class="fas fa-volume-up"></i>';
      floatingVeena.appendChild(status);
    }
  }

  const AUDIO_STORAGE_KEYS = {
    currentTime: 'vaakibhAudioTime',
    isPlaying: 'vaakibhAudioPlaying',
    volume: 'vaakibhAudioVolume',
    source: 'vaakibhAudioSource'
  };
  const savedAudioTime = Number(localStorage.getItem(AUDIO_STORAGE_KEYS.currentTime) || 0);
  const savedAudioSource = localStorage.getItem(AUDIO_STORAGE_KEYS.source) || '';
  const savedAudioVolumeValue = localStorage.getItem(AUDIO_STORAGE_KEYS.volume);
  const savedAudioVolume = savedAudioVolumeValue === null ? 0.35 : Number(savedAudioVolumeValue);
  const hasSavedAudioVolume = savedAudioVolumeValue !== null && Number.isFinite(savedAudioVolume) && savedAudioVolume > 0;
  const devotionalAudio = new Audio();
  let activeAudioConfig = null;
  let shouldRestoreSavedTime = false;
  devotionalAudio.loop = false;
  devotionalAudio.preload = 'metadata';
  devotionalAudio.volume = Number.isFinite(savedAudioVolume) && savedAudioVolume > 0
    ? Math.min(1, Math.max(0, savedAudioVolume))
    : 0.35;
  devotionalAudio.muted = false;
  devotionalAudio.autoplay = false;

  const restoreSavedAudioTime = () => {
    if (shouldRestoreSavedTime && Number.isFinite(savedAudioTime) && savedAudioTime > 0) {
      const maximumTime = Number.isFinite(devotionalAudio.duration)
        ? Math.max(0, devotionalAudio.duration - 0.25)
        : savedAudioTime;
      devotionalAudio.currentTime = Math.min(savedAudioTime, maximumTime);
    }
  };
  devotionalAudio.addEventListener('loadedmetadata', restoreSavedAudioTime, { once: true });

  let lastAudioSaveAt = 0;
  const saveAudioState = () => {
    localStorage.setItem(AUDIO_STORAGE_KEYS.currentTime, String(devotionalAudio.currentTime || 0));
    localStorage.setItem(AUDIO_STORAGE_KEYS.isPlaying, String(!devotionalAudio.paused));
    localStorage.setItem(AUDIO_STORAGE_KEYS.volume, String(devotionalAudio.volume));
    if (activeAudioConfig?.fileUrl) {
      localStorage.setItem(AUDIO_STORAGE_KEYS.source, activeAudioConfig.fileUrl);
    }
  };
  devotionalAudio.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - lastAudioSaveAt < 1000) return;
    lastAudioSaveAt = now;
    saveAudioState();
  });
  devotionalAudio.addEventListener('volumechange', saveAudioState);
  window.addEventListener('pagehide', saveAudioState);

  const statusIcon = floatingVeena.querySelector('.veena-status-icon i');
  const statusBadge = floatingVeena.querySelector('.veena-status-icon');
  const updateVeenaState = () => {
    const isPlaying = !devotionalAudio.paused && !devotionalAudio.muted;
    floatingVeena.classList.toggle('is-playing', isPlaying);
    statusBadge?.classList.toggle('speaker-blinking', isPlaying);
    floatingVeena.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    floatingVeena.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    floatingVeena.title = isPlaying ? 'Pause Veena Music' : 'Play Veena Music';

    if (statusIcon) {
      statusIcon.className = isPlaying ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
  };

  let autoplayWasBlocked = false;
  const startAudioAutomatically = async () => {
    if (!activeAudioConfig?.fileUrl || !devotionalAudio.src || !devotionalAudio.paused) return;
    devotionalAudio.muted = false;
    try {
      await devotionalAudio.play();
      autoplayWasBlocked = false;
    } catch (error) {
      // Audible autoplay is blocked by default in some Chrome/Edge sessions.
      // The first user gesture below resumes playback without an error toast.
      autoplayWasBlocked = error?.name === 'NotAllowedError';
      if (!autoplayWasBlocked) console.error('[Vaakibh audio] Autoplay failed.', error);
      updateVeenaState();
    }
  };

  const resumeBlockedAutoplay = () => {
    if (!autoplayWasBlocked) return;
    startAudioAutomatically();
  };
  document.addEventListener('pointerdown', resumeBlockedAutoplay, { capture: true });
  document.addEventListener('keydown', resumeBlockedAutoplay, { capture: true });

  const loadActiveWebsiteAudio = async () => {
    try {
      const response = await fetch('/api/audio/active', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Active audio request failed with ${response.status}`);
      const config = await response.json();
      if (!config.fileUrl || typeof config.fileUrl !== 'string') {
        throw new Error('The active audio response has no valid file URL.');
      }

      activeAudioConfig = config;
      shouldRestoreSavedTime = savedAudioSource === config.fileUrl;
      devotionalAudio.src = new URL(config.fileUrl, window.location.origin).href;
      devotionalAudio.loop = config.loop !== false;
      if (!hasSavedAudioVolume) {
        const configuredVolume = Number(config.volume);
        devotionalAudio.volume = Number.isFinite(configuredVolume)
          ? Math.min(1, Math.max(0.05, configuredVolume))
          : 0.35;
      }
      devotionalAudio.load();
      floatingVeena.dataset.audioReady = 'true';
      floatingVeena.title = `Play ${config.title || 'Veena Music'}`;
      updateVeenaState();
      await startAudioAutomatically();
    } catch (error) {
      activeAudioConfig = null;
      floatingVeena.dataset.audioReady = 'false';
      console.error('[Vaakibh audio] Could not load active audio configuration.', error);
      updateVeenaState();
    }
  };

  loadActiveWebsiteAudio();

  statusBadge?.setAttribute('role', 'button');
  statusBadge?.setAttribute('aria-label', 'Mute or unmute Veena music');
  statusBadge?.setAttribute('tabindex', '0');
  const toggleAudioMute = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    devotionalAudio.muted = !devotionalAudio.muted;
    if (!devotionalAudio.muted && devotionalAudio.paused && activeAudioConfig?.fileUrl) {
      try { await devotionalAudio.play(); } catch (error) { console.error('[Vaakibh audio] Unmute playback failed.', error); }
    }
    updateVeenaState();
  };
  statusBadge?.addEventListener('click', toggleAudioMute);
  statusBadge?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') toggleAudioMute(event);
  });

  floatingVeena.addEventListener('click', async () => {
    console.debug('[Vaakibh audio]', {
      src: devotionalAudio.src,
      paused: devotionalAudio.paused,
      readyState: devotionalAudio.readyState
    });

    if (!activeAudioConfig?.fileUrl || !devotionalAudio.src) {
      console.error('[Vaakibh audio] No active audio is ready.');
      showToast('Audio is still loading or no active audio is configured.');
      updateVeenaState();
      return;
    }

    try {
      if (devotionalAudio.paused) {
        await devotionalAudio.play();
      } else {
        devotionalAudio.pause();
      }
    } catch (error) {
      console.error('[Vaakibh audio] Playback failed.', {
        error,
        src: devotionalAudio.src,
        readyState: devotionalAudio.readyState,
        mediaError: devotionalAudio.error
      });
      showToast('Audio could not start. Please try again.');
      updateVeenaState();
    }
  });

  devotionalAudio.addEventListener('pause', updateVeenaState);
  devotionalAudio.addEventListener('play', updateVeenaState);
  devotionalAudio.addEventListener('ended', updateVeenaState);
  devotionalAudio.addEventListener('error', () => {
    console.error('[Vaakibh audio] Unable to load audio.', {
      src: devotionalAudio.src,
      readyState: devotionalAudio.readyState,
      mediaError: devotionalAudio.error
    });
    updateVeenaState();
  });
  devotionalAudio.addEventListener('pause', saveAudioState);
  devotionalAudio.addEventListener('play', saveAudioState);
  updateVeenaState();

  // Keep this document (and its single Audio instance) alive during internal navigation.
  let renderedPageUrl = new URL(window.location.href);
  const loadDestinationAssets = (nextDocument, targetUrl) => {
    const loadedStyles = new Set(
      Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
        .map((link) => new URL(link.href, window.location.href).pathname.toLowerCase())
    );

    nextDocument.querySelectorAll('link[rel="stylesheet"][href]').forEach((sourceLink) => {
      const absoluteUrl = new URL(sourceLink.getAttribute('href'), targetUrl);
      if (loadedStyles.has(absoluteUrl.pathname.toLowerCase())) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = absoluteUrl.href;
      link.dataset.vaakibhPageAsset = 'true';
      document.head.appendChild(link);
      loadedStyles.add(absoluteUrl.pathname.toLowerCase());
    });

    document.querySelectorAll('script[data-vaakibh-page-script]').forEach((script) => script.remove());
    nextDocument.querySelectorAll('script[src]').forEach((sourceScript) => {
      const absoluteUrl = new URL(sourceScript.getAttribute('src'), targetUrl);
      if (absoluteUrl.origin !== window.location.origin) return;
      if (/\/Vakibh\/js\/main\.js$/i.test(absoluteUrl.pathname)) return;

      const script = document.createElement('script');
      script.src = absoluteUrl.href;
      script.async = false;
      script.dataset.vaakibhPageScript = 'true';
      document.body.appendChild(script);
    });
  };

  const navigateWithoutReload = async (destination, options = {}) => {
    const targetUrl = new URL(destination, window.location.href);

    if (targetUrl.origin !== renderedPageUrl.origin) return false;
    if (targetUrl.pathname === renderedPageUrl.pathname && targetUrl.search === renderedPageUrl.search) {
      if (targetUrl.hash) {
        document.getElementById(decodeURIComponent(targetUrl.hash.slice(1)))?.scrollIntoView();
        if (!options.fromPopState) history.pushState({}, '', targetUrl);
      }
      return true;
    }

    document.documentElement.classList.add('is-page-navigating');
    try {
      const response = await fetch(targetUrl, { headers: { 'X-Vaakibh-Navigation': 'partial' } });
      if (!response.ok) throw new Error(`Navigation failed with ${response.status}`);

      const nextDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
      const currentMain = document.querySelector('main');
      const nextMain = nextDocument.querySelector('main');
      if (!currentMain || !nextMain) throw new Error('The destination has no main content element');

      if (!options.fromPopState) history.pushState({}, '', targetUrl);
      document.querySelector('.inner-breadcrumb-hero')?.remove();
      document.body.classList.remove('has-inner-breadcrumb');
      currentMain.replaceWith(document.importNode(nextMain, true));
      renderedPageUrl = targetUrl;
      document.title = nextDocument.title || document.title;

      const preservedClasses = ['menu-open'];
      const nextClasses = Array.from(nextDocument.body.classList);
      document.body.className = [...new Set([
        ...nextClasses,
        ...preservedClasses.filter((name) => document.body.classList.contains(name))
      ])].join(' ');

      document.querySelector('nav')?.classList.remove('active');
      const menuIcon = document.querySelector('.menu-toggle i');
      if (menuIcon) menuIcon.className = 'fas fa-bars';

      createInnerBreadcrumbHero();
      loadDestinationAssets(nextDocument, targetUrl);

      if (targetUrl.hash) {
        requestAnimationFrame(() => {
          document.getElementById(decodeURIComponent(targetUrl.hash.slice(1)))?.scrollIntoView();
        });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }

      document.dispatchEvent(new CustomEvent('vaakibh:navigation', { detail: { url: targetUrl.href } }));
      return true;
    } catch (error) {
      console.warn('Falling back to full-page navigation:', error);
      saveAudioState();
      window.location.assign(targetUrl.href);
      return false;
    } finally {
      document.documentElement.classList.remove('is-page-navigating');
    }
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download') || link.dataset.noClientNavigation !== undefined) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return;

    const targetUrl = new URL(link.href, window.location.href);
    if (targetUrl.origin !== window.location.origin || targetUrl.pathname.startsWith('/admin')) return;

    // Sant literature pages are formatted by dedicated one-time initializers
    // (Charitra, Haripath, Gatha, Aarti, Abhang ranges, Gaulani, etc.). A
    // partial <main> swap skips those initializers and leaves the destination
    // with raw/mixed markup. Use a normal document navigation so each content
    // type restores its established layout and action rows on every visit.
    if (targetUrl.pathname.startsWith('/sants/')) return;

    event.preventDefault();
    navigateWithoutReload(targetUrl);
  });

  window.addEventListener('popstate', () => {
    navigateWithoutReload(window.location.href, { fromPopState: true });
  });

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
        '\u0938\u0902\u0924',
        '\u0935\u093F\u092D\u093E\u0917',
        '\u0938\u0902\u092A\u0930\u094D\u0915'
      ],
      searchLabel: '\u0936\u094B\u0927',
      footerMenu: '\u092E\u0947\u0928\u094D\u092F\u0942',
      footerBlog: '\u092C\u094D\u0932\u0949\u0917',
      footerContact: '\u0938\u0902\u092A\u0930\u094D\u0915',
      footerText: '\u0938\u0902\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F, \u0905\u092D\u0902\u0917, \u0913\u0935\u094D\u092F\u093E \u0906\u0923\u093F \u0917\u094D\u0930\u0902\u0925\u093E\u0902\u091A\u093E \u0938\u092E\u0943\u0926\u094D\u0927 \u092E\u0930\u093E\u0920\u0940 \u0938\u0902\u0917\u094D\u0930\u0939. \u0935\u093E\u0930\u0915\u0930\u0940 \u092A\u0930\u0902\u092A\u0930\u0947\u091A\u0947 \u091C\u0924\u0928, \u0938\u0902\u0935\u0930\u094D\u0927\u0928 \u0906\u0923\u093F \u092A\u094D\u0930\u0938\u093E\u0930 \u0939\u093E \u0906\u092E\u091A\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928.',
      footerLinks: [
        '\u092E\u0941\u0916\u092A\u0943\u0937\u094D\u0920',
        '\u0938\u0902\u0924',
        '\u0935\u093F\u092D\u093E\u0917',
        '\u092C\u094D\u0932\u0949\u0917',
        '\u0938\u0902\u092A\u0930\u094D\u0915'
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
      nav: ['Home', 'Saints', 'Categories', 'Contact'],
      searchLabel: 'Search',
      footerMenu: 'Menu',
      footerBlog: 'Blog',
      footerContact: 'Contact',
      footerText: 'A rich Marathi collection of saint literature, abhangs, ovis and sacred texts. Our effort is to preserve, nurture and share the Warkari tradition.',
      footerLinks: ['Home', 'Saints', 'Categories', 'Blog', 'Contact'],
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
  const normalizeLabelNumberSpacing = (value = '') => value
    .replace(/([ऀ-हक़-ॡ])(?=[०-९0-9])/gu, '$1 ')
    .replace(/([०-९0-9])(?=[ऀ-हक़-ॡ])/gu, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

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
      if (node.dataset.rangeStart && node.dataset.rangeEnd) {
        const start = node.dataset.rangeStart;
        const end = node.dataset.rangeEnd;
        if (selectedLanguage === 'english') {
          node.textContent = `Abhang ${start} to ${end}`;
        } else {
          const label = document.createElement('span');
          label.className = 'abhang-range-label';
          ['अभंग', toMarathiDigits(start), 'ते', toMarathiDigits(end)].forEach((part) => {
            const segment = document.createElement('span');
            segment.textContent = part;
            label.appendChild(segment);
          });
          node.replaceChildren(label);
        }
        return;
      }
      if (!node.dataset.mrText) node.dataset.mrText = normalizeLabelNumberSpacing(node.textContent);
      node.dataset.mrText = normalizeLabelNumberSpacing(node.dataset.mrText);
      node.textContent = selectedLanguage === 'english'
        ? englishUiLabel(node.dataset.mrText)
        : node.dataset.mrText;
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

    const navLabels = selectedLanguage === 'english'
      ? { home: 'Home', saints: 'Saints', categories: 'Categories', contact: 'Contact' }
      : { home: 'मुख्यपृष्ठ', saints: 'संत', categories: 'विभाग', contact: 'संपर्क' };
    document.querySelectorAll('#navMenu ul li a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (href.includes('#saints')) link.textContent = navLabels.saints;
      else if (href.includes('#categories')) link.textContent = navLabels.categories;
      else if (/\/contact\/?(?:$|[?#])|contact\/index\.html/i.test(href)) link.textContent = navLabels.contact;
      else link.textContent = navLabels.home;
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
    const footerMenuLinks = Array.from(document.querySelectorAll('.footer-links:not(.footer-blog-links) ul li a'));
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

    footerMenuLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (href.includes('#saints')) link.textContent = navLabels.saints;
      else if (href.includes('#categories')) link.textContent = navLabels.categories;
      else if (/\/blog\/?(?:$|[?#])|blog\/index\.html/i.test(href)) link.textContent = selectedLanguage === 'english' ? 'Blog' : 'ब्लॉग';
      else if (/\/contact\/?(?:$|[?#])|contact\/index\.html/i.test(href)) link.textContent = navLabels.contact;
      else link.textContent = navLabels.home;
    });

    footerBlogLinks.forEach((link, index) => {
      if (languagePack.footerBlogLinks[index]) {
        link.textContent = languagePack.footerBlogLinks[index];
      }
    });

    const footerContactValues = [
      'vakibhmedia@gmail.com',
      '9923916476',
      selectedLanguage === 'english' ? 'Pune, Maharashtra' : 'पुणे, महाराष्ट्र'
    ];
    footerContactItems.forEach((item, index) => {
      const icon = item.querySelector('i');
      const prefix = languagePack.contactPrefix[index];
      if (!icon || !prefix) return;

      // Rebuild the row as one text node. This prevents the numeral formatter
      // from leaving an old phone-number span behind on a repeated update.
      item.replaceChildren(icon, document.createTextNode(` ${prefix}: ${footerContactValues[index]}`));
    });

    const visitorLabels = document.querySelectorAll('[data-footer-visitor-stats] > div > span');
    if (visitorLabels[0]) visitorLabels[0].textContent = selectedLanguage === 'english' ? 'Total Visitors:' : 'एकूण भेटी:';
    if (visitorLabels[1]) visitorLabels[1].textContent = selectedLanguage === 'english' ? 'Today Visitors:' : 'आजच्या भेटी:';

    const copyright = document.querySelector('.footer-bottom p');
    if (copyright) {
      copyright.innerHTML = selectedLanguage === 'english'
        ? '&copy; 2026 Vaakibh. All rights reserved. Website designed and developed by <a href="https://webakoof.com" target="_blank" rel="noopener noreferrer">Webakoof</a>.'
        : '&copy; २०२६ वाकीभ. सर्व हक्क राखीव. संकेतस्थळाची रचना व विकास <a href="https://webakoof.com" target="_blank" rel="noopener noreferrer">वेबकूफ</a>.';
    }

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
      textArea.style.top = '0';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
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
        <button class="abhang-btn copy-abhang-btn" aria-label="मजकूर कॉपी करा" title="मजकूर कॉपी करा">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="व्हॉट्सॲपवर शेअर करा" title="व्हॉट्सॲपवर शेअर करा">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="फेसबुकवर शेअर करा" title="फेसबुकवर शेअर करा">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="इन्स्टाग्रामवर शेअर करा" title="इन्स्टाग्रामवर शेअर करा">
            <i class="fab fa-instagram"></i>
          </button>
          <button class="abhang-btn social-share-btn native-share-btn" data-platform="native" aria-label="शेअर करा" title="शेअर करा">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const getAbhangItemActionsMarkup = (targetId, itemLabel) => `
    <div class="abhang-item-actions abhang-card-footer" data-share-scope="item" data-share-target="${targetId}" data-share-label="${itemLabel}">
      <div class="abhang-actions-left">
        <button class="abhang-btn copy-abhang-btn" aria-label="मजकूर कॉपी करा" title="मजकूर कॉपी करा">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="व्हॉट्सॲपवर शेअर करा" title="व्हॉट्सॲपवर शेअर करा">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="फेसबुकवर शेअर करा" title="फेसबुकवर शेअर करा">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="इन्स्टाग्रामवर शेअर करा" title="इन्स्टाग्रामवर शेअर करा">
            <i class="fab fa-instagram"></i>
          </button>
          <button class="abhang-btn social-share-btn native-share-btn" data-platform="native" aria-label="शेअर करा" title="शेअर करा">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const formatComingSoonPage = () => {
    const comingSoonPattern = /काम\s+(?:चालू|सुरू)\s+आहे[.!।]?/;
    const placeholder = Array.from(document.querySelectorAll('main p'))
      .find((node) => comingSoonPattern.test((node.textContent || '').trim()));

    if (!placeholder) return;

    const main = placeholder.closest('main');
    if (!main) return;

    const heading = main.querySelector('h1');
    const title = (heading?.textContent || document.title.split(/[–|-]/)[0] || '').trim();

    const card = document.createElement('div');
    card.className = 'vakibh-coming-soon-card';
    card.style.cssText = 'max-width:900px;margin:0 auto;background:#fff;border:1px solid #f0d5ab;border-radius:24px;padding:48px 24px;text-align:center;box-shadow:0 12px 30px rgba(160,32,32,.08);';

    const cardTitle = document.createElement('h1');
    cardTitle.textContent = title;
    cardTitle.style.cssText = "font-family:'Hind',sans-serif;color:#a02020;font-size:2rem;margin:0 0 16px;";

    const message = document.createElement('p');
    message.textContent = 'काम चालू आहे.';
    message.style.cssText = "font-family:'Hind',sans-serif;font-size:1.3rem;color:#444;font-weight:700;margin:0;";

    card.append(cardTitle, message);
    main.className = 'sant-page-main vakibh-coming-soon-page';
    main.style.cssText = 'padding:80px 20px;';
    main.replaceChildren(card);
  };

  formatComingSoonPage();

  const createAbhangPostActions = () => {
    const abhangPosts = document.querySelectorAll('.abhang-post, .post-article');
    abhangPosts.forEach((post) => {
      if (post.dataset.shareActions === 'disabled') return;

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

      if (post.classList.contains('post-article')) {
        postContent.insertAdjacentHTML('afterend', getAbhangPostActionsMarkup());
      } else {
        postContent.insertAdjacentHTML('afterbegin', getAbhangPostActionsMarkup());
      }
    });
  };

  createAbhangPostActions();

  // Blog share icons belong to the end of the article content, not in a
  // separate card between the article and feedback form.
  if (document.body.classList.contains('blog-post-page')) {
    document.querySelectorAll('.post-article').forEach((post) => {
      const content = post.querySelector('.post-content');
      const actions = post.querySelector(':scope > .abhang-post-actions');
      if (post.querySelector('[data-blog-share]')) actions?.remove();
      else if (content && actions) content.appendChild(actions);
    });
  }

  const formatSarthHaripathPage = () => {
    if (!location.pathname.includes('/sants/dnyaneshwar/sarth-haripath/')) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    if (!postContent || postContent.querySelector('.abhang-readable-list')) return;

    const actions = postContent.querySelector('.abhang-post-actions');
    const nodesToFormat = Array.from(postContent.childNodes).filter((node) => node !== actions);
    const rawText = normalizeText(nodesToFormat.map((node) => node.textContent || '').join('\n'));
    if (!rawText) return;

    const itemPattern = /(^|\n|\s)([\u0966-\u096F]+)\s*[.)]?\s+(?=[\s\S]*?\u0965\u0967\u0965)/g;
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
    const attachEndingMarker = (line = '') => cleanText(line).replace(/\s+(॥[\u0966-\u096F]+॥)\s*$/, '\u00a0$1');

    const renderVerseStanzas = (value) => {
      const compact = cleanText(value).replace(/\s+/g, ' ');
      const stanzas = [];
      const stanzaPattern = /([^।॥]+।)\s*([^।॥]+॥[\u0966-\u096F]+॥)/g;
      let match;

      while ((match = stanzaPattern.exec(compact)) !== null) {
        stanzas.push([
          cleanText(match[1]),
          attachEndingMarker(match[2])
        ]);
      }

      if (stanzas.length) return stanzas;

      const pieces = compact.split(verseMarkerPattern).map((part) => part.trim()).filter(Boolean);
      for (let index = 0; index < pieces.length; index += 2) {
        const firstLine = cleanText(`${pieces[index] || ''} ।`);
        const secondLine = attachEndingMarker(pieces[index + 1] || '');
        if (firstLine || secondLine) stanzas.push([firstLine, secondLine]);
      }

      return stanzas;
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

      const verseStanzas = renderVerseStanzas(verseText);
      const meaningParagraphs = splitMeaningParagraphs(meaningText);

      if (!verseStanzas.length && !meaningParagraphs.length) return;

      const section = document.createElement('section');
      section.className = 'abhang-readable-item';
      section.id = `haripath-${number}`;
      section.dataset.abhangItem = 'true';
      section.dataset.abhangNumber = number;

      const verseBlock = document.createElement('div');
      verseBlock.className = 'abhang-readable-verses haripath-readable-verses';
      verseStanzas.forEach((stanza, stanzaIndex) => {
        const stanzaEl = document.createElement('div');
        stanzaEl.className = 'haripath-stanza';

        stanza.forEach((line, lineIndex) => {
          const lineEl = document.createElement('p');
          lineEl.className = lineIndex === 1 ? 'haripath-line haripath-ending-line' : 'haripath-line';
          if (stanzaIndex === 0 && lineIndex === 0) {
            const numberSpan = document.createElement('span');
            numberSpan.className = 'haripath-inline-number';
            numberSpan.textContent = `${number}.`;
            lineEl.dataset.verseNumber = number;
            lineEl.append(numberSpan, document.createTextNode(line));
          } else {
            lineEl.textContent = line;
          }
          stanzaEl.appendChild(lineEl);
        });

        verseBlock.appendChild(stanzaEl);
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

      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `हरिपाठ ${number}`));

      list.appendChild(section);
    });

    if (!list.children.length) return;
    nodesToFormat.forEach((node) => node.remove());
    const completeCard = document.createElement('div');
    completeCard.className = 'haripath-complete-card';
    completeCard.appendChild(list);
    actions?.remove();
    postContent.appendChild(completeCard);
  };

  formatSarthHaripathPage();

  const formatTukaramHaripathPage = () => {
    if (!location.pathname.includes('/sants/tukaram/sarth-haripath/')) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    const source = postContent?.querySelector('.abhang-verse');
    if (!postContent || !source || postContent.querySelector('.haripath-complete-card')) return;

    document.body.classList.add('haripath-meaning-normal-page');

    const actions = postContent.querySelector('.abhang-post-actions');
    const list = document.createElement('div');
    list.className = 'abhang-readable-list';

    source.querySelectorAll(':scope > p').forEach((paragraph) => {
      const lines = (paragraph.innerText || paragraph.textContent || '')
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter(Boolean);
      const number = lines.shift();

      if (!number || !/^[\u0966-\u096F]+$/.test(number) || !lines.length) return;
      if (lines.some((line) => /इति\s+श्रीतुकाराम\s+हरिपाठ\s+समाप्त/.test(line))) return;

      const section = document.createElement('section');
      section.className = 'abhang-readable-item';
      section.id = `haripath-${number}`;
      section.dataset.abhangItem = 'true';
      section.dataset.abhangNumber = number;

      const verseBlock = document.createElement('div');
      verseBlock.className = 'abhang-readable-verses haripath-readable-verses';

      lines.forEach((line, lineIndex) => {
        const stanza = document.createElement('div');
        stanza.className = 'haripath-stanza';
        const lineElement = document.createElement('p');
        lineElement.className = 'haripath-line haripath-ending-line';

        if (lineIndex === 0) {
          const numberSpan = document.createElement('span');
          numberSpan.className = 'haripath-inline-number';
          numberSpan.textContent = `${number}.`;
          lineElement.dataset.verseNumber = number;
          lineElement.append(numberSpan, document.createTextNode(line));
        } else {
          lineElement.textContent = line;
        }

        stanza.appendChild(lineElement);
        verseBlock.appendChild(stanza);
      });

      section.appendChild(verseBlock);
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `हरिपाठ ${number}`));
      list.appendChild(section);
    });

    if (!list.children.length) return;

    const completeCard = document.createElement('div');
    completeCard.className = 'haripath-complete-card';
    completeCard.appendChild(list);
    actions?.remove();

    source.remove();
    postContent.appendChild(completeCard);
  };

  formatTukaramHaripathPage();

  const formatNamdevHaripathPage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/namdev/sarth-haripath/')) return;

    const article = document.querySelector('.abhang-post');
    const legacyHeader = article?.querySelector('.post-header');
    if (!article || !legacyHeader || article.querySelector('.haripath-complete-card')) return;

    const verseParagraphs = Array.from(legacyHeader.querySelectorAll('p')).filter((paragraph) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      return /[।॥]/.test(text) && !/इति\s+श्री|हरिपाठ\s+समाप्त/.test(text);
    });
    if (!verseParagraphs.length) return;

    document.body.classList.add('haripath-meaning-normal-page', 'namdev-haripath-page');

    const list = document.createElement('div');
    list.className = 'abhang-readable-list';

    verseParagraphs.forEach((paragraph, index) => {
      const number = String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
      const lines = (paragraph.innerText || paragraph.textContent || '')
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter(Boolean);
      if (!lines.length) return;

      const section = document.createElement('section');
      section.className = 'abhang-readable-item';
      section.id = `namdev-haripath-${index + 1}`;
      section.dataset.abhangItem = 'true';
      section.dataset.abhangNumber = number;

      const verseBlock = document.createElement('div');
      verseBlock.className = 'abhang-readable-verses haripath-readable-verses';

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 2) {
        const stanza = document.createElement('div');
        stanza.className = 'haripath-stanza';

        lines.slice(lineIndex, lineIndex + 2).forEach((line, pairIndex) => {
          const lineElement = document.createElement('p');
          lineElement.className = pairIndex === 1
            ? 'haripath-line haripath-ending-line'
            : 'haripath-line';

          if (lineIndex === 0 && pairIndex === 0) {
            const numberSpan = document.createElement('span');
            numberSpan.className = 'haripath-inline-number';
            numberSpan.textContent = `${number}.`;
            lineElement.dataset.verseNumber = number;
            lineElement.append(numberSpan, document.createTextNode(line));
          } else {
            lineElement.textContent = line;
          }
          stanza.appendChild(lineElement);
        });
        verseBlock.appendChild(stanza);
      }

      section.appendChild(verseBlock);
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `हरिपाठ ${number}`));
      list.appendChild(section);
    });

    const completeCard = document.createElement('div');
    completeCard.className = 'haripath-complete-card';
    completeCard.appendChild(list);

    const pageHeader = document.createElement('header');
    pageHeader.className = 'post-header';
    pageHeader.innerHTML = '<h1 class="post-title">संत नामदेव हरिपाठ</h1>';
    const postContent = document.createElement('div');
    postContent.className = 'post-content';
    postContent.appendChild(completeCard);
    article.replaceChildren(pageHeader, postContent);
  };

  formatNamdevHaripathPage();

  const formatNamdevGathaCategoryPages = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const categorySlugs = [
      'gatha-1to25', 'gatha-1-2', 'updesh', 'updesh-2', 'aatmsukh',
      'bhaktwatsalta', 'dhruvcharitra', 'naammahima', 'pandharimahatmya',
      'pouranik-charitra', 'shrirammahatmya', 'rupke', 'santmahima',
      'santcharitra', 'shivratrmahatmya', 'shukakhyan', 'sudamcharitra',
      'tirthawali', 'vitthache-abhang', 'shrivitthalmahatmya', 'gavlan',
      'dronparw-katha', 'karuna', 'balkrida-2', 'shrikrushnlila',
      'naamsankirtan-mahatmya', 'naamdev-charitra'
    ];
    const categorySlug = path.match(/\/sants\/namdev\/([^/]+)\//)?.[1] || '';
    if (!categorySlugs.includes(categorySlug)) return;
    const categoryNumberLabel = {
      'vitthache-abhang': 'अभंग',
      gavlan: 'गवळण',
      'dronparw-katha': 'कथा'
    }[categorySlug] || 'गाथा';

    const postContent = document.querySelector('.abhang-post .post-content');
    const entry = postContent?.querySelector('.entry-content');
    const actions = postContent?.querySelector('.abhang-post-actions');
    if (!postContent || !entry || entry.dataset.namdevGathaCard === 'true') return;

    entry.dataset.namdevGathaCard = 'true';
    document.body.classList.add('namdev-gatha-card-page');

    if (path.includes('/sants/namdev/gatha-1to25/')) {
      entry.classList.add('namdev-gatha-card-list-host');
      document.body.classList.add('namdev-gatha-multi-card-page');

      const groups = [];
      let currentGroup = [];
      Array.from(entry.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('hr')) {
          if (normalizeText(currentGroup.map((item) => item.textContent || '').join(' '))) {
            groups.push(currentGroup);
          }
          currentGroup = [];
          return;
        }
        currentGroup.push(node);
      });
      if (normalizeText(currentGroup.map((item) => item.textContent || '').join(' '))) {
        groups.push(currentGroup);
      }

      const list = document.createElement('div');
      list.className = 'namdev-gatha-section-list';
      groups.slice(0, 25).forEach((nodes, index) => {
        const number = String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card';
        card.id = `namdev-gatha-${index + 1}`;

        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `गाथा ${number}`;

        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        nodes.forEach((node) => content.appendChild(node));
        content.querySelectorAll('p').forEach((paragraph) => {
          const getFirstLine = () => normalizeText(
            (paragraph.innerText || paragraph.textContent || '').split(/\r?\n/)[0] || ''
          );
          const removeFirstLine = () => {
            const firstBreak = paragraph.querySelector('br');
            if (!firstBreak) {
              paragraph.remove();
              return false;
            }
            const container = firstBreak.parentNode;
            let node = container.firstChild;
            while (node) {
              const next = node.nextSibling;
              node.remove();
              if (node === firstBreak) break;
              node = next;
            }
            return true;
          };

          if (/^संत\s+नामदेव\s+गाथा\s+[०-९0-9]+\s*[–—-]/.test(getFirstLine())) {
            if (!removeFirstLine()) return;
          }

          const firstLine = getFirstLine();
          const firstBreak = paragraph.querySelector('br');
          if (/^[०-९0-9]+[.)]?$/u.test(firstLine) && firstBreak) {
            firstBreak.replaceWith(document.createTextNode(' '));
          }

          paragraph.classList.add('namdev-gatha-verse-block');
          paragraph.removeAttribute('style');
          paragraph.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
          paragraph.style.setProperty('display', 'table', 'important');
          paragraph.style.setProperty('width', 'fit-content', 'important');
          paragraph.style.setProperty('max-width', '100%', 'important');
          paragraph.style.setProperty('margin-left', 'auto', 'important');
          paragraph.style.setProperty('margin-right', 'auto', 'important');
          paragraph.style.setProperty('text-align', 'left', 'important');
        });

        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `गाथा ${number}`));
        list.appendChild(card);
      });

      postContent.querySelector('.abhang-post-actions')?.remove();
      entry.replaceChildren(list);
      return;
    }

    if (path.includes('/sants/namdev/gatha-1-2/')) {
      entry.classList.add('namdev-gatha-card-list-host');
      document.body.classList.add('namdev-gatha-multi-card-page');

      const paragraphs = Array.from(entry.querySelectorAll('p')).filter((paragraph) => {
        const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
        return /^[०-९0-9]+[.)]?\s+/.test(text) && /[।॥]/.test(text);
      });
      const list = document.createElement('div');
      list.className = 'namdev-gatha-section-list';

      paragraphs.forEach((paragraph, index) => {
        const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
        const number = text.match(/^([०-९0-9]+)/)?.[1]
          || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
        const verse = paragraph.cloneNode(true);
        verse.className = 'namdev-gatha-verse-block';
        verse.removeAttribute('style');
        verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));

        const walker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
        let firstTextNode = walker.nextNode();
        while (firstTextNode && !normalizeText(firstTextNode.textContent || '')) {
          firstTextNode = walker.nextNode();
        }
        if (firstTextNode) {
          firstTextNode.textContent = (firstTextNode.textContent || '').replace(/^\s*[०-९0-9]+[.)]?\s*/, '');
        }
        verse.style.setProperty('display', 'table', 'important');
        verse.style.setProperty('width', 'fit-content', 'important');
        verse.style.setProperty('max-width', '100%', 'important');
        verse.style.setProperty('margin-left', 'auto', 'important');
        verse.style.setProperty('margin-right', 'auto', 'important');
        verse.style.setProperty('text-align', 'left', 'important');

        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card';
        card.id = `namdev-atmaswarup-gatha-${index + 1}`;
        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `गाथा ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `गाथा ${number}`));
        list.appendChild(card);
      });

      postContent.querySelector('.abhang-post-actions')?.remove();
      entry.replaceChildren(list);
      return;
    }

    entry.classList.add('namdev-gatha-card-list-host');
    document.body.classList.add('namdev-gatha-multi-card-page');

    const candidates = Array.from(entry.querySelectorAll('p')).filter((paragraph) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      if (!text || !/[।॥]/.test(text)) return false;
      if (/^संत\s+नामदेव\s+(?:गाथा|अभंग)/.test(text)) return false;
      return /^[०-९0-9]+[.)]?\s*/.test(text) || paragraph.querySelector('br');
    });

    if (!candidates.length) return;

    const list = document.createElement('div');
    list.className = 'namdev-gatha-section-list';
    candidates.forEach((paragraph, index) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      const explicitNumber = text.match(/^([०-९0-9]+)[.)]?\s*/)?.[1];
      const number = explicitNumber
        || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
      const verse = paragraph.cloneNode(true);
      verse.className = 'namdev-gatha-verse-block';
      verse.removeAttribute('style');
      verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));

      if (explicitNumber) {
        const walker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
        let firstTextNode = walker.nextNode();
        while (firstTextNode && !normalizeText(firstTextNode.textContent || '')) {
          firstTextNode = walker.nextNode();
        }
        if (firstTextNode) {
          firstTextNode.textContent = (firstTextNode.textContent || '')
            .replace(/^\s*[०-९0-9]+[.)]?\s*/, '');
        }
      }

      verse.style.setProperty('display', 'table', 'important');
      verse.style.setProperty('width', 'fit-content', 'important');
      verse.style.setProperty('max-width', '100%', 'important');
      verse.style.setProperty('margin-left', 'auto', 'important');
      verse.style.setProperty('margin-right', 'auto', 'important');
      verse.style.setProperty('text-align', 'center', 'important');
      verse.style.setProperty('text-align-last', 'center', 'important');
      verse.querySelectorAll('*').forEach((child) => {
        child.style.setProperty('text-align', 'center', 'important');
        child.style.setProperty('text-align-last', 'center', 'important');
      });

      const card = document.createElement('article');
      card.className = 'namdev-gatha-section-card';
      card.id = `namdev-${categorySlug}-gatha-${index + 1}`;
      const badge = document.createElement('span');
      badge.className = 'namdev-gatha-section-number';
      badge.textContent = `${categoryNumberLabel} ${number}`;
      const content = document.createElement('div');
      content.className = 'namdev-gatha-section-content';
      content.appendChild(verse);
      card.append(badge, content);
      card.insertAdjacentHTML(
        'beforeend',
        getAbhangItemActionsMarkup(card.id, `${categoryNumberLabel} ${number}`)
      );
      list.appendChild(card);
    });

    postContent.querySelector('.abhang-post-actions')?.remove();
    entry.replaceChildren(list);
  };

  formatNamdevGathaCategoryPages();

  const formatNamdevPalnePage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/namdev/sant-namdev-palne/')) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    const entry = postContent?.querySelector('.entry-content');
    if (!postContent || !entry || entry.dataset.namdevPalneCards === 'true') return;

    const verses = Array.from(entry.querySelectorAll(':scope > p')).filter((paragraph) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      return text && /[।॥]/.test(text) && !paragraph.querySelector('strong');
    });
    if (!verses.length) return;

    entry.dataset.namdevPalneCards = 'true';
    entry.classList.add('namdev-gatha-card-list-host');
    document.body.classList.add('namdev-gatha-card-page', 'namdev-gatha-multi-card-page');

    const list = document.createElement('div');
    list.className = 'namdev-gatha-section-list';

    verses.forEach((paragraph, index) => {
      const number = String(index + 1).replace(
        /[0-9]/g,
        (digit) => '०१२३४५६७८९'[Number(digit)]
      );
      const verse = paragraph.cloneNode(true);
      verse.className = 'namdev-gatha-verse-block';
      verse.removeAttribute('style');
      verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
      verse.style.setProperty('display', 'table', 'important');
      verse.style.setProperty('width', 'fit-content', 'important');
      verse.style.setProperty('max-width', '100%', 'important');
      verse.style.setProperty('margin-left', 'auto', 'important');
      verse.style.setProperty('margin-right', 'auto', 'important');
      verse.style.setProperty('text-align', 'center', 'important');
      verse.style.setProperty('text-align-last', 'center', 'important');
      verse.querySelectorAll('*').forEach((child) => {
        child.style.setProperty('text-align', 'center', 'important');
        child.style.setProperty('text-align-last', 'center', 'important');
      });

      const card = document.createElement('article');
      card.className = 'namdev-gatha-section-card';
      card.id = `namdev-palna-${index + 1}`;
      const badge = document.createElement('span');
      badge.className = 'namdev-gatha-section-number';
      badge.textContent = `पाळणा ${number}`;
      const content = document.createElement('div');
      content.className = 'namdev-gatha-section-content';
      content.appendChild(verse);
      card.append(badge, content);
      card.insertAdjacentHTML(
        'beforeend',
        getAbhangItemActionsMarkup(card.id, `पाळणा ${number}`)
      );
      list.appendChild(card);
    });

    postContent.querySelector('.abhang-post-actions')?.remove();
    entry.replaceChildren(list);
  };

  formatNamdevPalnePage();

  const formatTukaramAartiPage = () => {
    if (!location.pathname.includes('/sants/tukaram/aarti/')) return;

    const postContent = document.querySelector('.abhang-post.aarti-content .post-content');
    const verses = postContent?.querySelector('.aarti-verses');
    const entries = verses ? Array.from(verses.querySelectorAll(':scope > .aarti-entry')) : [];
    if (!postContent || !verses || entries.length !== 2 || verses.querySelector('.abhang-item-actions')) return;

    postContent.querySelector('.abhang-post-actions')?.remove();
    verses.querySelector('.aarti-divider')?.remove();

    entries.forEach((entry, index) => {
      const number = index + 1;
      entry.classList.add('tukaram-aarti-card');
      entry.id = `tukaram-aarti-${number}`;
      entry.dataset.abhangItem = 'true';
      entry.dataset.abhangNumber = String(number);
      entry.style.setProperty('margin-left', 'auto', 'important');
      entry.style.setProperty('margin-right', 'auto', 'important');
      entry.style.setProperty('text-align', 'center', 'important');
      entry.style.setProperty('text-align-last', 'center', 'important');
      entry.style.setProperty('display', 'block', 'important');

      let title = entry.querySelector('.aarti-subtitle');
      if (!title) {
        title = document.createElement('h2');
        title.className = 'aarti-subtitle';
        title.textContent = `श्री तुकारामांची आरती ${number}`;
        entry.prepend(title);
      }

      // Devanagari numerals render visually smaller than the heading glyphs.
      // Wrap only the Aarti card number so it can be sized independently.
      if (!title.querySelector('.aarti-heading-number')) {
        const titleText = title.textContent.trim();
        const numberMatch = titleText.match(/\s([०-९]+)$/);
        if (numberMatch) {
          const numberElement = document.createElement('span');
          numberElement.className = 'aarti-heading-number';
          numberElement.textContent = numberMatch[1];
          title.replaceChildren(
            document.createTextNode(titleText.slice(0, numberMatch.index + 1)),
            numberElement
          );
        }
      }

      entry.querySelectorAll('.aarti-stanza, .aarti-line, p').forEach((node) => {
        node.style.setProperty('margin-left', 'auto', 'important');
        node.style.setProperty('margin-right', 'auto', 'important');
        node.style.setProperty('text-align', 'center', 'important');
        node.style.setProperty('text-align-last', 'center', 'important');
      });

      entry.insertAdjacentHTML(
        'beforeend',
        getAbhangItemActionsMarkup(entry.id, `आरती ${number}`)
      );
    });
  };

  formatTukaramAartiPage();

  const formatOtherSaintAartiPages = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    const isAartiPath = /\/(?:aarti|[^/]*(?:aarti|arati|arti))\//.test(path);
    if (!path.includes('/sants/') || !isAartiPath || path.includes('/sants/tukaram/aarti/')) return;

    const postContent = document.querySelector('.abhang-post .post-content, .post-article .post-content');
    const source = postContent?.querySelector('.abhang-verse, .entry-content, .verse_style, [itemprop="text"]');
    const entry = source?.matches('.entry-content, [itemprop="text"]')
      ? source
      : source?.querySelector('.entry-content, [itemprop="text"]') || source;
    if (!postContent || !source || !entry || postContent.querySelector('.saint-aarti-cards')) return;

    document.body.classList.add('saint-aarti-card-page');

    const pageTitle = normalizeText(document.querySelector('.post-title')?.textContent || 'संत आरती');
    const pageConfig = path.includes('/santaji-jagnade/aarti/')
      ? { start: /^([१२])\s*[.)]/, expected: 2 }
      : path.includes('/nilobaray/aarti/')
        ? { start: /^(१५७[१-५])\s*[.)]/, expected: 5 }
        : path.includes('/gora-kumbhar-aarti/')
          ? { start: /^आरती\s*([१२])$/, expected: 2, omitMarker: true }
        : { start: null, expected: 1 };

    const cards = document.createElement('div');
    cards.className = 'saint-aarti-cards';
    const paragraphs = Array.from(entry.children).filter((node) => {
      if (!node.matches('p')) return false;
      const text = normalizeText(node.textContent || '');
      if (!text || /आरती\s+समाप्त\s*[-–—]?$/.test(text)) return false;
      if (node.querySelector('strong') && text.includes(pageTitle)) return false;
      return text.replace(/\s*[-–—]\s*$/, '') !== pageTitle;
    });
    const groups = [];

    if (pageConfig.start) {
      let currentGroup = null;
      paragraphs.forEach((paragraph) => {
        const text = normalizeText(paragraph.textContent || '');
        if (pageConfig.start.test(text)) {
          currentGroup = [];
          groups.push(currentGroup);
          if (pageConfig.omitMarker) return;
        }
        if (currentGroup) currentGroup.push(paragraph);
      });
    } else if (paragraphs.length) {
      groups.push(paragraphs);
    }

    if (groups.length !== pageConfig.expected) return;

    groups.forEach((group, index) => {
      const number = index + 1;
      const card = document.createElement('section');
      card.className = 'saint-aarti-card';
      card.id = `saint-aarti-${number}`;
      card.dataset.abhangItem = 'true';
      card.dataset.abhangNumber = String(number);

      const title = document.createElement('h2');
      title.className = 'saint-aarti-card-title';
      title.textContent = groups.length === 1 ? pageTitle : `आरती ${number}`;
      const hideDuplicateCardTitle = groups.length === 1;
      if (!hideDuplicateCardTitle) card.appendChild(title);

      const content = document.createElement('div');
      content.className = 'saint-aarti-card-content';
      const firstParagraph = group[0];
      const leadingNumber = (firstParagraph?.textContent || '')
        .match(/^\s*[०-९0-9]+\s*[.)।-]?\s*/u)?.[0] || '';
      if (firstParagraph && leadingNumber) {
        let charactersToRemove = leadingNumber.length;
        const textWalker = document.createTreeWalker(firstParagraph, NodeFilter.SHOW_TEXT);
        let textNode = textWalker.nextNode();
        while (textNode && charactersToRemove > 0) {
          const text = textNode.nodeValue || '';
          const removeCount = Math.min(charactersToRemove, text.length);
          textNode.nodeValue = text.slice(removeCount);
          charactersToRemove -= removeCount;
          textNode = textWalker.nextNode();
        }
        firstParagraph.querySelectorAll('.marathi-digit-glyph:empty').forEach((element) => element.remove());
      }
      group.forEach((paragraph) => content.appendChild(paragraph));
      card.appendChild(content);
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `आरती ${number}`));
      cards.appendChild(card);
    });

    postContent.querySelector('.abhang-post-actions')?.remove();
    const article = postContent.closest('.abhang-post, .post-article');
    article?.querySelector('.abhang-action-toolbar')?.remove();
    Array.from(article?.children || []).forEach((child) => {
      if (child.classList?.contains('abhang-post-actions')) child.remove();
    });
    source.remove();
    postContent.appendChild(cards);
  };

  formatOtherSaintAartiPages();

  const formatDnyaneshwarViraniCards = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/virani/')) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    const source = postContent?.querySelector('.abhang-verse');
    const entry = source?.querySelector('.entry-content');
    if (!postContent || !source || !entry || postContent.querySelector('.virani-card-list')) return;

    const children = Array.from(entry.children);
    const starts = children.filter((node) => {
      const text = normalizeText(node.textContent || '');
      return node.matches('h2') || /विराणी\s*\/\s*विरहिणी\s*\/\s*विरहरत्ने/.test(text);
    });
    if (starts.length !== 9) return;

    document.body.classList.add('dnyaneshwar-virani-card-page');
    entry.dataset.viraniFormatted = 'true';
    const list = document.createElement('div');
    list.className = 'virani-card-list';

    starts.forEach((startNode, index) => {
      const endNode = starts[index + 1] || null;
      const number = index + 1;
      const card = document.createElement('section');
      card.className = 'virani-card';
      card.id = `virani-${number}`;
      card.dataset.abhangItem = 'true';
      card.dataset.abhangNumber = String(number);

      const title = document.createElement('h2');
      title.className = 'virani-card-title';
      title.textContent = `विरहिणी ${toMarathiDigits(number)}`;
      card.appendChild(title);

      let node = startNode.nextElementSibling;
      let verseFound = false;
      while (node && node !== endNode) {
        const next = node.nextElementSibling;
        const text = normalizeText(node.textContent || '');
        const isDuplicate = new RegExp(`^संत ज्ञानेश्वर विराणी\\s*[${number}१२३४५६७८९]$`).test(text)
          || /विराणी.*समाप्त/.test(text);

        if (node.matches('hr') || isDuplicate) {
          node.remove();
        } else if (!verseFound && node.matches('p') && node.querySelector('strong')) {
          node.className = 'virani-card-verse';
          card.appendChild(node);
          verseFound = true;
        } else if (/^॥\s*हरि\s*ॐ\s*॥$/.test(text)) {
          node.className = 'virani-card-closing';
          card.appendChild(node);
        } else if (node.matches('p')) {
          node.className = 'virani-card-meaning';
          card.appendChild(node);
        } else {
          card.appendChild(node);
        }
        node = next;
      }

      startNode.remove();
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `विराणी ${number}`));
      list.appendChild(card);
    });

    postContent.querySelector('.abhang-post-actions')?.remove();
    entry.replaceChildren(list);
  };

  formatDnyaneshwarViraniCards();

  const formatDnyaneshwarCharitraPage = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    const isEknathBiography = path.includes('/sants/eknath/sant-eknath/');
    const isNivruttinathBiography = path.includes('/sants/nivruttinath/sant-nivruttinath/');
    const isLegacySaintBiography = [
      '/sants/muktabai/sant-muktabai/',
      '/sants/sopandev/sopandev/',
      '/sants/chokhamela/sant-chokhamela/',
      '/sants/gora-kumbhar/gora-kumbhar/',
      '/sants/savata-mali/sant-savtamali/',
      '/sants/rohidas/sant-ravidas/'
    ].some((slug) => path.includes(slug));
    if (!/\/sants\/[^/]+\/charitra\//.test(path)
      && !isEknathBiography && !isNivruttinathBiography && !isLegacySaintBiography) return;

    const article = document.querySelector('.abhang-post, .post-article');
    let postContent = article?.querySelector('.post-content');

    // A few imported biography pages have their entire article inside the
    // legacy post header. Normalize that markup before applying the card.
    if (article && !postContent) {
      const legacyRoot = article.querySelector('.post-header') || article;
      const legacyNodes = Array.from(legacyRoot.childNodes);
      const heading = document.createElement('header');
      heading.className = 'post-header';
      heading.innerHTML = '<h1 class="post-title">संत तुकाराम महाराज चरित्र</h1>';
      postContent = document.createElement('div');
      postContent.className = 'post-content charitra-content';
      const normalizedEntry = document.createElement('div');
      normalizedEntry.className = 'entry-content clear';
      legacyNodes.forEach((node) => normalizedEntry.appendChild(node));
      postContent.innerHTML = getAbhangPostActionsMarkup();
      postContent.appendChild(normalizedEntry);
      if (legacyRoot !== article) legacyRoot.remove();
      article.prepend(heading);
      article.appendChild(postContent);
    }

    let entry = postContent?.querySelector('.entry-content');
    if (!entry && isEknathBiography) {
      entry = postContent?.querySelector('.verse_style');
      entry?.classList.add('entry-content', 'clear');
    }
    if (!entry && (isNivruttinathBiography || isLegacySaintBiography)) {
      entry = postContent?.querySelector('[itemprop="text"]');
      if (!entry && isLegacySaintBiography) entry = postContent?.querySelector('.verse_style');
      entry?.classList.add('entry-content', 'clear');
    }
    let actions = postContent?.querySelector('.abhang-post-actions');
    if (!actions && article && postContent) {
      // The generic post formatter runs before the biography formatter and
      // places an action bar after `.post-content`. Biography pages add their
      // action bar inside the reading card, so remove that earlier duplicate.
      Array.from(article.children).forEach((child) => {
        if (child.classList?.contains('abhang-post-actions')) child.remove();
      });
    }
    if (postContent && entry && !actions) {
      entry.insertAdjacentHTML('beforeend', getAbhangPostActionsMarkup());
      actions = entry.querySelector('.abhang-post-actions');
    }
    if (!postContent || !entry || entry.classList.contains('charitra-reading-card')) return;

    document.body.classList.add('saint-charitra-card-page');
    if (path.includes('/sants/dnyaneshwar/charitra/')) {
      document.body.classList.add('dnyaneshwar-charitra-page');
    }
    if (isEknathBiography) document.body.classList.add('eknath-charitra-page');
    if (isNivruttinathBiography) document.body.classList.add('nivruttinath-charitra-page');
    if (isLegacySaintBiography) document.body.classList.add('legacy-saint-charitra-page');
    if (path.includes('/sants/muktabai/sant-muktabai/')) {
      document.body.classList.add('muktabai-charitra-page');
    }
    entry.classList.add('charitra-reading-card');

    entry.querySelectorAll('hr').forEach((divider) => divider.remove());
    entry.querySelectorAll('h2, h3').forEach((heading) => heading.classList.add('charitra-section-heading'));
    entry.querySelectorAll('p').forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      paragraph.classList.add('charitra-paragraph');
      if (/^माझा मराठाचि बोलू कौतुके/.test(text)) paragraph.classList.add('charitra-quote');
    });

    if (document.body.classList.contains('tukaram-charitra-page')
      || document.body.classList.contains('muktabai-charitra-page')
      || isEknathBiography) {
      entry.querySelectorAll('p, p *, h2, h2 *, h3, h3 *, li, li *').forEach((node) => {
        node.style.setProperty('text-align', 'center', 'important');
        node.style.setProperty('text-align-last', 'center', 'important');
      });
      entry.querySelectorAll('ul, ol').forEach((list) => {
        list.style.setProperty('margin-left', 'auto', 'important');
        list.style.setProperty('margin-right', 'auto', 'important');
        list.style.setProperty('padding-left', '0', 'important');
        list.style.setProperty('text-align', 'center', 'important');
        list.style.setProperty('list-style-position', 'inside', 'important');
      });
    }

    if (actions) entry.appendChild(actions);
  };

  formatDnyaneshwarCharitraPage();

  const formatGoraKumbharSangitPage = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/gora-kumbhar/gora-kumbhar-sangit/')) return;

    const article = document.querySelector('.post-article, .abhang-post');
    const postContent = article?.querySelector('.post-content');
    const entry = postContent?.querySelector('.verse_style [itemprop="text"]')
      || postContent?.querySelector('.verse_style');
    if (!article || !postContent || !entry || entry.dataset.goraSangitCards === 'true') return;

    const candidates = Array.from(entry.querySelectorAll(':scope > p')).filter((paragraph) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      return /^[१-६1-6](?:\s|$)/.test(text) && paragraph.querySelector('br');
    });
    if (!candidates.length) return;

    entry.dataset.goraSangitCards = 'true';
    entry.classList.add('entry-content', 'clear', 'namdev-gatha-card-list-host');
    document.body.classList.add('namdev-gatha-multi-card-page', 'gora-sangit-card-page');
    const list = document.createElement('div');
    list.className = 'namdev-gatha-section-list gora-sangit-section-list';

    candidates.forEach((paragraph, index) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      const number = text.match(/^([१-६1-6])(?:\s|$)/)?.[1]
        || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
      const verse = paragraph.cloneNode(true);
      verse.className = 'namdev-gatha-verse-block';
      verse.removeAttribute('style');
      verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
      const walker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
      let firstTextNode = walker.nextNode();
      while (firstTextNode && !normalizeText(firstTextNode.textContent || '')) firstTextNode = walker.nextNode();
      if (firstTextNode) firstTextNode.textContent = (firstTextNode.textContent || '').replace(/^\s*[१-६1-6]\s*/, '');
      verse.querySelector('br')?.remove();

      const card = document.createElement('article');
      card.className = 'namdev-gatha-section-card gora-sangit-section-card';
      card.id = `gora-kumbhar-sangit-${index + 1}`;
      const badge = document.createElement('span');
      badge.className = 'namdev-gatha-section-number';
      badge.textContent = `संगीत ${number}`;
      const content = document.createElement('div');
      content.className = 'namdev-gatha-section-content';
      content.appendChild(verse);
      card.append(badge, content);
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `संगीत ${number}`));
      list.appendChild(card);
    });

    article.querySelector('.abhang-action-toolbar')?.remove();
    postContent.querySelector(':scope > .abhang-post-actions')?.remove();
    entry.replaceChildren(list);
  };

  formatGoraKumbharSangitPage();

  const formatRohidasLiteraturePages = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    const slug = path.match(/\/sants\/rohidas\/([^/]+)\//)?.[1] || '';
    if (!['rohidas-dohe', 'rohidas-pade', 'rohidas-pothi', 'rohidas-shabd'].includes(slug)) return;

    const article = document.querySelector('.post-article, .abhang-post');
    const postContent = article?.querySelector('.post-content');
    const entry = postContent?.querySelector('.verse_style [itemprop="text"]')
      || postContent?.querySelector('.verse_style');
    if (!article || !postContent || !entry || entry.dataset.rohidasFormatted === 'true') return;
    entry.dataset.rohidasFormatted = 'true';
    article.querySelector('.abhang-action-toolbar')?.remove();
    article.querySelector(':scope > .abhang-post-actions')?.remove();
    postContent.querySelector(':scope > .abhang-post-actions')?.remove();

    if (slug === 'rohidas-pothi') {
      document.body.classList.add('haripath-meaning-normal-page', 'rohidas-pothi-page');
      const card = document.createElement('div');
      card.className = 'haripath-complete-card rohidas-pothi-card';
      Array.from(entry.children).forEach((node) => {
        const text = normalizeText(node.textContent || '');
        if (node.matches('hr') || /संत रोहिदास पोथी समाप्त/.test(text) || !text) return;
        node.removeAttribute('style');
        node.querySelectorAll?.('[style]').forEach((element) => element.removeAttribute('style'));
        card.appendChild(node);
      });
      card.insertAdjacentHTML('beforeend', getAbhangPostActionsMarkup());
      postContent.replaceChildren(card);
      return;
    }

    document.body.classList.add('namdev-gatha-multi-card-page', 'rohidas-literature-card-page');
    entry.classList.add('entry-content', 'clear', 'namdev-gatha-card-list-host');
    const list = document.createElement('div');
    list.className = 'namdev-gatha-section-list rohidas-section-list';

    if (slug === 'rohidas-dohe') {
      const headings = Array.from(entry.querySelectorAll(':scope > p')).filter((paragraph) =>
        /^संत रोहिदास दोहे\s*[–—-]\s*[०-९0-9]+$/.test(normalizeText(paragraph.textContent || ''))
      );
      headings.forEach((heading, index) => {
        const headingText = normalizeText(heading.textContent || '');
        const number = headingText.match(/([०-९0-9]+)$/)?.[1]
          || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
        const source = heading.nextElementSibling;
        if (!source || !source.matches('p')) return;
        const verse = source.cloneNode(true);
        verse.className = 'namdev-gatha-verse-block';
        verse.removeAttribute('style');
        verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card rohidas-doha-card';
        card.id = `rohidas-doha-${number}`;
        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `दोहा ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        content.style.setProperty('text-align', 'center', 'important');
        verse.style.setProperty('text-align', 'center', 'important');
        verse.querySelectorAll('p, strong, span, div').forEach((element) => {
          element.style.setProperty('text-align', 'center', 'important');
        });
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `दोहा ${number}`));
        list.appendChild(card);
      });
    } else if (slug === 'rohidas-pade') {
      const headings = Array.from(entry.querySelectorAll(':scope > p')).filter((paragraph) =>
        /^[०-९0-9]+[.)]\s*/.test(normalizeText(paragraph.textContent || '')) && paragraph.querySelector('strong')
      );
      headings.forEach((heading, index) => {
        const headingText = normalizeText(heading.textContent || '');
        const number = headingText.match(/^([०-९0-9]+)/)?.[1]
          || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
        const source = heading.nextElementSibling;
        if (!source || !source.matches('p')) return;
        const verse = source.cloneNode(true);
        verse.className = 'namdev-gatha-verse-block';
        verse.removeAttribute('style');
        verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card rohidas-pad-card';
        card.id = `rohidas-pad-${number}`;
        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `पद ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `पद ${number}`));
        list.appendChild(card);
      });
    } else {
      const poems = [];
      let currentPoem = null;
      Array.from(entry.querySelectorAll(':scope > p')).forEach((paragraph) => {
        const clone = paragraph.cloneNode(true);
        clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
        (clone.textContent || '').split(/\n+/).map((line) => normalizeText(line)).filter(Boolean)
          .forEach((line) => {
            const marker = line.match(/^([०-९0-9]+)[.)]\s*(.+)$/);
            if (marker) {
              if (currentPoem) poems.push(currentPoem);
              currentPoem = { number: marker[1], title: marker[2], lines: [] };
              return;
            }
            if (!currentPoem) return;
            if (!currentPoem.lines.length && line === currentPoem.title) return;
            currentPoem.lines.push(line);
          });
      });
      if (currentPoem) poems.push(currentPoem);

      poems.forEach((poem, index) => {
        const verse = document.createElement('p');
        verse.className = 'namdev-gatha-verse-block';
        poem.lines.forEach((line, lineIndex) => {
          if (lineIndex) verse.appendChild(document.createElement('br'));
          verse.appendChild(document.createTextNode(line));
        });
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card rohidas-shabd-card';
        card.id = `rohidas-kavita-${index + 1}`;
        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `कविता ${poem.number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `कविता ${poem.number}`));
        list.appendChild(card);
      });
    }

    entry.replaceChildren(list);
  };

  formatRohidasLiteraturePages();

  const formatNilobarayLiteraturePages = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    const slug = path.match(/\/sants\/nilobaray\/sahitya\/([^/]+)\//)?.[1] || '';
    const labels = {
      manglacharan: 'मंगलाचरण',
      balkrida: 'बालक्रीडा',
      nilobarai: 'अभंग',
      nilobaray: 'कृष्णचरित्र',
      gaulani: 'गौळण',
      virhani: 'विरहिणी',
      'nilobaray-dnyanpar': 'ज्ञानपर',
      'nilobaray-changdev-charitra': 'प्रकरण',
      'nilobaray-changdev-charitra-2': 'प्रकरण',
      'nilobaray-kala': 'काला',
      'nilobaray-khel': 'खेळ',
      'nilobaray-lalit': 'लळित',
      pandharimahatyma: 'पंढरीमाहात्म्य'
    };
    const numberedSection = slug.match(/^nilobaray-(\d+)$/);
    const numberedSectionValue = numberedSection ? Number(numberedSection[1]) : 0;
    if (numberedSectionValue >= 4 && numberedSectionValue <= 23) {
      labels[slug] = 'अभंग';
    }
    if (!labels[slug]) return;

    const article = document.querySelector('.abhang-post, .post-article');
    const postContent = article?.querySelector('.post-content');
    const entry = postContent?.querySelector('.entry-content')
      || postContent?.querySelector('.verse_style [itemprop="text"]')
      || postContent?.querySelector('.verse_style');
    if (!article || !postContent || !entry || entry.dataset.nilobarayCards === 'true') return;

    const verses = Array.from(entry.querySelectorAll(':scope > p')).filter((paragraph) =>
      /^[०-९0-9]+[.)]?\s*/.test(normalizeText(paragraph.innerText || paragraph.textContent || ''))
    );
    if (!verses.length) return;

    const verseNumber = (paragraph) => {
      const rawNumber = normalizeText(paragraph.innerText || paragraph.textContent || '')
        .match(/^([०-९0-9]+)/)?.[1] || '0';
      return Number(rawNumber.replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit))));
    };
    verses.sort((first, second) => verseNumber(first) - verseNumber(second));

    entry.dataset.nilobarayCards = 'true';
    entry.classList.add('entry-content', 'clear', 'namdev-gatha-card-list-host');
    document.body.classList.add('namdev-gatha-multi-card-page', 'nilobaray-literature-card-page');
    if (slug === 'nilobaray-21') {
      document.body.classList.add('nilobaray-single-long-abhang-page');
    }
    const list = document.createElement('div');
    list.className = `namdev-gatha-section-list nilobaray-${slug}-section-list`;

    verses.forEach((paragraph, index) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      const explicitNumber = text.match(/^([०-९0-9]+)[.)]?\s*/)?.[1];
      const number = explicitNumber
        || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
      const verse = paragraph.cloneNode(true);
      verse.className = 'namdev-gatha-verse-block';
      verse.removeAttribute('style');
      verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
      const leadingNumber = (verse.textContent || '').match(/^\s*[०-९0-9]+\s*[.)]?\s*/u)?.[0] || '';
      if (leadingNumber) {
        let charactersToRemove = leadingNumber.length;
        const walker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode && charactersToRemove > 0) {
          const nodeText = textNode.nodeValue || '';
          const removeCount = Math.min(charactersToRemove, nodeText.length);
          textNode.nodeValue = nodeText.slice(removeCount);
          charactersToRemove -= removeCount;
          textNode = walker.nextNode();
        }
        verse.querySelectorAll('.marathi-digit-glyph:empty').forEach((element) => element.remove());
      }

      const card = document.createElement('article');
      card.className = `namdev-gatha-section-card nilobaray-${slug}-card`;
      card.id = `nilobaray-${slug}-${index + 1}`;
      const badge = document.createElement('span');
      badge.className = 'namdev-gatha-section-number';
      badge.textContent = `${labels[slug]} ${number}`;
      const content = document.createElement('div');
      content.className = 'namdev-gatha-section-content';
      const centeredVerse = document.createElement('div');
      centeredVerse.className = 'nilobaray-centered-verse';
      if (slug === 'nilobaray-21') {
        card.classList.add('nilobaray-single-long-abhang-card');
        const stanzaList = document.createElement('div');
        stanzaList.className = 'nilobaray-long-abhang-stanzas';
        let stanza = document.createElement('p');
        stanza.className = 'nilobaray-long-abhang-stanza';
        Array.from(verse.childNodes).forEach((node) => {
          if (node.nodeName === 'BR') {
            if (normalizeText(stanza.textContent || '')) stanzaList.appendChild(stanza);
            stanza = document.createElement('p');
            stanza.className = 'nilobaray-long-abhang-stanza';
          } else {
            stanza.appendChild(node.cloneNode(true));
          }
        });
        if (normalizeText(stanza.textContent || '')) stanzaList.appendChild(stanza);
        centeredVerse.appendChild(stanzaList);
      } else {
        centeredVerse.appendChild(verse);
      }
      content.appendChild(centeredVerse);
      card.append(badge, content);
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `${labels[slug]} ${number}`));
      list.appendChild(card);
    });

    article.querySelector('.abhang-action-toolbar')?.remove();
    postContent.querySelector(':scope > .abhang-post-actions')?.remove();
    entry.replaceChildren(list);
  };

  formatNilobarayLiteraturePages();

  const formatEknathLegacyLiteraturePages = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    const slug = path.match(/\/sants\/eknath\/([^/]+)\//)?.[1] || '';
    const literatureSlugs = [
      'sant-eknath-gaulani', 'eknath-bharud', 'chatushloki-bhagwat',
      'hastaamalak', 'shukashtak', 'chiranjivpad', 'anandlahari',
      'swatmasukh', 'sant-eknath-arti', 'shree-eknathshashti'
    ];
    const isRukminiPrasang = /^rukminiswayamwar-prasang-/.test(slug);
    if (!literatureSlugs.includes(slug) && !isRukminiPrasang) return;

    const article = document.querySelector('.post-article, .abhang-post');
    const postContent = article?.querySelector('.post-content') || article;
    let entry = postContent?.querySelector('.entry-content');
    if (!entry) entry = postContent?.querySelector('.verse_style');
    if (!entry && slug === 'shree-eknathshashti') entry = article;
    if (!article || !postContent || !entry || entry.dataset.eknathReadingCard === 'true') return;

    entry.dataset.eknathReadingCard = 'true';
    entry.classList.add('entry-content', 'clear', 'eknath-reading-card');
    document.body.classList.add('eknath-literature-card-page');
    const sourceRoot = entry.querySelector(':scope > [itemprop="text"]') || entry;
    const getSectionGroups = () => {
      const groups = [];
      let currentGroup = [];
      Array.from(sourceRoot.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('hr')) {
          if (normalizeText(currentGroup.map((item) => item.textContent || '').join(' '))) groups.push(currentGroup);
          currentGroup = [];
          return;
        }
        currentGroup.push(node);
      });
      if (normalizeText(currentGroup.map((item) => item.textContent || '').join(' '))) groups.push(currentGroup);
      return groups;
    };

    if (slug === 'sant-eknath-gaulani') {
      document.body.classList.add('namdev-gatha-multi-card-page', 'eknath-gaulani-card-page');
      entry.classList.add('namdev-gatha-card-list-host');
      const gaulani = Array.from(sourceRoot.querySelectorAll(':scope > p')).filter((paragraph) =>
        normalizeText(paragraph.textContent || '')
      );
      const list = document.createElement('div');
      list.className = 'namdev-gatha-section-list eknath-gaulani-section-list';

      gaulani.forEach((paragraph, index) => {
        const rawText = normalizeText(paragraph.textContent || '');
        const foundNumber = rawText.match(/^([०-९0-9]+)\s*[.)।-]?\s*/)?.[1];
        const displayNumber = foundNumber || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card eknath-gaulani-card';
        card.id = `eknath-gaulan-${index + 1}`;

        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `गौळण ${displayNumber}`;

        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content eknath-gaulani-content';
        const verse = paragraph.cloneNode(true);
        verse.className = 'namdev-gatha-verse-block eknath-gaulani-verse';
        verse.removeAttribute('style');
        verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
        const leadingNumber = (verse.textContent || '').match(/^\s*[०-९0-9]+\s*[.)।-]?\s*/u)?.[0] || '';
        if (leadingNumber) {
          let charactersToRemove = leadingNumber.length;
          const textWalker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
          let textNode = textWalker.nextNode();
          while (textNode && charactersToRemove > 0) {
            const text = textNode.nodeValue || '';
            const removeCount = Math.min(charactersToRemove, text.length);
            textNode.nodeValue = text.slice(removeCount);
            charactersToRemove -= removeCount;
            textNode = textWalker.nextNode();
          }
          verse.querySelectorAll('.marathi-digit-glyph:empty').forEach((element) => element.remove());
        }
        content.appendChild(verse);

        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `एकनाथांची गौळण ${displayNumber}`));
        list.appendChild(card);
      });

      postContent.querySelector(':scope > .abhang-post-actions')?.remove();
      entry.replaceChildren(list);
      return;
    }

    if (slug === 'hastaamalak') {
      document.body.classList.add('namdev-gatha-multi-card-page');
      entry.classList.add('namdev-gatha-card-list-host');
      const groups = [];
      let currentGroup = [];
      Array.from(sourceRoot.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('hr')) {
          if (normalizeText(currentGroup.map((item) => item.textContent || '').join(' '))) {
            groups.push(currentGroup);
          }
          currentGroup = [];
          return;
        }
        currentGroup.push(node);
      });
      if (normalizeText(currentGroup.map((item) => item.textContent || '').join(' '))) {
        groups.push(currentGroup);
      }

      const list = document.createElement('div');
      list.className = 'namdev-gatha-section-list hastaamalak-shlok-list';
      groups.slice(0, 6).forEach((nodes, index) => {
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card hastaamalak-shlok-card';
        card.id = `hastaamalak-shlok-${index}`;
        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        const number = String(index).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
        badge.textContent = index === 0 ? 'आरंभ' : `श्लोक ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content hastaamalak-shlok-content';

        nodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.matches('h2')) return;
          const text = normalizeText(node.textContent || '');
          if (/^हस्तामलक\s+समाप्त$/.test(text)) return;
          if (node.nodeType === Node.ELEMENT_NODE) {
            node.removeAttribute('style');
            node.querySelectorAll?.('[style]').forEach((element) => element.removeAttribute('style'));
          }
          content.appendChild(node);
        });

        card.append(badge, content);
        card.insertAdjacentHTML(
          'beforeend',
          getAbhangItemActionsMarkup(card.id, index === 0 ? 'हस्तामलक आरंभ' : `हस्तामलक श्लोक ${number}`)
        );
        list.appendChild(card);
      });

      postContent.querySelector(':scope > .abhang-post-actions')?.remove();
      entry.replaceChildren(list);
      return;
    }

    if (['shukashtak', 'swatmasukh', 'chatushloki-bhagwat', 'chiranjivpad'].includes(slug)) {
      document.body.classList.add('namdev-gatha-multi-card-page');
      entry.classList.add('namdev-gatha-card-list-host');
      const sectionLimits = { shukashtak: 11, swatmasukh: 22, 'chatushloki-bhagwat': 56, chiranjivpad: 44 };
      const groups = getSectionGroups().slice(0, sectionLimits[slug]);
      const list = document.createElement('div');
      list.className = `namdev-gatha-section-list eknath-${slug}-section-list`;

      groups.forEach((nodes, index) => {
        const number = String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
        const rawTitle = normalizeText(nodes.find((node) =>
          node.nodeType === Node.ELEMENT_NODE && node.matches('h2, p') && node.querySelector('strong')
        )?.textContent || '');
        let label = `भाग ${number}`;
        if (slug === 'chiranjivpad') label = `पद ${number}`;
        if (slug === 'shukashtak') {
          const shlokNumber = rawTitle.match(/श्लोक\s*([०-९0-9]+)/)?.[1];
          label = shlokNumber ? `श्लोक ${shlokNumber}` : rawTitle.replace(/^शुकाष्टक\s*[–—-]\s*/, '') || `भाग ${number}`;
        }

        const card = document.createElement('article');
        card.className = `namdev-gatha-section-card eknath-section-card eknath-${slug}-card`;
        card.id = `eknath-${slug}-${index + 1}`;
        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = label;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content eknath-section-content';
        if (['swatmasukh', 'chatushloki-bhagwat'].includes(slug) && rawTitle) {
          const heading = document.createElement('h3');
          heading.className = 'eknath-section-title';
          heading.textContent = rawTitle.replace(/^(?:स्वात्मसुख|चतुःश्लोकी भागवत)\s*[–—-]\s*/, '');
          content.appendChild(heading);
        }

        nodes.forEach((node, nodeIndex) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.matches('h2')) return;
          const text = normalizeText(node.textContent || '');
          if (!text || /(?:समाप्त|^वाकीभ$)/.test(text)) return;
          if (node.nodeType === Node.ELEMENT_NODE) {
            node.removeAttribute('style');
            node.querySelectorAll?.('[style]').forEach((element) => element.removeAttribute('style'));
            if (slug === 'chiranjivpad' && node.matches('p')) {
              node.classList.add(node.querySelector('strong, b') ? 'eknath-section-verse' : 'eknath-section-meaning');
            }
          }
          content.appendChild(node);
        });

        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, label));
        list.appendChild(card);
      });

      postContent.querySelector(':scope > .abhang-post-actions')?.remove();
      entry.replaceChildren(list);
      return;
    }

    entry.querySelectorAll('hr').forEach((divider) => divider.remove());
    entry.querySelectorAll('p').forEach((paragraph) => {
      if (!normalizeText(paragraph.textContent || '')) return;
      if (/समाप्त/.test(normalizeText(paragraph.textContent || ''))) {
        paragraph.remove();
        return;
      }
      paragraph.classList.add('eknath-reading-paragraph');
      paragraph.removeAttribute('style');
      paragraph.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
    });

    postContent.querySelector(':scope > .abhang-post-actions')?.remove();
    if (!entry.querySelector(':scope > .abhang-post-actions')) {
      entry.insertAdjacentHTML('beforeend', getAbhangPostActionsMarkup());
    }
  };

  formatEknathLegacyLiteraturePages();

  const formatEknathiBhagwatChapterPages = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    const slug = path.match(/\/sants\/eknath\/([^/]+)\//)?.[1] || '';
    const chapterSlugs = [
      'adhyay-pahila', 'eknathi-bhagvat-adhyay-dusra', 'adhyay-tisara',
      'adhyay-choutha', 'adhyay-pachava', 'adhyay-sahava', 'adhyay-satava',
      'adhyay-athva', 'chapter-nine', 'adhyay-dahava', 'chapter-eleven',
      'adhyay-barava', 'adhyay-tera', 'adhyay-chaudava', 'adhyay-pandhrava',
      'adhyay-solava', 'adhyay-satrava', 'adhyay-athrava', 'adhyay-ekunvis',
      'adhyay-vis', 'adhyay-ekvis', 'adhyay-bavis', 'adhyay-teviswa',
      'adhyay-chovis', 'adhyay-panchvis', 'adhyay-savvis', 'adhyay-sattavis',
      'adhyay-atthavis', 'adhyay-ekuntees', 'adhyay-tisawa', 'adhyay-ektisawa'
    ];
    if (!chapterSlugs.includes(slug)) return;

    const article = document.querySelector('.post-article, .abhang-post');
    const postContent = article?.querySelector('.post-content') || article;
    let entry = postContent?.querySelector('.entry-content, .verse_style, [itemprop="text"]');
    if (!article || !postContent || !entry || entry.dataset.eknathiChapterCard === 'true') return;
    if (entry.matches('.verse_style')) entry = entry.querySelector(':scope > [itemprop="text"]') || entry;

    entry.querySelectorAll('h1, h2, h3, h4, p').forEach((element) => {
      const text = normalizeText(element.textContent || '');
      if (
        /कृष्णार्पणमस्तु/.test(text)
        || /इति श्री.*भागवते/.test(text)
        || /^एकनाथी\s+भागवत\s+अध्याय\s*[०-९0-9]+(?:\s*[–—-]?\s*(?:आरंभ|अर्थासहित))?\s*$/.test(text)
        || /^\(?ओं?व्या\s*[०-९0-9]+\s*ते\s*[०-९0-9]+\)?\s*$/.test(text)
      ) element.remove();
    });

    const hasNumberedVerses = /॥\s*[०-९0-9]+\s*॥/.test(normalizeText(entry.textContent || ''));
    if (!hasNumberedVerses) {
      document.body.classList.add('eknathi-bhagwat-missing-page');
      postContent.querySelector(':scope > .abhang-post-actions')?.remove();
      const unavailable = document.createElement('div');
      unavailable.className = 'dnyaneshwari-chapter-card eknathi-missing-card';
      unavailable.innerHTML = '<p>या अध्यायाचा प्रमाणित ओवी व अर्थ मजकूर सध्या उपलब्ध नाही.</p>';
      unavailable.insertAdjacentHTML('beforeend', getAbhangPostActionsMarkup());
      postContent.replaceChildren(unavailable);
      return;
    }

    entry.dataset.eknathiChapterCard = 'true';
    document.body.classList.add('dnyaneshwari-chapter-card-page', 'eknathi-bhagwat-chapter-page');
    entry.classList.add('dnyaneshwari-chapter-card');
    postContent.querySelector(':scope > .abhang-post-actions')?.remove();
    entry.querySelectorAll('hr').forEach((divider) => divider.remove());

    const tokens = [];
    Array.from(entry.children).forEach((element) => {
      if (!element.matches('p, div')) return;
      element.innerHTML.split(/<br\s*\/?\s*>/i).forEach((html) => {
        const holder = document.createElement('div');
        holder.innerHTML = html;
        const text = normalizeText(holder.textContent || '')
          .replace(/^श्रीभगवानुवाच\s*[-–—:।]?\s*/, '')
          .trim();
        if (
          !text
          || /^ref:|समाप्त/.test(text)
          || /^इति श्री.*भागवते/.test(text)
          || /^(?:परमहंस)?संहितायां.*अध्यायः/.test(text)
          || /^एकाकारटीकायां/.test(text)
        ) return;
        tokens.push({
          text,
          isVerse: Boolean(holder.querySelector('strong, b')) || /[।॥]/.test(text),
          completesVerse: /॥\s*[०-९0-9]+\s*॥/.test(text)
        });
      });
    });

    const rebuilt = document.createDocumentFragment();
    let currentPair = null;
    const startPair = () => ({ verseLines: [], meaningLines: [], verseComplete: false });
    const flushPair = () => {
      if (!currentPair || (!currentPair.verseLines.length && !currentPair.meaningLines.length)) return;
      const pair = document.createElement('section');
      pair.className = 'eknathi-ovi-pair';
      if (currentPair.verseLines.length) {
        const ovi = document.createElement('div');
        ovi.className = 'ovi';
        currentPair.verseLines.forEach((text) => {
          const line = document.createElement('div');
          line.textContent = text;
          ovi.appendChild(line);
        });
        pair.appendChild(ovi);
      }
      if (currentPair.meaningLines.length) {
        const meaning = document.createElement('p');
        meaning.className = 'oviar';
        meaning.textContent = currentPair.meaningLines.join(' ');
        pair.appendChild(meaning);
      }
      rebuilt.appendChild(pair);
      currentPair = null;
    };

    tokens.forEach((token) => {
      if (token.isVerse) {
        if (!currentPair) currentPair = startPair();
        if (currentPair.meaningLines.length || currentPair.verseComplete) {
          flushPair();
          currentPair = startPair();
        }
        currentPair.verseLines.push(token.text);
        if (token.completesVerse) currentPair.verseComplete = true;
      } else {
        if (!currentPair) currentPair = startPair();
        currentPair.meaningLines.push(token.text);
      }
    });
    flushPair();

    entry.replaceChildren(rebuilt);
    entry.insertAdjacentHTML('beforeend', getAbhangPostActionsMarkup());
  };

  formatEknathiBhagwatChapterPages();

  const formatBhavarthRamayanChapterPages = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!/\/sants\/eknath\/bhawarth-ramayan-.*adhyay-[^/]+\//.test(path)) return;

    const article = document.querySelector('.post-article, .abhang-post');
    const postContent = article?.querySelector('.post-content') || article;
    let entry = postContent?.querySelector('.entry-content, .verse_style, [itemprop="text"]');
    if (!article || !postContent || !entry || entry.dataset.bhavarthRamayanCard === 'true') return;
    if (entry.matches('.verse_style')) entry = entry.querySelector(':scope > [itemprop="text"]') || entry;

    entry.dataset.bhavarthRamayanCard = 'true';
    document.body.classList.add('bhavarth-ramayan-chapter-page');
    postContent.querySelector(':scope > .abhang-post-actions')?.remove();

    const paragraphs = Array.from(entry.querySelectorAll('p'));
    const verseParagraphs = paragraphs.filter((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      return /[।॥]/.test(text) && !/^ref:/.test(text);
    });

    const card = document.createElement('div');
    card.className = 'dnyaneshwari-chapter-card bhavarth-ramayan-reading-card';
    if (!verseParagraphs.length) {
      card.classList.add('bhavarth-ramayan-missing-card');
      card.innerHTML = '<p>या अध्यायाचा प्रमाणित ओवी मजकूर सध्या उपलब्ध नाही.</p>';
    } else {
      paragraphs.forEach((paragraph) => {
        const text = normalizeText(paragraph.textContent || '');
        if (!text || /^ref:|भावार्थरामायण.*भावार्थरामायण|संत साहित्य|©/.test(text)) return;
        paragraph.removeAttribute('style');
        paragraph.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
        if (paragraph.classList.contains('bhavarth-ramayan-source-heading')) {
          paragraph.className = 'bhavarth-ramayan-source-heading';
        } else if (/[।॥]/.test(text)) {
          paragraph.className = 'bhavarth-ramayan-ovi';
        } else {
          paragraph.className = 'bhavarth-ramayan-topic';
        }
        card.appendChild(paragraph);
      });
    }

    card.insertAdjacentHTML('beforeend', getAbhangPostActionsMarkup());
    postContent.replaceChildren(card);
  };

  formatBhavarthRamayanChapterPages();

  const sortBhavarthRamayanChapterLinks = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/eknath/bhavarth-ramayan/')) return;

    document.querySelector(
      '.tukaram-landing-container .tukaram-col:first-child > .tukaram-heading'
    )?.remove();

    const devanagariToAscii = (value = '') => Number(
      [...value].map((char) => {
        const index = '०१२३४५६७८९'.indexOf(char);
        return index >= 0 ? String(index) : char;
      }).join('').replace(/[^0-9]/g, '')
    );

    document.querySelectorAll('.tukaram-links-2col').forEach((grid) => {
      const links = Array.from(grid.querySelectorAll(':scope > a.tukaram-link'));
      links.sort((first, second) =>
        devanagariToAscii(first.textContent) - devanagariToAscii(second.textContent)
      );
      links.forEach((link) => grid.appendChild(link));
    });
  };

  sortBhavarthRamayanChapterLinks();

  const formatEknathHaripathPage = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/eknath/sant-eknath-haripath/')) return;

    const article = document.querySelector('.post-article, .abhang-post');
    const postContent = article?.querySelector('.post-content');
    const verseRoot = postContent?.querySelector('.verse_style');
    const entry = verseRoot?.querySelector(':scope > [itemprop="text"]') || verseRoot;
    if (!article || !postContent || !entry || entry.dataset.eknathHaripathCard === 'true') return;

    entry.dataset.eknathHaripathCard = 'true';
    document.body.classList.add('eknath-haripath-page', 'haripath-meaning-normal-page');
    entry.classList.add('haripath-complete-card', 'eknath-haripath-card');
    const list = document.createElement('div');
    list.className = 'abhang-readable-list';
    Array.from(entry.querySelectorAll('p')).forEach((paragraph, index) => {
      const text = normalizeText(paragraph.textContent || '');
      if (!text || !/[।॥]/.test(text)) return;
      const lines = (paragraph.innerText || paragraph.textContent || '')
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter(Boolean);
      if (!lines.length) return;
      const explicitNumber = lines[0].match(/^([०-९0-9]+)[.)]?\s*/)?.[1]
        || String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
      lines[0] = lines[0].replace(/^[०-९0-9]+[.)]?\s*/, '');

      const section = document.createElement('section');
      section.className = 'abhang-readable-item';
      section.id = `eknath-haripath-${index + 1}`;
      section.dataset.abhangItem = 'true';
      section.dataset.abhangNumber = explicitNumber;
      const verseBlock = document.createElement('div');
      verseBlock.className = 'abhang-readable-verses haripath-readable-verses';
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 2) {
        const stanza = document.createElement('div');
        stanza.className = 'haripath-stanza';
        lines.slice(lineIndex, lineIndex + 2).forEach((line, pairIndex) => {
          const lineElement = document.createElement('p');
          lineElement.className = pairIndex === 1
            ? 'haripath-line haripath-ending-line'
            : 'haripath-line';
          if (lineIndex === 0 && pairIndex === 0) {
            const number = document.createElement('span');
            number.className = 'haripath-inline-number';
            number.textContent = `${explicitNumber}. `;
            lineElement.append(number, document.createTextNode(line));
          } else {
            lineElement.textContent = line;
          }
          stanza.appendChild(lineElement);
        });
        verseBlock.appendChild(stanza);
      }
      section.appendChild(verseBlock);
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `हरिपाठ ${explicitNumber}`));
      list.appendChild(section);
    });

    postContent.querySelector(':scope > .abhang-post-actions')?.remove();
    entry.replaceChildren(list);
  };

  formatEknathHaripathPage();

  const formatNivruttinathHaripathPage = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/nivruttinath/nivruti-haripath/')) return;

    const article = document.querySelector('.post-article, .abhang-post');
    const postContent = article?.querySelector('.post-content');
    const sourceRoot = postContent?.querySelector('.verse_style [itemprop="text"] > div')
      || postContent?.querySelector('.verse_style [itemprop="text"]')
      || postContent?.querySelector('.verse_style');
    if (!article || !postContent || !sourceRoot || postContent.dataset.nivruttinathHaripathCard === 'true') return;

    postContent.dataset.nivruttinathHaripathCard = 'true';
    document.body.classList.add('nivruttinath-haripath-page', 'haripath-meaning-normal-page');

    const groups = [];
    let current = [];
    Array.from(sourceRoot.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.matches('hr')) {
        if (normalizeText(current.map((item) => item.textContent || '').join(' '))) groups.push(current);
        current = [];
      } else {
        current.push(node);
      }
    });
    if (normalizeText(current.map((item) => item.textContent || '').join(' '))) groups.push(current);

    const list = document.createElement('div');
    list.className = 'abhang-readable-list';
    groups.forEach((nodes, index) => {
      const lines = [];
      nodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const text = normalizeText(node.textContent || '');
        if (!text || node.matches('h1, h2, h3, h4') || /^[०-९0-9]+[.)]?$/.test(text)
          || /^संत निवृत्तीनाथ हरिपाठ\s*[–—-]?\s*[०-९0-9]*$/.test(text)) return;
        const clone = node.cloneNode(true);
        clone.querySelectorAll?.('br').forEach((br) => br.replaceWith('\n'));
        (clone.textContent || '').split(/\n+/).map((line) => normalizeText(line)).filter(Boolean)
          .forEach((line) => lines.push(line));
      });
      if (!lines.length) return;

      const section = document.createElement('section');
      section.className = 'abhang-readable-item';
      section.id = `nivruttinath-haripath-${index + 1}`;
      const itemNumber = String(index + 1).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
      section.dataset.abhangItem = 'true';
      section.dataset.abhangNumber = itemNumber;
      const verseBlock = document.createElement('div');
      verseBlock.className = 'abhang-readable-verses haripath-readable-verses';
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 2) {
        const stanza = document.createElement('div');
        stanza.className = 'haripath-stanza';
        lines.slice(lineIndex, lineIndex + 2).forEach((line, pairIndex) => {
          const lineElement = document.createElement('p');
          lineElement.className = pairIndex === 1 ? 'haripath-line haripath-ending-line' : 'haripath-line';
          if (lineIndex === 0 && pairIndex === 0) {
            const number = document.createElement('span');
            number.className = 'haripath-inline-number';
            number.textContent = `${itemNumber}. `;
            lineElement.append(number, document.createTextNode(line));
          } else {
            lineElement.textContent = line;
          }
          stanza.appendChild(lineElement);
        });
        verseBlock.appendChild(stanza);
      }
      section.appendChild(verseBlock);
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `हरिपाठ ${itemNumber}`));
      list.appendChild(section);
    });

    const card = document.createElement('div');
    card.className = 'haripath-complete-card nivruttinath-haripath-card';
    card.appendChild(list);
    article.querySelector('.abhang-action-toolbar')?.remove();
    Array.from(article.children).forEach((child) => {
      if (child.classList?.contains('abhang-post-actions')) child.remove();
    });
    postContent.replaceChildren(card);
  };

  formatNivruttinathHaripathPage();

  const normalizeMalformedDnyaneshwariContent = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!/\/sants\/dnyaneshwar\/adhyay-(13|14)\//.test(path)) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.adhyayNormalized === 'true') return;

    const markerPattern = /॥\s*[०-९0-9]+\s*॥|[०-९]{2,3}\./;
    const isVerseText = (text = '') => (text.match(/[।॥]/g) || []).length >= 3;
    const createBlock = (text) => {
      const block = document.createElement('div');
      block.className = isVerseText(text) ? 'ovi' : 'oviar';
      const lines = text.split(/\n+/).map((line) => normalizeText(line)).filter(Boolean);
      lines.forEach((line, index) => {
        if (index) block.appendChild(document.createElement('br'));
        block.appendChild(document.createTextNode(line));
      });
      return block;
    };

    Array.from(entry.querySelectorAll('.oviar')).forEach((block) => {
      const text = block.innerText || block.textContent || '';
      if (text.length < 2000) return;

      const fragment = document.createDocumentFragment();
      const segmentPattern = /([\s\S]*?॥\s*[०-९0-9]+\s*॥)/g;
      let match;
      let segmentCount = 0;
      while ((match = segmentPattern.exec(text)) !== null) {
        const segment = normalizeText(match[1].replace(/\r/g, ''));
        if (!segment) continue;
        fragment.appendChild(createBlock(segment));
        segmentCount += 1;
      }

      if (segmentCount) {
        block.before(fragment);
        block.remove();
      }
    });

    Array.from(entry.querySelectorAll('.ovi, .oviar')).forEach((block) => {
      const text = block.innerText || block.textContent || '';
      const endMarkers = Array.from(text.matchAll(/॥\s*[०-९0-9]+\s*॥|[०-९]{2,3}\./g));
      if (endMarkers.length < 2) return;

      const fragment = document.createDocumentFragment();
      let start = 0;
      endMarkers.forEach((endMarker) => {
        const end = (endMarker.index || 0) + endMarker[0].length;
        const segment = normalizeText(text.slice(start, end));
        if (segment) fragment.appendChild(createBlock(segment));
        start = end;
      });
      const remainder = normalizeText(text.slice(start));
      if (remainder) fragment.appendChild(createBlock(remainder));

      block.before(fragment);
      block.remove();
    });

    entry.querySelectorAll('.ovi, .oviar').forEach((block) => {
      const text = normalizeText(block.textContent || '');
      block.classList.remove('ovi', 'oviar');
      block.classList.add(isVerseText(text) ? 'ovi' : 'oviar');
    });

    entry.querySelectorAll(':scope > p:not(.hdr1):not(.hdr2):not(.hdr3):not(.hdr4):not(.end)').forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      if (!markerPattern.test(text)) return;
      paragraph.replaceWith(createBlock(text));
    });

    entry.dataset.adhyayNormalized = 'true';
  };

  normalizeMalformedDnyaneshwariContent();

  const formatDnyaneshwariChapterCard = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!/\/sants\/dnyaneshwar\/adhyay-\d+\//.test(path)) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    const entry = postContent?.querySelector('.entry-content');
    const actions = postContent?.querySelector('.abhang-post-actions');
    if (!postContent || !entry || entry.classList.contains('dnyaneshwari-chapter-card')) return;

    document.body.classList.add('dnyaneshwari-chapter-card-page');
    entry.classList.add('dnyaneshwari-chapter-card');

    entry.querySelectorAll('.ovi').forEach((ovi, index) => {
      ovi.id = `ovi-${index + 1}`;
      ovi.dataset.oviNumber = String(index + 1);
    });

    if (actions) entry.appendChild(actions);
  };

  formatDnyaneshwariChapterCard();

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
  const formatDnyaneshwarGathaRangePages = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/abhang-') || path.includes('/abhang-all/')) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    const pageMain = document.querySelector('.sant-page-main') || document.body;
    const entryContent = postContent?.querySelector('.entry-content');
    const sourceRoot = entryContent?.querySelector('p strong') ? entryContent : pageMain;
    if (!postContent || !sourceRoot || postContent.querySelector('.abhang-content-list')) return;

    document.body.classList.add('abhang-list-page', 'abhang-range-page', 'dnyaneshwar-gatha-range-page');

    const devanagariDigits = '०१२३४५६७८९';
    const toDevanagari = (value = '') => String(value).replace(/[0-9]/g, (digit) => devanagariDigits[Number(digit)]);
    const normalizeGathaText = (value = '') => normalizeText(value).replace(/\s+/g, ' ').trim();
    const getTitle = () => normalizeGathaText(document.querySelector('.post-title')?.textContent || document.title.replace(/\s*[-–].*$/, ''));
    const isCategoryNote = (value = '') => /अभंग\s*[०-९0-9]+\s*(?:ते|रे|to)\s*[०-९0-9]+/i.test(value) && !/॥[०-९0-9ध्रु]+॥/.test(value);
    const getAbhangNumber = (value = '') => {
      const match = normalizeGathaText(value).match(/^([०-९0-9]+)\s*[.)]?$/);
      return match?.[1] || '';
    };
    const cleanVerseLine = (value = '') => normalizeGathaText(value)
      .replace(/\s+(॥[०-९0-9ध्रु]+॥)\s*$/, '\u00a0$1')
      .replace(/\s+(॥ध्रु०॥)\s*$/, '\u00a0$1');
    const makeParagraph = (line, className = '') => {
      const p = document.createElement('p');
      if (className) p.className = className;
      p.textContent = line;
      return p;
    };

    const items = [];
    Array.from(sourceRoot.querySelectorAll('p')).forEach((paragraph) => {
      let paragraphText = paragraph.innerText || paragraph.textContent || '';
      paragraphText = paragraphText.replace(/^\s*[^\n]*(?:अभंग\s*[०-९0-9]+\s*(?:ते|रे|to)\s*[०-९0-9]+)[^\n]*\n+/i, '');
      const text = normalizeGathaText(paragraphText);
      if (!text || isCategoryNote(text)) return;

      const firstLine = normalizeGathaText(paragraphText.split(/\r?\n/).find(Boolean) || text);
      const number = getAbhangNumber(firstLine) || getAbhangNumber(normalizeGathaText(paragraph.querySelector('strong')?.textContent || ''));
      if (!number) return;

      const lines = paragraphText
        .replace(new RegExp(`^\\s*${number}\\s*[.)]?\\s*`), '')
        .split(/\r?\n|(?<=॥[०-९0-9ध्रु]+॥)\s+/)
        .map(cleanVerseLine)
        .filter(Boolean);
      if (!lines.length) return;

      const titleLine = cleanVerseLine(lines[0]).replace(/\s*।.*$/, '').replace(/\s*॥.*$/, '').trim() || `अभंग ${number}`;
      items.push({ number, title: titleLine, lines });
    });

    if (!items.length) return;

    const oldActions = postContent.querySelector('.abhang-post-actions');
    const rangeSection = document.createElement('section');
    rangeSection.className = 'abhang-grid-section';
    rangeSection.id = 'abhang-grid';

    const inner = document.createElement('div');
    inner.className = 'abhang-grid-inner';

    const list = document.createElement('div');
    list.className = 'abhang-content-list';
    list.id = 'abhangContentList';
    list.dataset.totalCount = String(items.length);

    items.forEach((item, index) => {
      const article = document.createElement('article');
      article.className = 'abhang-content-block';
      article.id = `abhang-${item.number}`;
      article.dataset.abhangNumber = item.number;
      article.dataset.search = normalizeGathaText(`${item.number} ${toDevanagari(item.number)} ${item.title} ${item.lines.join(' ')}`);

      const header = document.createElement('header');
      header.className = 'abhang-content-header';
      const numberEl = document.createElement('span');
      numberEl.className = 'abhang-content-number';
      numberEl.textContent = `अभंग ${toDevanagari(item.number)}`;
      const titleEl = document.createElement('h3');
      titleEl.className = 'abhang-content-title';
      titleEl.textContent = item.title;
      header.append(numberEl, titleEl);

      const verses = document.createElement('div');
      verses.className = 'abhang-readable-verses';
      verses.dataset.devotionalVerse = 'true';
      item.lines.forEach((line, lineIndex) => {
        verses.appendChild(makeParagraph(line, lineIndex === 0 ? 'abhang-verse' : ''));
      });
      verses.querySelector('.abhang-verse')?.setAttribute('data-devotional-verse', 'true');

      const actions = oldActions?.cloneNode(true);
      if (actions) {
        actions.className = 'abhang-item-actions abhang-card-footer';
        actions.dataset.shareScope = 'item';
        actions.querySelectorAll('button').forEach((button) => button.setAttribute('type', 'button'));
      }

      article.append(header, verses);
      if (actions) article.appendChild(actions);
      list.appendChild(article);
    });

    inner.appendChild(list);
    const empty = document.createElement('p');
    empty.className = 'abhang-empty-state';
    empty.id = 'abhangEmptyState';
    empty.hidden = true;
    empty.textContent = 'जुळणारे अभंग सापडले नाहीत.';
    inner.appendChild(empty);
    rangeSection.appendChild(inner);

    postContent.replaceChildren(rangeSection);

    const article = postContent.closest('.abhang-post');
    if (article) {
      Array.from(article.children).forEach((child) => {
        if (!child.matches('.post-header, .post-content')) child.remove();
      });
    }

    pageMain.querySelectorAll('.elementor-section, .elementor-container, .elementor-column, .elementor-widget-wrap, .elementor-widget, .elementor-widget-container').forEach((element) => {
      if (!element.closest('.post-content')) element.remove();
    });
  };

  formatDnyaneshwarGathaRangePages();
  const formatGathaStanzaSpacing = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!/\/sants\/[^/]+\/gatha-\d+(?:\/|\.html|$)/.test(path)) return;

    const entryContent = document.querySelector('.abhang-post .entry-content');
    if (!entryContent || entryContent.dataset.gathaTypography === 'true') return;

const standaloneNumberPattern = /^[०-९0-9]+[.)]?$/u;
    Array.from(entryContent.querySelectorAll('p')).forEach((numberParagraph) => {
      const numberText = (numberParagraph.innerText || numberParagraph.textContent || '').trim();
      const verseParagraph = numberParagraph.nextElementSibling;
      if (!standaloneNumberPattern.test(numberText) || verseParagraph?.tagName !== 'P') return;
      if (!/॥/.test(verseParagraph.innerText || verseParagraph.textContent || '')) return;

      numberParagraph.innerHTML = `${numberParagraph.innerHTML.trim()}<br>${verseParagraph.innerHTML}`;
      verseParagraph.remove();
    });

    const heavyFontClasses = ['font-bold', 'font-semibold', 'font-medium', 'font-extrabold'];
    entryContent.classList.remove(...heavyFontClasses);
    entryContent.querySelectorAll('.font-bold, .font-semibold, .font-medium, .font-extrabold').forEach((element) => {
      element.classList.remove(...heavyFontClasses);
    });

    const stanzaEndPattern = /॥(?:[०-९0-9]+|ध्रु\.?|ध्रु०)॥\s*$/u;
    const gathaNumberPattern = /(?:^|\n)\s*[०-९0-9]+[.)]?(?:\s|$)/u;
    entryContent.querySelectorAll('p').forEach((paragraph) => {
      const paragraphText = paragraph.innerText || paragraph.textContent || '';
      if (!gathaNumberPattern.test(paragraphText) || !/॥/.test(paragraphText)) return;

      paragraph.classList.add('gatha-verse');
      paragraph.querySelectorAll('strong, b').forEach((boldElement) => {
        boldElement.replaceWith(...boldElement.childNodes);
      });
      paragraph.querySelectorAll('br').forEach((lineBreak) => {
        const precedingText = lineBreak.previousSibling?.textContent || '';
        if (stanzaEndPattern.test(precedingText)) {
          lineBreak.classList.add('gatha-stanza-break');
        }
      });
    });

    entryContent.dataset.gathaTypography = 'true';
    entryContent.classList.add('gatha-content');
    document.body.classList.add('gatha-typography-page');
  };

  formatGathaStanzaSpacing();

  const formatTukaramGathaCards = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const pageMatch = path.match(/\/sants\/tukaram\/gatha-(\d+)(?:\/|\.html|$)/);
    if (!pageMatch) return;

    const postContent = document.querySelector('.abhang-post .post-content');
    const entry = postContent?.querySelector('.entry-content');
    if (!postContent || !entry || entry.dataset.tukaramGathaCards === 'true') return;

    const verses = Array.from(entry.querySelectorAll('p.gatha-verse'));
    if (!verses.length) return;

    entry.dataset.tukaramGathaCards = 'true';
    entry.classList.remove('gatha-content');
    document.body.classList.remove('gatha-typography-page');
    document.body.classList.add('tukaram-gatha-card-page');

    const list = document.createElement('div');
    list.className = 'tukaram-gatha-card-list';

    verses.forEach((verse, index) => {
      const cardVerse = verse.cloneNode(true);
      const firstLine = normalizeText((verse.innerText || verse.textContent || '').split(/\r?\n/)[0]);
      const numberMatch = firstLine.match(/^([०-९0-9]+)[.)]?$/u);
      const number = numberMatch?.[1] || String(index + 1);
      const firstBreak = cardVerse.querySelector('br');

      if (numberMatch && firstBreak) {
        let node = cardVerse.firstChild;
        while (node) {
          const next = node.nextSibling;
          node.remove();
          if (node === firstBreak) break;
          node = next;
        }
      }

      cardVerse.className = 'tukaram-gatha-card-verse';
      cardVerse.removeAttribute('style');
      cardVerse.style.setProperty('display', 'table', 'important');
      cardVerse.style.setProperty('width', 'fit-content', 'important');
      cardVerse.style.setProperty('max-width', 'calc(100% - 16px)', 'important');
      cardVerse.style.setProperty('margin-left', 'auto', 'important');
      cardVerse.style.setProperty('margin-right', 'auto', 'important');
      cardVerse.style.setProperty('text-align', 'left', 'important');
      const card = document.createElement('article');
      card.className = 'tukaram-gatha-card';
      card.id = `tukaram-gatha-${pageMatch[1]}-${index + 1}`;

      const badge = document.createElement('span');
      badge.className = 'tukaram-gatha-number';
      const badgeText = document.createElement('span');
      badgeText.className = 'tukaram-gatha-label-text';
      badgeText.textContent = 'गाथा';
      const badgeNumber = document.createElement('span');
      badgeNumber.className = 'tukaram-gatha-label-number';
      badgeNumber.textContent = number;
      badge.replaceChildren(badgeText, badgeNumber);
      card.append(badge, cardVerse);
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `गाथा ${number}`));
      list.appendChild(card);
    });

    postContent.querySelector('.abhang-post-actions')?.remove();
    entry.replaceChildren(list);
  };

  formatTukaramGathaCards();

  const formatDnyaneshwarViraniPage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/virani/')) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.viraniFormatted === 'true') return;
    entry.dataset.viraniFormatted = 'true';
    document.body.classList.add('dnyaneshwar-virani-page');

    Array.from(entry.children).forEach((element) => {
      const text = normalizeText(element.textContent || '');
      if (!text) return;

      if (/^(?:संत\s+ज्ञानेश्वर\s+विराणी\s*[०-९0-9,\s]+(?:समाप्त)?|ref\s*:\s*bhavtarang)$/i.test(text)) {
        element.remove();
        return;
      }

      if (/विराणी\s*\/|विरहिणी|विरहरत्ने|विराणी\s*[०-९0-9]+\s*[–-]/.test(text)) {
        element.remove();
        return;
      }

      if (element.matches('p') && element.querySelector('strong') && /॥/.test(text)) {
        element.classList.add('virani-main-lines');
        return;
      }

      if (element.matches('p')) {
        if (text === '॥ हरि ॐ ॥') {
          element.remove();
          return;
        }
        element.classList.add('virani-meaning');
      }
    });
  };

  formatDnyaneshwarViraniPage();
  const formatAmrutanubhavPage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/amrutanubhav/')) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.amrutanubhavFormatted === 'true') return;
    entry.dataset.amrutanubhavFormatted = 'true';
    document.body.classList.add('amrutanubhav-page');
    entry.classList.add('amrutanubhav-reading-card');
    entry.style.setProperty('text-align', 'center', 'important');

    Array.from(entry.querySelectorAll('p')).forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      if (!text) return;

      // The source was transcribed from scanned PDF pages. Remove printed
      // running headers (page number + book name + "प्रकरण") that OCR mixed
      // into the literature. Real headings such as "प्रकरण दुसरें" do not
      // contain the bracket/pipe page-header separators and remain visible.
      const isPdfRunningHeader =
        (paragraph.classList.contains('hdr2') || paragraph.classList.contains('hdr3')) &&
        /प्रकरण/.test(text) &&
        (
          /[\[\]|_]/.test(text) ||
          /(?:अमृत|अगृत|अग्रत|अंगृत|अम्त|अऱृत|अृंत|अमृता|अगरता|अग्ता)/.test(text)
        );
      if (isPdfRunningHeader) {
        paragraph.remove();
        return;
      }

      paragraph.style.setProperty('text-align', 'center', 'important');
      paragraph.style.setProperty('text-align-last', 'center', 'important');
      paragraph.querySelectorAll('*').forEach((child) => {
        child.style.setProperty('text-align', 'center', 'important');
        child.style.setProperty('text-align-last', 'center', 'important');
      });

      if (paragraph.classList.contains('hdr2') || paragraph.classList.contains('hdr3')) {
        paragraph.classList.add('amrutanubhav-chapter-title');
        return;
      }

      if (paragraph.querySelectorAll('br').length >= 3 && /॥/.test(text)) {
        Array.from(paragraph.querySelectorAll('br')).forEach((br) => br.replaceWith(document.createTextNode(' ')));
        paragraph.classList.add('amrutanubhav-verse-block');
      }
    });

    const actions = document.querySelector('.abhang-post .post-content > .abhang-post-actions');
    if (actions) entry.appendChild(actions);
  };

  formatAmrutanubhavPage();
  const enforceAmrutanubhavVerseWeight = () => {
    if (!document.body.classList.contains('amrutanubhav-page')) return;
    document.querySelectorAll('.amrutanubhav-verse').forEach((verseNode) => {
      verseNode.style.setProperty('font-weight', '700', 'important');
      verseNode.style.setProperty('font-synthesis', 'none', 'important');
    });
  };
  const observeAmrutanubhavVerseWeight = () => {
    if (!document.body.classList.contains('amrutanubhav-page')) return;
    const readingCard = document.querySelector('.amrutanubhav-reading-card');
    if (!readingCard || readingCard.dataset.verseWeightObserved === 'true') return;
    readingCard.dataset.verseWeightObserved = 'true';

    const refreshVerseWeight = () => {
      enforceAmrutanubhavVerseWeight();
    };

    refreshVerseWeight();
    [0, 100, 500, 1500, 4000].forEach((delay) => window.setTimeout(refreshVerseWeight, delay));

    const verseObserver = new MutationObserver(() => {
      refreshVerseWeight();
    });

    verseObserver.observe(readingCard, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true
    });
  };

  const removeObviousOcrArtifacts = () => {
    const candidates = document.querySelectorAll([
      '.post-content p',
      '.entry-content p',
      '.amrutanubhav-verse',
      '.abhang-line',
      '.ovi-line',
      '.literature-line'
    ].join(','));

    candidates.forEach((element) => {
      const text = normalizeText(element.textContent || '');
      if (!text) return;

      const hasScanSeparator = /_{5,}/.test(text);
      const characters = Array.from(text);
      const devanagariCount = characters.filter((character) => /[\u0900-\u097F]/.test(character)).length;
      const devanagariRatio = characters.length ? devanagariCount / characters.length : 0;
      const hasWhitespace = /\s/.test(text);
      const repeatedPairs = (text.match(/(.)\1/gu) || []).length;
      const hasLongRepeat = /(.)\1{2,}/u.test(text);
      const isRepeatedOcrString =
        characters.length >= 40 &&
        !hasWhitespace &&
        devanagariRatio >= 0.82 &&
        (hasLongRepeat || repeatedPairs >= 3);

      if (hasScanSeparator || isRepeatedOcrString) {
        element.remove();
      }
    });
  };

  removeObviousOcrArtifacts();
  const formatChangdevPasashtiPage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/changdev-pasashti/')) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.changdevFormatted === 'true') return;
    entry.dataset.changdevFormatted = 'true';
    document.body.classList.add('changdev-pasashti-page');
    entry.classList.add('changdev-reading-card');
    entry.style.setProperty('text-align', 'center', 'important');

    Array.from(entry.querySelectorAll('p')).forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      if (!text) return;

      if (/^(?:सार्थ\s+चांगदेव\s+पासष्टी|श्रीज्ञानेश्वरमहाराजकृत|श्री\s+चांगदेव\s+पासष्टी|सार्थ\s+अमृतानुभव\s+आणि\s+चांगदेवपासष्टी)/.test(text)) {
        paragraph.remove();
        return;
      }

      paragraph.style.setProperty('text-align', 'center', 'important');
      paragraph.style.setProperty('text-align-last', 'center', 'important');
      paragraph.querySelectorAll('*').forEach((child) => {
        child.style.setProperty('text-align', 'center', 'important');
        child.style.setProperty('text-align-last', 'center', 'important');
      });

      if (paragraph.querySelector('b, strong') && /॥\s*[०-९0-9]+\s*॥|।\s*[०-९0-9]+\s*॥/.test(text)) {
        paragraph.classList.add('changdev-ovi-line');
        return;
      }

      paragraph.classList.add('changdev-meaning-line');
    });

    entry.querySelectorAll('hr').forEach((divider) => divider.remove());
    const actions = document.querySelector('.abhang-post .post-content > .abhang-post-actions');
    if (actions) entry.appendChild(actions);
  };

  formatChangdevPasashtiPage();
  const enforceChangdevVerseWeight = () => {
    if (!document.body.classList.contains('changdev-pasashti-page')) return;
    document.querySelectorAll('.changdev-ovi-line').forEach((verseNode) => {
      verseNode.style.setProperty('font-weight', '700', 'important');
      verseNode.style.setProperty('font-synthesis', 'none', 'important');
      verseNode.querySelectorAll('b, strong').forEach((child) => {
        child.style.setProperty('font-weight', '700', 'important');
      });
    });
  };
  enforceChangdevVerseWeight();
  [0, 100, 500, 1500, 4000].forEach((delay) => window.setTimeout(enforceChangdevVerseWeight, delay));
  const formatDnyaneshwarPasaydanPage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/pasaydan/')) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.pasaydanFormatted === 'true') return;
    entry.dataset.pasaydanFormatted = 'true';
    document.body.classList.add('dnyaneshwar-pasaydan-page');
    entry.classList.add('pasaydan-reading-card');
    entry.style.setProperty('text-align', 'center', 'important');

    Array.from(entry.querySelectorAll('p')).forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      if (!text) return;

      if (text === 'पसायदान') {
        const wrapper = paragraph.closest('.msg');
        if (wrapper && normalizeText(wrapper.textContent || '') === 'पसायदान') {
          wrapper.remove();
        } else {
          paragraph.remove();
        }
        return;
      }

      paragraph.style.setProperty('text-align', 'center', 'important');
      paragraph.style.setProperty('text-align-last', 'center', 'important');
      paragraph.querySelectorAll('*').forEach((child) => {
        child.style.setProperty('text-align', 'center', 'important');
        child.style.setProperty('text-align-last', 'center', 'important');
      });

      if (/॥\s*[०-९0-9]+\s*॥/.test(text)) {
        paragraph.classList.add('pasaydan-verse-line');
        return;
      }

      paragraph.classList.add('pasaydan-meaning-line');
    });

    const mainVerses = Array.from(entry.querySelectorAll('p.pasaydan-verse-line')).slice(0, 9);
    if (mainVerses.length) {
      const mainBlock = document.createElement('div');
      mainBlock.className = 'pasaydan-main-centered';
      mainVerses.forEach((paragraph) => {
        paragraph.classList.add('pasaydan-main-line');
        mainBlock.appendChild(paragraph);
      });
      entry.insertBefore(mainBlock, entry.firstChild);
    }

    entry.querySelectorAll('hr').forEach((divider) => divider.remove());
    entry.querySelectorAll('.pasaydan-static-centered:empty').forEach((block) => block.remove());
    const actions = document.querySelector('.abhang-post .post-content > .abhang-post-actions');
    if (actions) entry.appendChild(actions);
  };

  formatDnyaneshwarPasaydanPage();

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

  const removeDuplicatePostShareBars = () => {
    document.querySelectorAll('.abhang-post, .post-article').forEach((article) => {
      const postContent = article.querySelector(':scope > .post-content');
      if (!postContent?.querySelector('.abhang-post-actions, .abhang-item-actions')) return;

      Array.from(article.children).forEach((child) => {
        if (child.classList?.contains('abhang-post-actions')) child.remove();
      });
    });
  };

  removeDuplicatePostShareBars();

  const getPageShareUrl = () => window.location.href.split('#')[0];

  const getShortShareExcerpt = (value, maxLength = 320) => {
    const text = normalizeText(value).replace(/\s+/g, ' ');
    if (text.length <= maxLength) return text;
    const boundary = text.lastIndexOf(' ', maxLength - 1);
    return `${text.slice(0, boundary > 80 ? boundary : maxLength).trim()}…`;
  };

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
    const body = getShortShareExcerpt(
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
    const formattedText = [title, author, body, pageUrl]
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

  // --- Copy only the complete literature text (never the page URL). ---
  const getCopyContentText = (button) => {
    const actions = button.closest('.abhang-item-actions, .abhang-post-actions, .abhang-card-footer');
    const targetId = actions?.dataset?.shareTarget;
    const explicitTarget = targetId ? document.getElementById(targetId) : null;
    const contentRoot = explicitTarget || actions?.closest([
      '.abhang-content-block',
      '.abhang-readable-item',
      '.abhang-card',
      '.nilobaray-chapter-card',
      '.haripath-complete-card',
      '.post-content',
      '.abhang-post',
      '.post-article'
    ].join(', '));
    if (!contentRoot) return '';

    const preferredContent = contentRoot.matches([
      '.abhang-readable-verses',
      '.abhang-verse',
      '.devotional-verse-content',
      '.haripath-readable-verses',
      '.gatha-content',
      '.marathi-verse',
      '.ovi-content',
      '.verse_style',
      '.entry-content'
    ].join(', '))
      ? contentRoot
      : contentRoot.querySelector([
        '.abhang-readable-verses',
        '.haripath-readable-verses',
        '.devotional-verse-content',
        '.abhang-verse',
        '.gatha-content',
        '.marathi-verse',
        '.ovi-content',
        '.verse_style',
        '.entry-content'
      ].join(', '));

    const copySource = preferredContent || contentRoot;
    const cleanClone = copySource.cloneNode(true);
    cleanClone.querySelectorAll([
      '.abhang-item-actions',
      '.abhang-post-actions',
      '.abhang-card-footer',
      '.share-buttons',
      'button',
      'script',
      'style',
      '[hidden]'
    ].join(', ')).forEach((node) => node.remove());

    return normalizeText(cleanClone.innerText || cleanClone.textContent || '')
      .replace(/\n{3,}/g, '\n\n');
  };

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('.copy-abhang-btn');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();

    const contentText = getCopyContentText(btn);
    if (!contentText) {
      showToast('कॉपी करण्यासाठी मजकूर सापडला नाही.');
      return;
    }

    const copied = await copyTextToClipboard(contentText);
    if (copied) {
      showToast('मजकूर कॉपी झाला!');
      const icon = btn.querySelector('i');
      if (icon) {
        const originalClass = icon.className;
        icon.className = 'fas fa-check';
        icon.style.color = '#25d366';
        setTimeout(() => {
          icon.className = originalClass || 'far fa-copy';
          icon.style.color = '';
        }, 2000);
      }
    } else {
      showToast('कॉपी करता आली नाही. कृपया पुन्हा प्रयत्न करा.');
    }
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
  document.addEventListener('click', async (event) => {
      const btn = event.target.closest('.social-share-btn');
      if (!btn) return;
      const scope = resolveShareScope(btn);
      if (!scope) return;

      const shareData = getAbhangShareData(scope);
      const platform = btn.dataset.platform;

      if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareData.formattedText)}`, '_blank', 'noopener');
        return;
      }

      if (platform === 'facebook') {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.pageUrl)}`,
          '_blank',
          'noopener,noreferrer'
        );
        return;
      }

      if (platform === 'instagram') {
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareData.title,
              text: [shareData.author, shareData.body].filter(Boolean).join('\n\n'),
              url: shareData.pageUrl
            });
            return;
          } catch (error) {
            if (error?.name === 'AbortError') return;
          }
        }

        const copied = await copyTextToClipboard(shareData.formattedText);
        showToast(copied
          ? 'लिंक कॉपी झाले. Instagram वर शेअर करा.'
          : 'लिंक कॉपी करता आली नाही. कृपया पुन्हा प्रयत्न करा.');
        return;
      }

      if (platform === 'native') {
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareData.title,
              text: [shareData.author, shareData.body].filter(Boolean).join('\n\n'),
              url: shareData.pageUrl
            });
            return;
          } catch (error) {
            if (error?.name === 'AbortError') return;
          }
        }

        const copied = await copyTextToClipboard(shareData.formattedText);
        showToast(copied ? 'कॉपी झाले!' : 'कॉपी करता आली नाही. कृपया पुन्हा प्रयत्न करा.');
      }
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
    heroVideo.defaultMuted = true;
    heroVideo.muted = true;
    heroVideo.volume = 1;
    heroVideo.play().catch(() => {
      heroVideo.setAttribute('controls', 'controls');
    });
    updateHeroSoundToggle();
  }

  heroSoundToggle?.addEventListener('click', async () => {
    if (!heroVideo) return;
    const shouldUnmute = heroVideo.muted;

    if (shouldUnmute) {
      heroVideo.removeAttribute('muted');
      heroVideo.defaultMuted = false;
      heroVideo.muted = false;
      heroVideo.volume = 1;
    } else {
      heroVideo.defaultMuted = true;
      heroVideo.muted = true;
    }

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
    const legacyCopyLinkButton = group.querySelector('.copy-link-share-btn');
    if (legacyCopyLinkButton) {
      legacyCopyLinkButton.classList.replace('copy-link-share-btn', 'native-share-btn');
      legacyCopyLinkButton.dataset.platform = 'native';
      legacyCopyLinkButton.setAttribute('aria-label', 'शेअर करा');
      legacyCopyLinkButton.setAttribute('title', 'शेअर करा');
      legacyCopyLinkButton.innerHTML = '<i class="fas fa-share-alt"></i>';
      return;
    }
    if (group.querySelector('.native-share-btn')) return;
    group.insertAdjacentHTML('beforeend', `
      <button class="abhang-btn social-share-btn native-share-btn" data-platform="native" aria-label="शेअर करा" title="शेअर करा">
        <i class="fas fa-share-alt"></i>
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
  const removeDuplicateAbhangOpeningNumbers = () => {
    const openingNumberPattern = /^\s*[०-९0-9]+\s*[.)।:-]\s*/u;
    const firstLineSelector = [
      '.natache-line',
      '.abhang-readable-verses > p',
      '.abhang-readable-verses .abhang-verse > p',
      '.abhang-readable-verses .verse-line',
      '.abhang-readable-verses .gatha-line',
      '.abhang-readable-verses .devotional-verse-content'
    ].join(', ');

    document.querySelectorAll('.abhang-content-block').forEach((block) => {
      const firstLine = block.querySelector(firstLineSelector);
      if (!firstLine || firstLine.dataset.openingNumberCleaned === 'true') return;

      const walker = document.createTreeWalker(firstLine, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.nodeValue || !node.nodeValue.trim()) continue;
        node.nodeValue = node.nodeValue.replace(openingNumberPattern, '');
        firstLine.dataset.openingNumberCleaned = 'true';
        break;
      }
    });
  };
  const removeStrayLeadingVerseDots = () => {
    const verseRoots = document.querySelectorAll([
      '.abhang-readable-verses',
      '.abhang-verse',
      '.natache-verse',
      '.natache-line',
      '.devotional-verse-content',
      '.gatha-verse',
      '.marathi-verse',
      '.ovi'
    ].join(', '));
    const leadingDotPattern = /^(\s*)[.\u00b7\u2022]\s*(?=[\u0900-\u097F])/u;

    verseRoots.forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.nodeValue) continue;
        node.nodeValue = node.nodeValue.replace(leadingDotPattern, '$1');
      }
    });
  };
  const enforceNormalReadingWeight = () => {
    const roots = document.querySelectorAll([
      '.abhang-post-main .post-content',
      '.abhang-post-main .abhang-verse',
      '.abhang-post-main .entry-content',
      '.sant-page-main .charitra-content',
      '.sant-page-main .biography-content',
      '.sant-page-main .gatha-content',
      '.sant-page-main .aarti-content',
      '.sant-page-main .haripath-content',
      '.abhang-content-list',
      '.abhang-content-block .abhang-readable-verses',
      '.abhang-card .abhang-verse',
      '.abhang-card .abhang-content',
      '.post-article .entry-content',
      '.blog-post-content',
      '.article-content'
    ].join(', '));

    const skipSelector = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'button', 'input', 'select', 'textarea',
      'i', '.fa', '.fas', '.far', '.fab', '.fal', '.fad',
      '.post-title', '.sant-title', '.marathi-digit-glyph'
    ].join(', ');

    roots.forEach((root) => {
      const readingNodes = [root, ...root.querySelectorAll('*')];
      readingNodes.forEach((node) => {
        if (!(node instanceof HTMLElement) || node.matches(skipSelector)) return;
        if (document.body.classList.contains('amrutanubhav-page') && node.closest('.amrutanubhav-verse')) return;
        if (document.body.classList.contains('changdev-pasashti-page') && node.closest('.changdev-ovi-line')) return;
        node.style.setProperty('font-weight', '300', 'important');
        node.style.setProperty('font-synthesis', 'none', 'important');
        node.style.setProperty(
          'font-family',
          "'Vakibh Devanagari Digits', Hind, sans-serif",
          'important'
        );
      });
    });

    if (document.body.classList.contains('namdev-palne-page')) {
      const palneContainers = document.querySelectorAll(
        '.abhang-post .post-content, .abhang-post .abhang-verse, .abhang-post .entry-content'
      );
      palneContainers.forEach((node) => {
        node.style.setProperty('width', '100%', 'important');
        node.style.setProperty('max-width', '1100px', 'important');
        node.style.setProperty('margin-left', 'auto', 'important');
        node.style.setProperty('margin-right', 'auto', 'important');
        node.style.setProperty('text-align', 'center', 'important');
      });

      document.querySelectorAll(
        '.abhang-post .entry-content > p, .abhang-post .devotional-numbered-verse'
      ).forEach((node) => {
        node.style.setProperty('display', 'block', 'important');
        node.style.setProperty('width', '100%', 'important');
        node.style.setProperty('max-width', '100%', 'important');
        node.style.setProperty('margin-left', 'auto', 'important');
        node.style.setProperty('margin-right', 'auto', 'important');
        node.style.setProperty('text-align', 'center', 'important');
      });

      document.querySelectorAll(
        '.abhang-post .devotional-verse-number, .abhang-post .devotional-verse-content'
      ).forEach((node) => {
        node.style.setProperty('display', 'inline', 'important');
        node.style.setProperty('width', 'auto', 'important');
        node.style.setProperty('text-align', 'center', 'important');
      });
    }

    if (document.body.classList.contains('dnyaneshwar-aarti-page')) {
      document.querySelectorAll(
        '.abhang-post .post-content, .abhang-post .abhang-verse, .abhang-post .entry-content'
      ).forEach((node) => {
        node.style.setProperty('display', 'block', 'important');
        node.style.setProperty('width', '100%', 'important');
        node.style.setProperty('max-width', '900px', 'important');
        node.style.setProperty('margin-left', 'auto', 'important');
        node.style.setProperty('margin-right', 'auto', 'important');
        node.style.setProperty('text-align', 'center', 'important');
      });

      document.querySelectorAll(
        '.abhang-post .entry-content > p'
      ).forEach((node) => {
        node.style.setProperty('display', 'block', 'important');
        node.style.setProperty('width', '100%', 'important');
        node.style.setProperty('max-width', '100%', 'important');
        node.style.setProperty('margin-left', 'auto', 'important');
        node.style.setProperty('margin-right', 'auto', 'important');
        node.style.setProperty('text-align', 'center', 'important');
      });

      document.querySelectorAll(
        '.abhang-post .entry-content .verse-end'
      ).forEach((node) => {
        node.style.setProperty('display', 'inline', 'important');
        node.style.setProperty('width', 'auto', 'important');
        node.style.setProperty('max-width', 'none', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('text-align', 'inherit', 'important');
        node.style.setProperty('white-space', 'nowrap', 'important');
      });
    }
  };
  const initAbhangRangeSearch = () => {
    const input = document.getElementById('abhangRangeSearch') || document.querySelector('[data-abhang-range-search]');
    const list = document.getElementById('abhangContentList');
    if (!input || !list) return;
    const blocks = Array.from(list.querySelectorAll('.abhang-content-block'));
    const count = document.getElementById('countPill');
    const empty = document.getElementById('abhangEmptyState');
    const devanagari = '\u0966\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f';
    const toAscii = (value) => String(value || '').replace(/[\u0966-\u096f]/g, (digit) => devanagari.indexOf(digit));
    const updateCount = (visible) => {
      if (!count) return;
      count.textContent = visible.toLocaleString('mr-IN') + ' \u0905\u092d\u0902\u0917';
    };
    const apply = () => {
      const raw = input.value.trim().toLowerCase();
      const asciiQuery = toAscii(raw.replace(/^\u0905\u092d\u0902\u0917\s*/, ''));
      let visible = 0;
      blocks.forEach((block) => {
        const haystack = (block.dataset.search || block.textContent || '').toLowerCase();
        const match = !raw || haystack.includes(raw) || (asciiQuery && toAscii(haystack).includes(asciiQuery));
        block.hidden = !match;
        if (match) visible += 1;
      });
      updateCount(visible);
      if (empty) empty.hidden = visible !== 0;
    };
    input.addEventListener('input', apply);
    apply();
  };

  const sortBlogCardsNewestFirst = () => {
    const grid = document.querySelector('.blog-page .blog-grid');
    if (!grid) return;

    const editorialDates = {
      'digital-sant-sahitya-jatan': '2026-07-01',
      'abhang-vachan-man-sthir': '2026-06-30',
      'namasmaran-mahatva': '2026-06-29'
    };

    const getPublishedTime = (card) => {
      const explicitDate = card.dataset.publishedAt;
      if (explicitDate) {
        const parsed = Date.parse(explicitDate);
        if (!Number.isNaN(parsed)) return parsed;
      }

      const link = card.querySelector('.blog-card-media[href], .arrival-title a[href]');
      const href = link ? link.getAttribute('href') || '' : '';
      const pathParts = href
        .split(/[?#]/, 1)[0]
        .split('/')
        .filter((part) => part && part !== '.' && part !== '..' && part !== 'index.html');
      const slug = pathParts[pathParts.length - 1] || '';

      if (editorialDates[slug]) return Date.parse(`${editorialDates[slug]}T12:00:00`);

      const datedSlug = slug.match(/^(\d{4})-(\d{2})-blog-post(?:-(\d{1,2}))?$/);
      if (datedSlug) {
        const year = Number(datedSlug[1]);
        const month = Number(datedSlug[2]);
        const day = Number(datedSlug[3] || 1);
        return new Date(year, month - 1, day, 12).getTime();
      }

      return 0;
    };

    const cards = Array.from(grid.querySelectorAll(':scope > .blog-card'));
    cards
      .map((card, originalIndex) => ({
        card,
        originalIndex,
        publishedTime: getPublishedTime(card)
      }))
      .sort((left, right) =>
        right.publishedTime - left.publishedTime ||
        left.originalIndex - right.originalIndex
      )
      .forEach(({ card }, index) => {
        const label = `लेख ${cards.length - index}`;
        const dateLabel = card.querySelector('.arrival-date');
        const shareFooter = card.querySelector('[data-share-label]');
        if (dateLabel) dateLabel.textContent = label;
        if (shareFooter) shareFooter.dataset.shareLabel = label;
        grid.appendChild(card);
      });
  };

  const hashTarget = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
  if (hashTarget) {
    setTimeout(() => hashTarget.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }

  wrapDevotionalVerseEndings();
  removeDuplicateAbhangOpeningNumbers();
  removeStrayLeadingVerseDots();
  enforceNormalReadingWeight();
  enforceAmrutanubhavVerseWeight();
  observeAmrutanubhavVerseWeight();
  sortBlogCardsNewestFirst();
  libraryInitSearchBars();
  libraryInitSearchPage();});




























