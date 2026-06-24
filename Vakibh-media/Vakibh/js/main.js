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
        <div class="lang-switch-group" aria-label="भाषा निवडा">
          <button class="lang-switch active" type="button" data-language="marathi">मराठी</button>
        </div>
        <button class="search-trigger-btn" id="searchTrigger" aria-label="शोध">
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
  const sharedVeenaAudioSrc = `${siteBasePath}assests/vaakibh_audio.mp3`;
  const blogPath = homePath.replace(/index\.html(?:#.*)?$/, 'blog/index.html');
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
          <img src="${logoSrc}" alt="वाकीभ लोगो">
          <h3>वाकीभ</h3>
        </div>
        <p>
          संत साहित्य, अभंग, ओव्या आणि ग्रंथांचा समृद्ध मराठी संग्रह.
          वारकरी परंपरेचे जतन, संवर्धन आणि प्रसार हा आमचा प्रयत्न.
        </p>
        <div class="footer-socials">
          <a href="${socialProfiles.facebook}" class="social-link" aria-label="फेसबुक" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f"></i></a>
          <a href="${socialProfiles.instagram}" class="social-link" aria-label="इंस्टाग्राम" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i></a>
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
          <li><a href="${blogPath}">ब्लॉग</a></li>
        </ul>
      </div>

      <div class="footer-links footer-blog-links">
        <h4>ब्लॉग</h4>
        <ul>
          <li><a href="${blogPath.replace('index.html', 'namasmaran-mahatva/index.html')}">वारकरी परंपरेतील नामस्मरणाचे महत्त्व</a></li>
          <li><a href="${blogPath.replace('index.html', 'abhang-vachan-man-sthir/index.html')}">अभंग वाचन मनाला कसे स्थिर करते</a></li>
          <li><a href="${blogPath.replace('index.html', 'digital-sant-sahitya-jatan/index.html')}">डिजिटल युगात संत साहित्य जतन का आवश्यक आहे</a></li>
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

  const isSaintDetailPage = document.querySelector('.abhang-post-main');

  if (isSaintDetailPage) {
    document.querySelectorAll('.elementor-section').forEach((section) => {
      const sectionText = (section.textContent || '').replace(/\s+/g, ' ').trim();
      const hasEmbeddedAudio = section.querySelector('audio.wp-audio-shortcode');
      const isAudioOnlyNote =
        !hasEmbeddedAudio &&
        !section.querySelector('.ovi') &&
        !section.querySelector('.oviar') &&
        /(ध्वनीमुद्रण|ऑडिओ|audio)/i.test(sectionText);

      if (hasEmbeddedAudio || isAudioOnlyNote) {
        section.remove();
      }
    });

    document.querySelectorAll('.abhang-post-main audio').forEach((audioEl) => {
      const label = audioEl.previousElementSibling;
      const wrapper = audioEl.parentElement;
      const labelText = (label?.textContent || '').replace(/\s+/g, ' ').trim();
      const wrapperText = (wrapper?.textContent || '').replace(/\s+/g, ' ').trim();

      if (label && /(ध्वनीमुद्रण|ऑडिओ|audio)/i.test(labelText)) {
        label.remove();
      }

      if (
        wrapper &&
        wrapper !== audioEl &&
        !wrapper.querySelector('.ovi') &&
        !wrapper.querySelector('.oviar') &&
        wrapper.querySelector('audio') &&
        /(ध्वनीमुद्रण|ऑडिओ|audio)/i.test(wrapperText)
      ) {
        wrapper.remove();
        return;
      }

      audioEl.remove();
    });

    document.querySelectorAll('.abhang-post-main p, .abhang-post-main div').forEach((node) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || node.querySelector('.ovi') || node.querySelector('.oviar') || node.querySelector('audio')) {
        return;
      }

      if (/(ध्वनीमुद्रण|ऑडिओ|audio)/i.test(text)) {
        node.remove();
      }
    });
  }

  let floatingVeena = document.querySelector('.floating-veena');
  const floatingWhatsapp = document.querySelector('.floating-whatsapp');

  if (!floatingVeena) {
    floatingVeena = document.createElement('button');
    floatingVeena.type = 'button';
    floatingVeena.className = 'floating-veena';
    floatingVeena.setAttribute('aria-label', 'वीणेचा नाद ऐका');
    floatingVeena.innerHTML = `<img src="${sharedVeenaSrc}" alt="वीणा">`;

    if (floatingWhatsapp?.parentNode) {
      floatingWhatsapp.parentNode.insertBefore(floatingVeena, floatingWhatsapp);
    } else {
      document.body.appendChild(floatingVeena);
    }
  } else {
    const veenaImg = floatingVeena.querySelector('img');
    if (veenaImg) {
      veenaImg.src = sharedVeenaSrc;
      veenaImg.alt = 'वीणा';
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

  const languageButtons = Array.from(document.querySelectorAll('.lang-switch'));
  const translations = {
    marathi: {
      nav: ['मुखपृष्ठ', 'ग्रंथ', 'अभंग/भजन', 'संत', 'विभाग'],
      searchLabel: 'शोध',
      footerMenu: 'मेन्यू',
      footerBlog: 'ब्लॉग',
      footerContact: 'संपर्क',
      footerText: 'संत साहित्य, अभंग, ओव्या आणि ग्रंथांचा समृद्ध मराठी संग्रह. वारकरी परंपरेचे जतन, संवर्धन आणि प्रसार हा आमचा प्रयत्न.',
      footerLinks: ['मुखपृष्ठ', 'ग्रंथ', 'अभंग/भजन', 'संत', 'विभाग', 'ब्लॉग'],
      footerBlogLinks: [
        'वारकरी परंपरेतील नामस्मरणाचे महत्त्व',
        'अभंग वाचन मनाला कसे स्थिर करते',
        'डिजिटल युगात संत साहित्य जतन का आवश्यक आहे'
      ],
      contactPrefix: ['ईमेल', 'फोन', 'पत्ता'],
      searchButtonLabel: 'शोध',
      saintsHeading: 'संत परंपरा',
      saintsSubtitle: 'महाराष्ट्रातील थोर संत',
      seeAll: 'सर्व पहा',
      saintNames: [
        'संत ज्ञानेश्वर',
        'संत तुकाराम',
        'संत नामदेव',
        'संत एकनाथ',
        'संत निवृत्ती महाराज',
        'संत मुक्ताबाई',
        'संत सोपानदेव',
        'संत चोखामेळा',
        'संत जनाबाई',
        'संत गोरा कुंभार',
        'संत सावता माळी',
        'संत रोहिदास महाराज'
      ],
      saintDescs: [
        'भक्ती आणि ज्ञानपरंपरेतील महान संत.',
        'विठ्ठलभक्तीचे ओजस्वी अभंगकार.',
        'नामस्मरण व भक्तीचा अखंड प्रवाह.',
        'समाजप्रबोधन करणारे संतकवी.',
        'ज्ञानेश्वरांचे मार्गदर्शक व थोर संत.',
        'वारकरी संप्रदायातील थोर संत कवयित्री.',
        'ज्ञानदेवांचे कनिष्ठ बंधू व महान योगसिद्ध संत.',
        'शुद्ध अंतःकरणाचे विठ्ठलभक्त.',
        'नामदेवांच्या सहवासातील महान संत कवयित्री.',
        'विठ्ठलप्रेमाने ओतप्रोत कुंभार संत.',
        'शेतात विठ्ठल पाहणारे वारकरी संत.',
        'भक्ती आणि सामाजिक समतेचे पुरस्कर्ते.'
      ],
      blogTitles: [
        'वारकरी परंपरेतील नामस्मरणाचे महत्त्व',
        'अभंग वाचन मनाला कसे स्थिर करते',
        'डिजिटल युगात संत साहित्य जतन का आवश्यक आहे'
      ],
      blogTags: ['वारकरी परंपरा', 'अभंग चिंतन', 'डिजिटल जतन'],
      blogAuthor: 'वाकीभ संपादकीय मंडळ',
      selectedToast: 'मराठी आवृत्ती निवडली आहे.'
    },
    english: {
      nav: ['Home', 'Books', 'Abhang/Bhajan', 'Saints', 'Categories'],
      searchLabel: 'Search',
      footerMenu: 'Menu',
      footerBlog: 'Blog',
      footerContact: 'Contact',
      footerText: 'A rich Marathi collection of saint literature, abhangs, ovis and sacred texts. Our effort is to preserve, nurture and share the Warkari tradition.',
      footerLinks: ['Home', 'Books', 'Abhang/Bhajan', 'Saints', 'Categories', 'Blog'],
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
        'Sant Dnyaneshwar',
        'Sant Tukaram',
        'Sant Namdev',
        'Sant Eknath',
        'Sant Nivrutti Maharaj',
        'Sant Muktabai',
        'Sant Sopandev',
        'Sant Chokhamela',
        'Sant Janabai',
        'Sant Gora Kumbhar',
        'Sant Savata Mali',
        'Sant Rohidas Maharaj'
      ],
      saintDescs: [
        'A great saint in the traditions of devotion and wisdom.',
        'A powerful abhang poet of Vitthal devotion.',
        'An unbroken stream of chanting and devotion.',
        'A saint-poet who inspired social awakening.',
        'Guide of Dnyaneshwar and a revered saint.',
        'A great saint-poetess of the Warkari tradition.',
        'Younger brother of Dnyandev and a great realized saint.',
        'A pure-hearted devotee of Vitthal.',
        'A great saint-poetess in the company of Namdev.',
        'A potter saint overflowing with love for Vitthal.',
        'A Warkari saint who saw Vitthal in the fields.',
        'A proponent of devotion and social equality.'
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

  const applyLanguageSelection = (language) => {
    const selectedLanguage = translations[language] ? language : 'marathi';
    const languagePack = translations[selectedLanguage];

    languageButtons.forEach((button) => {
      button.dataset.language = selectedLanguage;
      button.textContent = selectedLanguage === 'english' ? 'English' : 'मराठी';
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('title', selectedLanguage === 'english' ? 'Click to switch language' : 'भाषा बदलण्यासाठी क्लिक करा');
    });

    document.documentElement.lang = selectedLanguage === 'english' ? 'en' : 'mr';

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
  };

  if (languageButtons.length) {
    const storedLanguage = localStorage.getItem('vakibh-language');
    applyLanguageSelection(storedLanguage === 'english' ? 'english' : 'marathi');

    languageButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const currentLanguage = button.dataset.language === 'english' ? 'english' : 'marathi';
        const nextLanguage = currentLanguage === 'english' ? 'marathi' : 'english';
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
        <button class="abhang-btn copy-abhang-btn" aria-label="अभंग कॉपी करा">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="व्हॉट्सॲपवर शेअर करा">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="फेसबुकवर शेअर करा">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="इंस्टाग्रामसाठी कॉपी करा">
            <i class="fab fa-instagram"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  const getAbhangItemActionsMarkup = (targetId, itemLabel) => `
    <div class="abhang-item-actions abhang-card-footer" data-share-scope="item" data-share-target="${targetId}" data-share-label="${itemLabel}">
      <div class="abhang-actions-left">
        <button class="abhang-btn copy-abhang-btn" aria-label="मजकूर कॉपी करा">
          <i class="far fa-copy"></i>
        </button>
        <div class="abhang-share-group">
          <button class="abhang-btn social-share-btn whatsapp-share-btn" data-platform="whatsapp" aria-label="व्हॉट्सॲपवर शेअर करा">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="abhang-btn social-share-btn facebook-share-btn" data-platform="facebook" aria-label="फेसबुकवर शेअर करा">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="abhang-btn social-share-btn instagram-share-btn" data-platform="instagram" aria-label="इंस्टाग्रामसाठी कॉपी करा">
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
      shareTarget?.querySelector('.abhang-card-title')?.innerText ||
      shareTarget?.querySelector('.arrival-title')?.innerText ||
      shareTarget?.querySelector('.post-title')?.innerText ||
      scope?.querySelector('.abhang-card-title')?.innerText ||
      scope?.querySelector('.arrival-title')?.innerText ||
      scope?.querySelector('.post-title')?.innerText ||
      'वाकीभ'
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
    const formattedText = [title, author, body, 'वाकीभ', pageUrl]
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
        showToast('अभंग यशस्वीपणे कॉपी झाला.');
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
        showToast('कॉपी करता आली नाही. कृपया पुन्हा प्रयत्न करा.');
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
          showToast('आवडीत जोडले.');
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
          showToast('इंस्टाग्रामसाठी मजकूर कॉपी झाला.');
        } else {
          showToast('इंस्टाग्राम उघडून अभंग स्वतः पेस्ट करा.');
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
      showToast('कृपया शोधण्यासाठी शब्द टाका.');
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
      showToast(`सापडले: ${query}`);
    } else {
      showToast('जुळणारे साहित्य सापडले नाही.');
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

  document.documentElement.lang = 'mr';
  window.localStorage.removeItem('vakibh-language');

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
      searchResultsList.innerHTML = '<div class="search-empty-state">जुळणारे संत साहित्य सापडले नाही.</div>';
      return;
    }

    searchResultsList.innerHTML = results.map(result => `
      <a class="search-result-item" href="${escapeHtml(result.path)}">
        <div class="search-result-topline">
          <span class="search-result-type">${escapeHtml(result.type || 'साहित्य')}</span>
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
      listNode.innerHTML = '<div class="search-empty-state">जुळणारे संत साहित्य सापडले नाही.</div>';
      return;
    }

    listNode.innerHTML = results.map(result => `
      <a class="search-result-item" href="${escapeHtml(result.path)}">
        <div class="search-result-topline">
          <span class="search-result-type">${escapeHtml(result.type || 'साहित्य')}</span>
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
      showToast('कृपया शोधण्यासाठी शब्द टाका.');
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
      showToast('शोध करता आला नाही.');
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
      <div class="header-search-dialog" role="dialog" aria-modal="true" aria-label="साहित्य शोध">
        <div class="header-search-topbar">
          <input type="text" class="header-search-input" id="headerSearchInput" placeholder="\u0938\u0902\u092a\u0942\u0930\u094d\u0923 \u0938\u0902\u0924 \u0938\u093e\u0939\u093f\u0924\u094d\u092f \u0936\u094b\u0927\u093e..." aria-label="\u0938\u0902\u092a\u0942\u0930\u094d\u0923 \u0938\u0902\u0924 \u0938\u093e\u0939\u093f\u0924\u094d\u092f \u0936\u094b\u0927\u093e">
          <button class="header-search-submit" id="headerSearchSubmit" type="button">\u0936\u094b\u0927\u093e</button>
          <button class="header-search-close" id="headerSearchClose" type="button" aria-label="शोध बंद करा">
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
        showToast('कृपया शोधण्यासाठी शब्द टाका.');
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
        showToast('शोध करता आला नाही.');
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
  // --- Media Player Logic ---
  const heroVideo = document.querySelector('.hero-bg-video');
  const audio = heroVideo || new Audio();
  const veenaAudio = new Audio(sharedVeenaAudioSrc);
  veenaAudio.preload = 'auto';

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

  const stopVeenaAudio = () => {
    veenaAudio.pause();
    veenaAudio.currentTime = 0;
    floatingVeena?.classList.remove('is-playing');
  };

  // Play/Pause State
  const togglePlay = () => {
    if (audio.paused) {
      // Pause any running card audio players
      stopAllCardAudio();
      stopVeenaAudio();
      
      audio.play().then(() => {
        syncPlayPauseIcon();
        syncHeroVideoState();
      }).catch(err => {
        console.error("Audio playback error: ", err);
        showToast('ऑडिओ सुरू करता आला नाही.');
      });
    } else {
      audio.pause();
      syncHeroVideoState();
      syncPlayPauseIcon();
    }
  };

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlay);
  }

  const categoryAudioTrigger = document.querySelector('[data-audio-trigger="hero-audio"]');
  if (categoryAudioTrigger) {
    categoryAudioTrigger.style.cursor = 'pointer';
    categoryAudioTrigger.addEventListener('click', togglePlay);
    categoryAudioTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        togglePlay();
      }
    });
  }

  if (floatingVeena) {
    const toggleVeenaAudio = () => {
      if (veenaAudio.paused) {
        stopAllCardAudio();
        if (!audio.paused) {
          audio.pause();
          syncHeroVideoState();
          syncPlayPauseIcon();
        }

        veenaAudio.play().then(() => {
          floatingVeena.classList.add('is-playing');
        }).catch(() => {
          showToast('वीणेचा ऑडिओ सापडला नाही. `veena_audio.mp3` जोडा.');
        });
      } else {
        stopVeenaAudio();
      }
    };

    floatingVeena.addEventListener('click', toggleVeenaAudio);
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
    floatingVeena?.classList.remove('is-playing');
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

  veenaAudio.addEventListener('pause', () => {
    floatingVeena?.classList.remove('is-playing');
  });

  veenaAudio.addEventListener('ended', () => {
    floatingVeena?.classList.remove('is-playing');
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
          cardAudioIndicator.textContent = 'ऑडिओ सुरू...';
          cardAudioIndicator.style.color = 'var(--primary-dark)';
        }
        showToast(`अभंग ${index + 1} ऑडिओ सुरू झाला.`);
      } else {
        showToast(`अभंग ${index + 1} ऑडिओ थांबवला.`);
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
        cardAudioIndicator.textContent = 'ऑडिओ ऐका';
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
