document.addEventListener('DOMContentLoaded', () => {
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
    
    const navHTML = `
      <button class="menu-toggle" id="menuToggle" aria-label="मेन्यू">
        <i class="fas fa-bars"></i>
      </button>
      <nav id="navMenu">
        <ul>
          <li><a href="${homePath}">मुखपृष्ठ</a></li>
          <li><a href="${homePath}#granth">ग्रंथ</a></li>
          <li><a href="${homePath}#abhangs">अभंग/भजन</a></li>
          <li><a href="${homePath}#saints" class="active">संत</a></li>
          <li><a href="${homePath}#categories">विभाग</a></li>
        </ul>
      </nav>
      <div class="header-actions">
        <button class="search-trigger-btn" id="searchTrigger" aria-label="शोध">
          <i class="fas fa-search"></i>
        </button>
        <button class="lang-switch" id="langSwitch">मराठी</button>
      </div>
    `;
    headerContainer.insertAdjacentHTML('beforeend', navHTML);
  }

  // --- Standardize Footer Across All Pages ---
  const logoLink = document.querySelector('.logo-link');
  const logoImg = document.querySelector('.logo-img');
  const homePath = logoLink ? logoLink.getAttribute('href') : 'index.html';
  const logoSrc = logoImg ? logoImg.getAttribute('src') : 'Vakibh/vaakibh_logo.svg';
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
  footer.dataset.standardized = 'true';
  footer.innerHTML = `
    <div class="footer-container">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="${logoSrc}" alt="वाकीभ लोगो">
          <h3>वाकीभ</h3>
        </div>
        <p>
          संत साहित्य, अभंग, ओव्या आणि ग्रंथांचा समृद्ध मराठी संग्रह.
          वारकरी परंपरेचे जतन, संवर्धन आणि प्रसार हा आमचा प्रयत्न.
        </p>
        <div class="footer-socials">
          <a href="#" class="social-link" aria-label="फेसबुक"><i class="fab fa-facebook-f"></i></a>
          <a href="#" class="social-link" aria-label="ट्विटर"><i class="fab fa-twitter"></i></a>
          <a href="#" class="social-link" aria-label="इंस्टाग्राम"><i class="fab fa-instagram"></i></a>
        </div>
      </div>

      <div class="footer-links">
        <h4>मेन्यू</h4>
        <ul>
          <li><a href="${homePath}">मुखपृष्ठ</a></li>
          <li><a href="${homePath}#granth">ग्रंथ</a></li>
          <li><a href="${homePath}#abhangs">अभंग/भजन</a></li>
          <li><a href="${homePath}#saints">संत</a></li>
          <li><a href="${homePath}#categories">विभाग</a></li>
        </ul>
      </div>

      <div class="footer-contact">
        <h4>संपर्क</h4>
        <ul class="footer-contact-list">
          <li><i class="fas fa-envelope"></i> vaakibh.mauli@gmail.com</li>
          <li><i class="fas fa-phone"></i> +९१ (८००) १२३-४५६७</li>
          <li><i class="fas fa-map-marker-alt"></i> पुणे, महाराष्ट्र</li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; २०२६ वाकीभ. सर्व हक्क सुरक्षित.</p>
      <button class="scroll-top-btn" id="scrollTopBtn" aria-label="वर जा">
        <i class="fas fa-chevron-up"></i>
      </button>
    </div>
  `;

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
        <button class="abhang-btn copy-abhang-btn" aria-label="Copy Abhang">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="Share on WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="Share on Facebook">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="Copy for Instagram">
            <i class="fab fa-instagram"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const getAbhangItemActionsMarkup = (targetId, itemLabel) => `
    <div class="abhang-item-actions abhang-card-footer" data-share-scope="item" data-share-target="${targetId}" data-share-label="${itemLabel}">
      <div class="abhang-actions-left">
        <button class="abhang-btn copy-abhang-btn" aria-label="Copy this Abhang">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="Share this Abhang on WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="Share this Abhang on Facebook">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="Copy this Abhang for Instagram">
            <i class="fab fa-instagram"></i>
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

  const createIndividualAbhangActions = () => {
    const abhangEntries = document.querySelectorAll('.abhang-post .entry-content, .post-article .entry-content, .post-article [itemprop="text"]');

    abhangEntries.forEach((entryContent, postIndex) => {
      const paragraphs = Array.from(entryContent.querySelectorAll('p'));
      let itemIndex = 0;

      paragraphs.forEach((paragraph) => {
        const nextElement = paragraph.nextElementSibling;
        const paragraphText = normalizeText(paragraph.innerText || '');
        const firstLine = paragraphText.split('\n')[0] || '';
        const numberMatch = firstLine.match(/^[0-9०-९]+/);
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

  createIndividualAbhangActions();

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
      scope?.querySelector('.abhang-card-title')?.innerText ||
      scope?.querySelector('.arrival-title')?.innerText ||
      scope?.querySelector('.post-title')?.innerText ||
      'Vakibh Sant Sahitya'
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
    const formattedText = [title, author, body, 'वाकीभ संतसाहित्य', pageUrl]
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
        showToast('Abhang copied successfully!');
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
        showToast('Copy failed. Please try again.');
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
          showToast('Added to favorites!');
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
          showToast('Instagram caption copied. Paste it into Instagram.');
        } else {
          showToast('Open Instagram and paste the Abhang manually.');
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
      showToast('कृपया शोधण्यासाठी काहीतरी टाइप करा.');
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
      showToast(`à¤¶à¥‹à¤§ à¤œà¥à¤³à¤²à¤¾: ${query}`);
    } else {
      showToast('à¤•à¥‹à¤£à¤¤à¥€à¤¹à¥€ à¤œà¥à¤³à¤£à¥€ à¤¸à¤¾à¤ªà¤¡à¤²à¥€ à¤¨à¤¾à¤¹à¥€.');
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
  const langSwitch = document.getElementById('langSwitch');
  const searchResults = document.getElementById('searchResults');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchResultsTitle = document.getElementById('searchResultsTitle');
  const searchResultsClose = document.getElementById('searchResultsClose');
  const homepageSearchIndexUrl = 'Vakibh/data/search-index.json';
  let searchIndexPromise = null;
  const savedLanguage = window.localStorage.getItem('vakibh-language');
  let currentLanguage = savedLanguage === 'en' ? 'en' : 'mr';
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
    searchResultsTitle.textContent = `"${query}" à¤¸à¤¾à¤ à¥€ ${results.length} à¤¨à¤¿à¤•à¤¾à¤²`;

    if (!results.length) {
      searchResultsList.innerHTML = '<div class="search-empty-state">à¤œà¥à¤³à¤£à¤¾à¤°à¥‡ à¤¸à¤‚à¤¤ à¤¸à¤¾à¤¹à¤¿à¤¤à¥à¤¯ à¤¸à¤¾à¤ªà¤¡à¤²à¥‡ à¤¨à¤¾à¤¹à¥€.</div>';
      return;
    }

    searchResultsList.innerHTML = results.map(result => `
      <a class="search-result-item" href="${escapeHtml(result.path)}">
        <div class="search-result-topline">
          <span class="search-result-type">${escapeHtml(result.type || 'à¤¸à¤¾à¤¹à¤¿à¤¤à¥à¤¯')}</span>
          <span class="search-result-saint">${escapeHtml(result.saint || '')}</span>
        </div>
        <div class="search-result-title">${escapeHtml(result.title || result.heading || 'Vakibh')}</div>
        <div class="search-result-description">${escapeHtml(result.description || result.excerpt || '')}</div>
      </a>
    `).join('');
  };

  const renderResultList = (query, results, titleNode, listNode) => {
    if (!titleNode || !listNode) return;

    titleNode.textContent = `"${query}" à¤¸à¤¾à¤ à¥€ ${results.length} à¤¨à¤¿à¤•à¤¾à¤²`;

    if (!results.length) {
      listNode.innerHTML = '<div class="search-empty-state">à¤œà¥à¤³à¤£à¤¾à¤°à¥‡ à¤¸à¤‚à¤¤ à¤¸à¤¾à¤¹à¤¿à¤¤à¥à¤¯ à¤¸à¤¾à¤ªà¤¡à¤²à¥‡ à¤¨à¤¾à¤¹à¥€.</div>';
      return;
    }

    listNode.innerHTML = results.map(result => `
      <a class="search-result-item" href="${escapeHtml(result.path)}">
        <div class="search-result-topline">
          <span class="search-result-type">${escapeHtml(result.type || 'à¤¸à¤¾à¤¹à¤¿à¤¤à¥à¤¯')}</span>
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
      showToast('à¤¶à¥‹à¤§à¤£à¥à¤¯à¤¾à¤¸à¤¾à¤ à¥€ à¤•à¤¾à¤¹à¥€à¤¤à¤°à¥€ à¤Ÿà¤¾à¤‡à¤ª à¤•à¤°à¤¾.');
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
      showToast('à¤¶à¥‹à¤§ à¤¸à¤§à¥à¤¯à¤¾ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¾à¤¹à¥€.');
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
      <div class="header-search-dialog" role="dialog" aria-modal="true" aria-label="Site search">
        <div class="header-search-topbar">
          <input type="text" class="header-search-input" id="headerSearchInput" placeholder="संपूर्ण संत साहित्य शोधा..." aria-label="संपूर्ण संत साहित्य शोधा">
          <button class="header-search-submit" id="headerSearchSubmit" type="button">शोधा</button>
          <button class="header-search-close" id="headerSearchClose" type="button" aria-label="Close search">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="header-search-results">
          <div class="search-results-header">
            <span class="search-results-title" id="headerSearchResultsTitle">शोध परिणाम</span>
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
        showToast('शोधण्यासाठी काहीतरी टाइप करा.');
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
        showToast('शोध सध्या उपलब्ध नाही.');
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



  // --- Built-in Language Toggle ---
  const setLanguageButtonLabel = () => {
    if (!langSwitch) return;
    langSwitch.textContent = currentLanguage === 'mr' ? 'English' : '\u092e\u0930\u093e\u0920\u0940';
  };

  const setStoredLanguage = (language) => {
    currentLanguage = language === 'en' ? 'en' : 'mr';
    window.localStorage.setItem('vakibh-language', currentLanguage);
    setLanguageButtonLabel();
  };

  const uiTranslations = {
    '\u092e\u0941\u0916\u092a\u0943\u0937\u094d\u0920': 'Home',
    '\u0917\u094d\u0930\u0902\u0925': 'Books',
    '\u0905\u092d\u0902\u0917/\u092d\u091c\u0928': 'Abhang/Bhajan',
    '\u0938\u0902\u0924': 'Saints',
    '\u0935\u093f\u092d\u093e\u0917': 'Categories',
    '\u092e\u0947\u0928\u094d\u092f\u0942': 'Menu',
    '\u0938\u0902\u092a\u0930\u094d\u0915': 'Contact',
    '\u0935\u093e\u0915\u0940\u092d': 'Vakibh',
    '\u0938\u0902\u0924 \u0938\u093e\u0939\u093f\u0924\u094d\u092f, \u0905\u092d\u0902\u0917, \u0913\u0935\u094d\u092f\u093e \u0906\u0923\u093f \u0917\u094d\u0930\u0902\u0925\u093e\u0902\u091a\u093e \u0938\u092e\u0943\u0926\u094d\u0927 \u092e\u0930\u093e\u0920\u0940 \u0938\u0902\u0917\u094d\u0930\u0939. \u0935\u093e\u0930\u0915\u0930\u0940 \u092a\u0930\u0902\u092a\u0930\u0947\u091a\u0947 \u091c\u0924\u0928, \u0938\u0902\u0935\u0930\u094d\u0927\u0928 \u0906\u0923\u093f \u092a\u094d\u0930\u0938\u093e\u0930 \u0939\u093e \u0906\u092e\u091a\u093e \u092a\u094d\u0930\u092f\u0924\u094d\u0928.': 'A rich Marathi collection of saint literature, abhangs, ovi, and books. Our effort is to preserve, promote, and share the Varkari tradition.',
    '\u0935\u0948\u0936\u093f\u0937\u094d\u091f\u094d\u092f\u092a\u0942\u0930\u094d\u0923 \u0905\u092d\u0902\u0917': 'Featured Abhangs',
    '(\u0928\u093f\u0935\u0921\u0915 \u0930\u091a\u0928\u093e)': '(Selected compositions)',
    '\u0938\u0930\u094d\u0935 \u092a\u0939\u093e': 'View all',
    '\u0936\u094b\u0927': 'Search',
    '\u0938\u0902\u092a\u0942\u0930\u094d\u0923 \u0938\u0902\u0924 \u0938\u093e\u0939\u093f\u0924\u094d\u092f \u0936\u094b\u0927\u093e...': 'Search full saint literature...',
    '\u0911\u0921\u093f\u0913 \u0910\u0915\u093e': 'Listen audio',
    '\u0935\u0930 \u091c\u093e': 'Back to top',
    '\u092b\u0947\u0938\u092c\u0941\u0915': 'Facebook',
    '\u091f\u094d\u0935\u093f\u091f\u0930': 'Twitter',
    '\u0907\u0902\u0938\u094d\u091f\u093e\u0917\u094d\u0930\u093e\u092e': 'Instagram',
    '\u092a\u0941\u0923\u0947, \u092e\u0939\u093e\u0930\u093e\u0937\u094d\u091f\u094d\u0930': 'Pune, Maharashtra',
    '? \u0968\u0966\u0968\u096c \u0935\u093e\u0915\u0940\u092d. \u0938\u0930\u094d\u0935 \u0939\u0915\u094d\u0915 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924.': '? 2026 Vakibh. All rights reserved.',
    '\u0968\u0966\u0968\u096c \u0935\u093e\u0915\u0940\u092d. \u0938\u0930\u094d\u0935 \u0939\u0915\u094d\u0915 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924.': '2026 Vakibh. All rights reserved.'
  };

  const textNodeOriginals = [];
  const attributeOriginals = [];

  const rememberTextNode = (node) => {
    if (!textNodeOriginals.some((entry) => entry.node === node)) {
      textNodeOriginals.push({ node, original: node.textContent });
    }
  };

  const rememberAttribute = (element, attributeName, originalValue) => {
    if (!attributeOriginals.some((entry) => entry.element === element && entry.attributeName === attributeName)) {
      attributeOriginals.push({ element, attributeName, original: originalValue });
    }
  };

  const applyMappedTranslations = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const parentTag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG'].includes(parentTag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!uiTranslations[node.textContent.trim()]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const originalText = node.textContent;
      const trimmed = originalText.trim();
      const translated = uiTranslations[trimmed];
      if (!translated) continue;
      rememberTextNode(node);
      node.textContent = originalText.replace(trimmed, translated);
    }

    document.querySelectorAll('[placeholder], [aria-label], [title]').forEach((element) => {
      ['placeholder', 'aria-label', 'title'].forEach((attributeName) => {
        const value = element.getAttribute(attributeName);
        if (!value) return;
        const translated = uiTranslations[value.trim()];
        if (!translated) return;
        rememberAttribute(element, attributeName, value);
        element.setAttribute(attributeName, value.replace(value.trim(), translated));
      });
    });

    document.documentElement.lang = 'en';
    setStoredLanguage('en');
  };

  const restoreOriginalLanguage = () => {
    textNodeOriginals.forEach(({ node, original }) => {
      node.textContent = original;
    });

    attributeOriginals.forEach(({ element, attributeName, original }) => {
      element.setAttribute(attributeName, original);
    });

    document.documentElement.lang = 'mr';
    setStoredLanguage('mr');
  };

  const applySelectedLanguage = (language) => {
    if (language === 'en') {
      applyMappedTranslations();
      return;
    }
    restoreOriginalLanguage();
  };

  if (langSwitch) {
    setLanguageButtonLabel();
    langSwitch.addEventListener('click', () => {
      const nextLanguage = currentLanguage === 'mr' ? 'en' : 'mr';
      applySelectedLanguage(nextLanguage);
    });
  }

  if (currentLanguage === 'en') {
    applyMappedTranslations();
  }



  // --- Media Player Logic ---
  const heroVideo = document.querySelector('.hero-bg-video');
  const audio = heroVideo || new Audio('Vakibh/vaakibh_audio.mp3');

  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.volume = 1;
  }

  // Hero player DOM
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = playPauseBtn?.querySelector('i');
  const progressBg = document.getElementById('progressBg');
  const progressFill = document.getElementById('progressFill');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeDuration = document.getElementById('timeDuration');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeBtn = document.getElementById('volumeBtn');

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const syncPlayPauseIcon = () => {
    if (playIcon) {
      playIcon.className = audio.paused ? 'fas fa-play' : 'fas fa-pause';
    }
  };

  const syncHeroVideoState = () => {
    if (!heroVideo) return;

    if (audio.paused) {
      heroVideo.pause();
    } else {
      heroVideo.muted = false;
      heroVideo.play().catch(err => {
        console.error('Hero video playback error: ', err);
      });
    }
  };

  // Play/Pause State
  const togglePlay = () => {
    if (audio.paused) {
      // Pause any running card audio players
      stopAllCardAudio();
      
      audio.play().then(() => {
        syncPlayPauseIcon();
        syncHeroVideoState();
        showToast('à¤‘à¤¡à¤¿à¤“ à¤¸à¥à¤°à¥‚ à¤à¤¾à¤²à¤¾.');
      }).catch(err => {
        console.error("Audio playback error: ", err);
        showToast('à¤‘à¤¡à¤¿à¤“ à¤šà¤¾à¤²à¥‚ à¤•à¤°à¥‚ à¤¶à¤•à¤¤ à¤¨à¤¾à¤¹à¥€.');
      });
    } else {
      audio.pause();
      syncHeroVideoState();
      syncPlayPauseIcon();
      showToast('à¤‘à¤¡à¤¿à¤“ à¤¥à¤¾à¤‚à¤¬à¤µà¤²à¤¾.');
    }
  };

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlay);
  }

  // Audio Events
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const percentage = (audio.currentTime / audio.duration) * 100;
      if (progressFill) progressFill.style.width = `${percentage}%`;
      if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    if (timeDuration) timeDuration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('play', () => {
    syncPlayPauseIcon();
    syncHeroVideoState();
  });

  audio.addEventListener('pause', () => {
    syncPlayPauseIcon();
    syncHeroVideoState();
  });

  audio.addEventListener('ended', () => {
    syncPlayPauseIcon();
    syncHeroVideoState();
    if (progressFill) progressFill.style.width = '0%';
    if (timeCurrent) timeCurrent.textContent = '0:00';
  });

  // Seeking on Progress Bar Click
  if (progressBg) {
    progressBg.addEventListener('click', (e) => {
      if (audio.duration) {
        const rect = progressBg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const seekTime = (clickX / width) * audio.duration;
        audio.currentTime = seekTime;
      }
    });
  }

  // Volume Control
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      audio.volume = e.target.value;
      if (heroVideo) {
        heroVideo.muted = Number(e.target.value) === 0;
      }
      updateVolumeIcon(audio.volume);
    });
  }

  const updateVolumeIcon = (volume) => {
    if (!volumeBtn) return;
    const icon = volumeBtn.querySelector('i');
    if (!icon) return;

    if (volume === 0) {
      icon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
      icon.className = 'fas fa-volume-down';
    } else {
      icon.className = 'fas fa-volume-up';
    }
  };

  if (volumeBtn) {
    volumeBtn.addEventListener('click', () => {
      if (audio.volume > 0) {
        audio.dataset.prevVolume = audio.volume;
        audio.volume = 0;
        if (heroVideo) {
          heroVideo.muted = true;
        }
        if (volumeSlider) volumeSlider.value = 0;
      } else {
        const prev = audio.dataset.prevVolume || 1;
        audio.volume = prev;
        if (heroVideo) {
          heroVideo.muted = false;
        }
        if (volumeSlider) volumeSlider.value = prev;
      }
      updateVolumeIcon(audio.volume);
    });
  }

  // --- Individual Card Audio Simulation ---
  const cardPlayBtns = document.querySelectorAll('.abhang-card-play-btn');
  
  cardPlayBtns.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.abhang-card');
      const playLabel = btn.querySelector('.play-label') || btn;
      const cardAudioIndicator = card?.querySelector('.audio-status-text');

      // Stop main player if active
      if (!audio.paused) {
        audio.pause();
        syncHeroVideoState();
        syncPlayPauseIcon();
      }

      const isPlaying = btn.classList.contains('playing');
      stopAllCardAudio();

      if (!isPlaying) {
        btn.classList.add('playing');
        btn.innerHTML = '<i class="fas fa-pause"></i>';
        if (cardAudioIndicator) {
          cardAudioIndicator.textContent = 'à¤šà¤¾à¤²à¥‚ à¤†à¤¹à¥‡...';
          cardAudioIndicator.style.color = 'var(--primary-dark)';
        }
        showToast(`à¤…à¤­à¤‚à¤— ${index + 1} à¤‘à¤¡à¤¿à¤“ à¤¸à¥à¤°à¥‚ à¤à¤¾à¤²à¤¾.`);
      } else {
        showToast(`à¤…à¤­à¤‚à¤— ${index + 1} à¤‘à¤¡à¤¿à¤“ à¤¥à¤¾à¤‚à¤¬à¤µà¤²à¤¾.`);
      }
    });
  });

  function stopAllCardAudio() {
    cardPlayBtns.forEach(btn => {
      btn.classList.remove('playing');
      btn.innerHTML = '<i class="fas fa-play"></i>';
      const card = btn.closest('.abhang-card');
      const cardAudioIndicator = card?.querySelector('.audio-status-text');
      if (cardAudioIndicator) {
        cardAudioIndicator.textContent = 'à¤‘à¤¡à¤¿à¤“ à¤à¤•à¤¾';
        cardAudioIndicator.style.color = '';
      }
    });
  }

  syncPlayPauseIcon();
  if (heroVideo) {
    heroVideo.currentTime = 0;
    heroVideo.pause();
  }
});
