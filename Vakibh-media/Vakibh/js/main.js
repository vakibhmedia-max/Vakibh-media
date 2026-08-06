document.addEventListener('DOMContentLoaded', () => {
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

  const splitAmrutanubhavVerses = () => {
    if (!document.body.classList.contains('amrutanubhav-page')) return;

    const verseContainers = document.querySelectorAll('.amrutanubhav-source-page');
    const verseLinePattern = /॥\s*$/;
    const isVerseLine = (text) => verseLinePattern.test((text || '').trim());
    const decodeHtml = (value) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    };

    const createParagraph = (html) => {
      const paragraph = document.createElement('p');
      paragraph.innerHTML = html;
      return paragraph;
    };

    const createVerseBlock = (lines) => {
      const verse = document.createElement('div');
      verse.className = 'amrutanubhav-verse';
      verse.innerHTML = lines.map((line) => line.trim()).join('<br>');
      return verse;
    };

    verseContainers.forEach((container) => {
      const nodes = Array.from(container.children);
      const rebuiltNodes = [];
      let paragraphBuffer = [];
      let verseBuffer = [];

      const flushParagraph = () => {
        if (!paragraphBuffer.length) return;
        rebuiltNodes.push(createParagraph(paragraphBuffer.join(' ')));
        paragraphBuffer = [];
      };

      const flushVerse = () => {
        if (!verseBuffer.length) return;
        rebuiltNodes.push(createVerseBlock(verseBuffer));
        verseBuffer = [];
      };

      const appendTextToParagraph = (value) => {
        const text = decodeHtml(value).replace(/\s+/g, ' ').trim();
        if (text) paragraphBuffer.push(text);
      };

      nodes.forEach((node) => {
        if (node.tagName !== 'P') {
          flushParagraph();
          flushVerse();
          rebuiltNodes.push(node);
          return;
        }

        const parts = (node.innerHTML || '')
          .split(/<br\s*\/?>/i)
          .map((part) => part.trim())
          .filter(Boolean);

        if (!parts.length) {
          flushParagraph();
          flushVerse();
          rebuiltNodes.push(node);
          return;
        }

        parts.forEach((part) => {
          const text = decodeHtml(part).replace(/<[^>]+>/g, '').trim();
          if (!text) return;

          if (isVerseLine(text)) {
            flushParagraph();
            verseBuffer.push(text);
            return;
          }

          if (verseBuffer.length) {
            flushVerse();
          }
          appendTextToParagraph(text);
        });

        if (verseBuffer.length) {
          flushVerse();
        } else {
          flushParagraph();
        }
      });

      if (!rebuiltNodes.length) return;

      const fragment = document.createDocumentFragment();
      rebuiltNodes.forEach((node) => fragment.appendChild(node));
      container.replaceChildren(fragment);
    });
  };
  splitAmrutanubhavVerses();

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

      if (post.classList.contains('post-article')) {
        postContent.insertAdjacentHTML('afterend', getAbhangPostActionsMarkup());
      } else {
        postContent.insertAdjacentHTML('afterbegin', getAbhangPostActionsMarkup());
      }
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

    const itemPattern = /(^|\n|\s)([\u0966-\u096F]+)\s*[.)]?\s+(?=[\s\S]*?\u0965\u0967\u0965)/g;
    const verseMarkerPattern = /[\u0964\u0965]/;
    const meaningLabelPattern = /^\s*(\u0905\u0930\u094D\u0925|\u092D\u093E\u0935\u093E\u0930\u094D\u0925|meaning)\s*[::\-��]?\s*$/i;
    const matches = Array.from(rawText.matchAll(itemPattern));
    if (!matches.length) return;

    const cleanText = (value) => normalizeText(value
      .replace(/[^\n]*\u0935\u093F\u0921\u093F\u0913[^\n]*/g, '')
      .replace(/\([^\n]*\u0939\u0930\u093F\u092A\u093E\u0920[^\n]*\)/g, ''));

    const splitMeaningParagraphs = (value) => cleanText(value)
      .split(/\n{2,}|(?<=\u0965[\u0966-\u096F]+\u0965)\s+(?=[^\u0965\n]{18,})/)
      .map((part) => cleanText(part))
      .filter(Boolean);
    const attachEndingMarker = (line = '') => cleanText(line).replace(/\s+(?[\u0966-\u096F]+?)\s*$/, '\u00a0$1');

    const renderVerseStanzas = (value) => {
      const compact = cleanText(value).replace(/\s+/g, ' ');
      const stanzas = [];
      const stanzaPattern = /([^??]+?)\s*([^??]+?[\u0966-\u096F]+?)/g;
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
        const firstLine = cleanText(`${pieces[index] || ''} ?`);
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

      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `?????? ${number}`));

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
      if (lines.some((line) => /???\s+???????????\s+??????\s+??????/.test(line))) return;

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
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `?????? ${number}`));
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
      return /[??]/.test(text) && !/???\s+????|??????\s+??????/.test(text);
    });
    if (!verseParagraphs.length) return;

    document.body.classList.add('haripath-meaning-normal-page', 'namdev-haripath-page');

    const list = document.createElement('div');
    list.className = 'abhang-readable-list';

    verseParagraphs.forEach((paragraph, index) => {
      const number = String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
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
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `?????? ${number}`));
      list.appendChild(section);
    });

    const completeCard = document.createElement('div');
    completeCard.className = 'haripath-complete-card';
    completeCard.appendChild(list);

    const pageHeader = document.createElement('header');
    pageHeader.className = 'post-header';
    pageHeader.innerHTML = '<h1 class="post-title">??? ?????? ??????</h1>';
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
      'vitthache-abhang': '????',
      gavlan: '????',
      'dronparw-katha': '???'
    }[categorySlug] || '????';

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
        const number = String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card';
        card.id = `namdev-gatha-${index + 1}`;

        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `???? ${number}`;

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

          if (/^???\s+??????\s+????\s+[?-?0-9]+\s*[��-]/.test(getFirstLine())) {
            if (!removeFirstLine()) return;
          }

          const firstLine = getFirstLine();
          const firstBreak = paragraph.querySelector('br');
          if (/^[?-?0-9]+[.)]?$/u.test(firstLine) && firstBreak) {
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
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `???? ${number}`));
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
        return /^[?-?0-9]+[.)]?\s+/.test(text) && /[??]/.test(text);
      });
      const list = document.createElement('div');
      list.className = 'namdev-gatha-section-list';

      paragraphs.forEach((paragraph, index) => {
        const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
        const number = text.match(/^([?-?0-9]+)/)?.[1]
          || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
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
          firstTextNode.textContent = (firstTextNode.textContent || '').replace(/^\s*[?-?0-9]+[.)]?\s*/, '');
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
        badge.textContent = `???? ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `???? ${number}`));
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
      if (!text || !/[??]/.test(text)) return false;
      if (/^???\s+??????\s+(?:????|????)/.test(text)) return false;
      return /^[?-?0-9]+[.)]?\s*/.test(text) || paragraph.querySelector('br');
    });

    if (!candidates.length) return;

    const list = document.createElement('div');
    list.className = 'namdev-gatha-section-list';
    candidates.forEach((paragraph, index) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      const explicitNumber = text.match(/^([?-?0-9]+)[.)]?\s*/)?.[1];
      const number = explicitNumber
        || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
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
            .replace(/^\s*[?-?0-9]+[.)]?\s*/, '');
        }
      }

      verse.style.setProperty('display', 'table', 'important');
      verse.style.setProperty('width', 'fit-content', 'important');
      verse.style.setProperty('max-width', '100%', 'important');
      verse.style.setProperty('margin-left', 'auto', 'important');
      verse.style.setProperty('margin-right', 'auto', 'important');
      verse.style.setProperty('text-align', 'left', 'important');

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
      return text && /[??]/.test(text) && !paragraph.querySelector('strong');
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
        (digit) => '??????????'[Number(digit)]
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
      verse.style.setProperty('text-align', 'left', 'important');

      const card = document.createElement('article');
      card.className = 'namdev-gatha-section-card';
      card.id = `namdev-palna-${index + 1}`;
      const badge = document.createElement('span');
      badge.className = 'namdev-gatha-section-number';
      badge.textContent = `????? ${number}`;
      const content = document.createElement('div');
      content.className = 'namdev-gatha-section-content';
      content.appendChild(verse);
      card.append(badge, content);
      card.insertAdjacentHTML(
        'beforeend',
        getAbhangItemActionsMarkup(card.id, `????? ${number}`)
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

      let title = entry.querySelector('.aarti-subtitle');
      if (!title) {
        title = document.createElement('h2');
        title.className = 'aarti-subtitle';
        title.textContent = `???? ??????????? ???? ${number}`;
        entry.prepend(title);
      }

      entry.insertAdjacentHTML(
        'beforeend',
        getAbhangItemActionsMarkup(entry.id, `???? ${number}`)
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

    const pageTitle = normalizeText(document.querySelector('.post-title')?.textContent || '??? ????');
    const pageConfig = path.includes('/santaji-jagnade/aarti/')
      ? { start: /^([??])\s*[.)]/, expected: 2 }
      : path.includes('/nilobaray/aarti/')
        ? { start: /^(???[?-?])\s*[.)]/, expected: 5 }
        : path.includes('/gora-kumbhar-aarti/')
          ? { start: /^????\s*([??])$/, expected: 2, omitMarker: true }
        : { start: null, expected: 1 };

    const cards = document.createElement('div');
    cards.className = 'saint-aarti-cards';
    const paragraphs = Array.from(entry.children).filter((node) => {
      if (!node.matches('p')) return false;
      const text = normalizeText(node.textContent || '');
      if (!text || /????\s+??????\s*[-��]?$/.test(text)) return false;
      if (node.querySelector('strong') && text.includes(pageTitle)) return false;
      return text.replace(/\s*[-��]\s*$/, '') !== pageTitle;
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
      title.textContent = groups.length === 1 ? pageTitle : `???? ${number}`;
      const hideDuplicateCardTitle = path.includes('/nivruttinath/nivruttinath-arti/')
        || path.includes('/eknath/sant-eknath-arti/')
        || path.includes('/muktabai/muktabai-aarti/')
        || path.includes('/savata-mali/savata-maharaj-arati/')
        || path.includes('/rohidas/ravidas-aarti/');
      if (!hideDuplicateCardTitle) card.appendChild(title);

      const content = document.createElement('div');
      content.className = 'saint-aarti-card-content';
      group.forEach((paragraph) => content.appendChild(paragraph));
      card.appendChild(content);
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `???? ${number}`));
      cards.appendChild(card);
    });

    postContent.querySelector('.abhang-post-actions')?.remove();
    postContent.closest('.abhang-post, .post-article')?.querySelector('.abhang-action-toolbar')?.remove();
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
      return node.matches('h2') || /??????\s*\/\s*???????\s*\/\s*?????????/.test(text);
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
      title.textContent = normalizeText(startNode.textContent || `?????? ${number}`);
      card.appendChild(title);

      let node = startNode.nextElementSibling;
      let verseFound = false;
      while (node && node !== endNode) {
        const next = node.nextElementSibling;
        const text = normalizeText(node.textContent || '');
        const isDuplicate = new RegExp(`^??? ?????????? ??????\\s*[${number}?????????]$`).test(text)
          || /??????.*??????/.test(text);

        if (node.matches('hr') || isDuplicate) {
          node.remove();
        } else if (!verseFound && node.matches('p') && node.querySelector('strong')) {
          node.className = 'virani-card-verse';
          card.appendChild(node);
          verseFound = true;
        } else if (/^?\s*???\s*?\s*?$/.test(text)) {
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
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `?????? ${number}`));
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
      heading.innerHTML = '<h1 class="post-title">??? ??????? ?????? ??????</h1>';
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
    entry.classList.add('charitra-reading-card');

    entry.querySelectorAll('hr').forEach((divider) => divider.remove());
    entry.querySelectorAll('h2, h3').forEach((heading) => heading.classList.add('charitra-section-heading'));
    entry.querySelectorAll('p').forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      paragraph.classList.add('charitra-paragraph');
      if (/^???? ??????? ???? ??????/.test(text)) paragraph.classList.add('charitra-quote');
    });

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
      return /^[?-?1-6](?:\s|$)/.test(text) && paragraph.querySelector('br');
    });
    if (!candidates.length) return;

    entry.dataset.goraSangitCards = 'true';
    entry.classList.add('entry-content', 'clear', 'namdev-gatha-card-list-host');
    document.body.classList.add('namdev-gatha-multi-card-page', 'gora-sangit-card-page');
    const list = document.createElement('div');
    list.className = 'namdev-gatha-section-list gora-sangit-section-list';

    candidates.forEach((paragraph, index) => {
      const text = normalizeText(paragraph.innerText || paragraph.textContent || '');
      const number = text.match(/^([?-?1-6])(?:\s|$)/)?.[1]
        || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
      const verse = paragraph.cloneNode(true);
      verse.className = 'namdev-gatha-verse-block';
      verse.removeAttribute('style');
      verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
      const walker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
      let firstTextNode = walker.nextNode();
      while (firstTextNode && !normalizeText(firstTextNode.textContent || '')) firstTextNode = walker.nextNode();
      if (firstTextNode) firstTextNode.textContent = (firstTextNode.textContent || '').replace(/^\s*[?-?1-6]\s*/, '');
      verse.querySelector('br')?.remove();

      const card = document.createElement('article');
      card.className = 'namdev-gatha-section-card gora-sangit-section-card';
      card.id = `gora-kumbhar-sangit-${index + 1}`;
      const badge = document.createElement('span');
      badge.className = 'namdev-gatha-section-number';
      badge.textContent = `????? ${number}`;
      const content = document.createElement('div');
      content.className = 'namdev-gatha-section-content';
      content.appendChild(verse);
      card.append(badge, content);
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `????? ${number}`));
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
    postContent.querySelector(':scope > .abhang-post-actions')?.remove();

    if (slug === 'rohidas-pothi') {
      document.body.classList.add('haripath-meaning-normal-page', 'rohidas-pothi-page');
      const card = document.createElement('div');
      card.className = 'haripath-complete-card rohidas-pothi-card';
      Array.from(entry.children).forEach((node) => {
        const text = normalizeText(node.textContent || '');
        if (node.matches('hr') || /??? ??????? ???? ??????/.test(text) || !text) return;
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
        /^??? ??????? ????\s*[��-]\s*[?-?0-9]+$/.test(normalizeText(paragraph.textContent || ''))
      );
      headings.forEach((heading, index) => {
        const headingText = normalizeText(heading.textContent || '');
        const number = headingText.match(/([?-?0-9]+)$/)?.[1]
          || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
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
        badge.textContent = `???? ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `???? ${number}`));
        list.appendChild(card);
      });
    } else if (slug === 'rohidas-pade') {
      const headings = Array.from(entry.querySelectorAll(':scope > p')).filter((paragraph) =>
        /^[?-?0-9]+[.)]\s*/.test(normalizeText(paragraph.textContent || '')) && paragraph.querySelector('strong')
      );
      headings.forEach((heading, index) => {
        const headingText = normalizeText(heading.textContent || '');
        const number = headingText.match(/^([?-?0-9]+)/)?.[1]
          || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
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
        badge.textContent = `?? ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `?? ${number}`));
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
            const marker = line.match(/^([?-?0-9]+)[.)]\s*(.+)$/);
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
        badge.textContent = `????? ${poem.number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content';
        content.appendChild(verse);
        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `????? ${poem.number}`));
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
      manglacharan: '????????',
      balkrida: '?????????',
      nilobarai: '????',
      nilobaray: '???????????',
      gaulani: '????',
      virhani: '???????',
      'nilobaray-dnyanpar': '???????',
      'nilobaray-changdev-charitra': '??????',
      'nilobaray-changdev-charitra-2': '??????',
      'nilobaray-kala': '????',
      'nilobaray-khel': '???',
      'nilobaray-lalit': '????',
      pandharimahatyma: '??????????????'
    };
    const numberedSection = slug.match(/^nilobaray-(\d+)$/);
    const numberedSectionValue = numberedSection ? Number(numberedSection[1]) : 0;
    if (numberedSectionValue >= 4 && numberedSectionValue <= 23) {
      labels[slug] = '????';
    }
    if (!labels[slug]) return;

    const article = document.querySelector('.abhang-post, .post-article');
    const postContent = article?.querySelector('.post-content');
    const entry = postContent?.querySelector('.entry-content')
      || postContent?.querySelector('.verse_style [itemprop="text"]')
      || postContent?.querySelector('.verse_style');
    if (!article || !postContent || !entry || entry.dataset.nilobarayCards === 'true') return;

    const verses = Array.from(entry.querySelectorAll(':scope > p')).filter((paragraph) =>
      /^[?-?0-9]+[.)]?\s*/.test(normalizeText(paragraph.innerText || paragraph.textContent || ''))
    );
    if (!verses.length) return;

    const verseNumber = (paragraph) => {
      const rawNumber = normalizeText(paragraph.innerText || paragraph.textContent || '')
        .match(/^([?-?0-9]+)/)?.[1] || '0';
      return Number(rawNumber.replace(/[?-?]/g, (digit) => String('??????????'.indexOf(digit))));
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
      const explicitNumber = text.match(/^([?-?0-9]+)[.)]?\s*/)?.[1];
      const number = explicitNumber
        || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
      const verse = paragraph.cloneNode(true);
      verse.className = 'namdev-gatha-verse-block';
      verse.removeAttribute('style');
      verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
      const walker = document.createTreeWalker(verse, NodeFilter.SHOW_TEXT);
      let firstTextNode = walker.nextNode();
      while (firstTextNode && !normalizeText(firstTextNode.textContent || '')) firstTextNode = walker.nextNode();
      if (firstTextNode) {
        firstTextNode.textContent = (firstTextNode.textContent || '').replace(/^\s*[?-?0-9]+[.)]?\s*/, '');
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
        const foundNumber = rawText.match(/^([?-?0-9]+)\s*[.)?-]?\s*/)?.[1];
        const displayNumber = foundNumber || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
        const card = document.createElement('article');
        card.className = 'namdev-gatha-section-card eknath-gaulani-card';
        card.id = `eknath-gaulan-${index + 1}`;

        const badge = document.createElement('span');
        badge.className = 'namdev-gatha-section-number';
        badge.textContent = `???? ${displayNumber}`;

        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content eknath-gaulani-content';
        const verse = paragraph.cloneNode(true);
        verse.className = 'namdev-gatha-verse-block eknath-gaulani-verse';
        verse.removeAttribute('style');
        verse.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
        const firstTextNode = Array.from(verse.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
        if (firstTextNode) firstTextNode.nodeValue = firstTextNode.nodeValue.replace(/^\s*[?-?0-9]+\s*[.)?-]?\s*/, '');
        content.appendChild(verse);

        card.append(badge, content);
        card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `????????? ???? ${displayNumber}`));
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
        const number = String(index).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
        badge.textContent = index === 0 ? '????' : `????? ${number}`;
        const content = document.createElement('div');
        content.className = 'namdev-gatha-section-content hastaamalak-shlok-content';

        nodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.matches('h2')) return;
          const text = normalizeText(node.textContent || '');
          if (/^????????\s+??????$/.test(text)) return;
          if (node.nodeType === Node.ELEMENT_NODE) {
            node.removeAttribute('style');
            node.querySelectorAll?.('[style]').forEach((element) => element.removeAttribute('style'));
          }
          content.appendChild(node);
        });

        card.append(badge, content);
        card.insertAdjacentHTML(
          'beforeend',
          getAbhangItemActionsMarkup(card.id, index === 0 ? '???????? ????' : `???????? ????? ${number}`)
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
        const number = String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
        const rawTitle = normalizeText(nodes.find((node) =>
          node.nodeType === Node.ELEMENT_NODE && node.matches('h2, p') && node.querySelector('strong')
        )?.textContent || '');
        let label = `??? ${number}`;
        if (slug === 'chiranjivpad') label = `?? ${number}`;
        if (slug === 'shukashtak') {
          const shlokNumber = rawTitle.match(/?????\s*([?-?0-9]+)/)?.[1];
          label = shlokNumber ? `????? ${shlokNumber}` : rawTitle.replace(/^????????\s*[��-]\s*/, '') || `??? ${number}`;
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
          heading.textContent = rawTitle.replace(/^(?:??????????|?????????? ?????)\s*[��-]\s*/, '');
          content.appendChild(heading);
        }

        nodes.forEach((node, nodeIndex) => {
          if (node.nodeType === Node.ELEMENT_NODE && node.matches('h2')) return;
          const text = normalizeText(node.textContent || '');
          if (!text || /(?:??????|^?????$)/.test(text)) return;
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
      if (/??????/.test(normalizeText(paragraph.textContent || ''))) {
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
        /???????????????/.test(text)
        || /??? ????.*??????/.test(text)
        || /^??????\s+?????\s+??????\s*[?-?0-9]+(?:\s*[��-]?\s*(?:????|?????????))?\s*$/.test(text)
        || /^\(????????\s*[?-?0-9]+\s*??\s*[?-?0-9]+\)?\s*$/.test(text)
      ) element.remove();
    });

    const hasNumberedVerses = /?\s*[?-?0-9]+\s*?/.test(normalizeText(entry.textContent || ''));
    if (!hasNumberedVerses) {
      document.body.classList.add('eknathi-bhagwat-missing-page');
      postContent.querySelector(':scope > .abhang-post-actions')?.remove();
      const unavailable = document.createElement('div');
      unavailable.className = 'dnyaneshwari-chapter-card eknathi-missing-card';
      unavailable.innerHTML = '<p>?? ????????? ???????? ??? ? ???? ????? ????? ?????? ????.</p>';
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
          .replace(/^?????????????\s*[-��:?]?\s*/, '')
          .trim();
        if (
          !text
          || /^ref:|??????/.test(text)
          || /^??? ????.*??????/.test(text)
          || /^(?:??????)??????????.*???????/.test(text)
          || /^?????????????/.test(text)
        ) return;
        tokens.push({
          text,
          isVerse: Boolean(holder.querySelector('strong, b')) || /[??]/.test(text),
          completesVerse: /?\s*[?-?0-9]+\s*?/.test(text)
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
      return /[??]/.test(text) && !/^ref:/.test(text);
    });

    const card = document.createElement('div');
    card.className = 'dnyaneshwari-chapter-card bhavarth-ramayan-reading-card';
    if (!verseParagraphs.length) {
      card.classList.add('bhavarth-ramayan-missing-card');
      card.innerHTML = '<p>?? ????????? ???????? ??? ????? ????? ?????? ????.</p>';
    } else {
      paragraphs.forEach((paragraph) => {
        const text = normalizeText(paragraph.textContent || '');
        if (!text || /^ref:|?????????????.*?????????????|??? ???????|�/.test(text)) return;
        paragraph.removeAttribute('style');
        paragraph.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
        if (paragraph.classList.contains('bhavarth-ramayan-source-heading')) {
          paragraph.className = 'bhavarth-ramayan-source-heading';
        } else if (/[??]/.test(text)) {
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

    const devanagariToAscii = (value = '') => Number(
      [...value].map((char) => {
        const index = '??????????'.indexOf(char);
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
      if (!text || !/[??]/.test(text)) return;
      const lines = (paragraph.innerText || paragraph.textContent || '')
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter(Boolean);
      if (!lines.length) return;
      const explicitNumber = lines[0].match(/^([?-?0-9]+)[.)]?\s*/)?.[1]
        || String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
      lines[0] = lines[0].replace(/^[?-?0-9]+[.)]?\s*/, '');

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
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `?????? ${explicitNumber}`));
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
        if (!text || node.matches('h1, h2, h3, h4') || /^[?-?0-9]+[.)]?$/.test(text)
          || /^??? ??????????? ??????\s*[��-]?\s*[?-?0-9]*$/.test(text)) return;
        const clone = node.cloneNode(true);
        clone.querySelectorAll?.('br').forEach((br) => br.replaceWith('\n'));
        (clone.textContent || '').split(/\n+/).map((line) => normalizeText(line)).filter(Boolean)
          .forEach((line) => lines.push(line));
      });
      if (!lines.length) return;

      const section = document.createElement('section');
      section.className = 'abhang-readable-item';
      section.id = `nivruttinath-haripath-${index + 1}`;
      const itemNumber = String(index + 1).replace(/[0-9]/g, (digit) => '??????????'[Number(digit)]);
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
      section.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(section.id, `?????? ${itemNumber}`));
      list.appendChild(section);
    });

    const card = document.createElement('div');
    card.className = 'haripath-complete-card nivruttinath-haripath-card';
    card.appendChild(list);
    article.querySelector('.abhang-action-toolbar')?.remove();
    postContent.replaceChildren(card);
  };

  formatNivruttinathHaripathPage();

  const normalizeMalformedDnyaneshwariContent = () => {
    const path = location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!/\/sants\/dnyaneshwar\/adhyay-(13|14)\//.test(path)) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.adhyayNormalized === 'true') return;

    const markerPattern = /?\s*[?-?0-9]+\s*?|[?-?]{2,3}\./;
    const isVerseText = (text = '') => (text.match(/[??]/g) || []).length >= 3;
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
      const segmentPattern = /([\s\S]*??\s*[?-?0-9]+\s*?)/g;
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
      const endMarkers = Array.from(text.matchAll(/?\s*[?-?0-9]+\s*?|[?-?]{2,3}\./g));
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

    const devanagariDigits = '??????????';
    const toDevanagari = (value = '') => String(value).replace(/[0-9]/g, (digit) => devanagariDigits[Number(digit)]);
    const normalizeGathaText = (value = '') => normalizeText(value).replace(/\s+/g, ' ').trim();
    const getTitle = () => normalizeGathaText(document.querySelector('.post-title')?.textContent || document.title.replace(/\s*[-�].*$/, ''));
    const isCategoryNote = (value = '') => /????\s*[?-?0-9]+\s*(?:??|??|to)\s*[?-?0-9]+/i.test(value) && !/?[?-?0-9????]+?/.test(value);
    const getAbhangNumber = (value = '') => {
      const match = normalizeGathaText(value).match(/^([?-?0-9]+)\s*[.)]?$/);
      return match?.[1] || '';
    };
    const cleanVerseLine = (value = '') => normalizeGathaText(value)
      .replace(/\s+(?[?-?0-9????]+?)\s*$/, '\u00a0$1')
      .replace(/\s+(???????)\s*$/, '\u00a0$1');
    const makeParagraph = (line, className = '') => {
      const p = document.createElement('p');
      if (className) p.className = className;
      p.textContent = line;
      return p;
    };

    const items = [];
    Array.from(sourceRoot.querySelectorAll('p')).forEach((paragraph) => {
      let paragraphText = paragraph.innerText || paragraph.textContent || '';
      paragraphText = paragraphText.replace(/^\s*[^\n]*(?:????\s*[?-?0-9]+\s*(?:??|??|to)\s*[?-?0-9]+)[^\n]*\n+/i, '');
      const text = normalizeGathaText(paragraphText);
      if (!text || isCategoryNote(text)) return;

      const firstLine = normalizeGathaText(paragraphText.split(/\r?\n/).find(Boolean) || text);
      const number = getAbhangNumber(firstLine) || getAbhangNumber(normalizeGathaText(paragraph.querySelector('strong')?.textContent || ''));
      if (!number) return;

      const lines = paragraphText
        .replace(new RegExp(`^\\s*${number}\\s*[.)]?\\s*`), '')
        .split(/\r?\n|(?<=?[?-?0-9????]+?)\s+/)
        .map(cleanVerseLine)
        .filter(Boolean);
      if (!lines.length) return;

      const titleLine = cleanVerseLine(lines[0]).replace(/\s*?.*$/, '').replace(/\s*?.*$/, '').trim() || `???? ${number}`;
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
      numberEl.textContent = `???? ${toDevanagari(item.number)}`;
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
    empty.textContent = '??????? ???? ?????? ?????.';
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

const standaloneNumberPattern = /^[?-?0-9]+[.)]?$/u;
    Array.from(entryContent.querySelectorAll('p')).forEach((numberParagraph) => {
      const numberText = (numberParagraph.innerText || numberParagraph.textContent || '').trim();
      const verseParagraph = numberParagraph.nextElementSibling;
      if (!standaloneNumberPattern.test(numberText) || verseParagraph?.tagName !== 'P') return;
      if (!/?/.test(verseParagraph.innerText || verseParagraph.textContent || '')) return;

      numberParagraph.innerHTML = `${numberParagraph.innerHTML.trim()}<br>${verseParagraph.innerHTML}`;
      verseParagraph.remove();
    });

    const heavyFontClasses = ['font-bold', 'font-semibold', 'font-medium', 'font-extrabold'];
    entryContent.classList.remove(...heavyFontClasses);
    entryContent.querySelectorAll('.font-bold, .font-semibold, .font-medium, .font-extrabold').forEach((element) => {
      element.classList.remove(...heavyFontClasses);
    });

    const stanzaEndPattern = /?(?:[?-?0-9]+|????\.?|?????)?\s*$/u;
    const gathaNumberPattern = /(?:^|\n)\s*[?-?0-9]+[.)]?(?:\s|$)/u;
    entryContent.querySelectorAll('p').forEach((paragraph) => {
      const paragraphText = paragraph.innerText || paragraph.textContent || '';
      if (!gathaNumberPattern.test(paragraphText) || !/?/.test(paragraphText)) return;

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
      const numberMatch = firstLine.match(/^([?-?0-9]+)[.)]?$/u);
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
      badge.textContent = `???? ${number}`;
      card.append(badge, cardVerse);
      card.insertAdjacentHTML('beforeend', getAbhangItemActionsMarkup(card.id, `???? ${number}`));
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

      if (/^(?:???\s+??????????\s+??????\s*[?-?0-9,\s]+(?:??????)?|ref\s*:\s*bhavtarang)$/i.test(text)) {
        element.remove();
        return;
      }

      if (/??????\s*\/|???????|?????????|??????\s*[?-?0-9]+\s*[�-]/.test(text)) {
        element.remove();
        return;
      }

      if (element.matches('p') && element.querySelector('strong') && /?/.test(text)) {
        element.classList.add('virani-main-lines');
        return;
      }

      if (element.matches('p')) {
        if (text === '? ??? ? ?') {
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

    const paragraphs = Array.from(entry.querySelectorAll(''p''));
    const isMeaningLine = (value) => /^(?:?????|??????|?\.|?\.|?\. ??\.|?\. ??\.|?????|?????|???|???|????|??????????|??????\.)/.test(value);
    const isVerseLine = (value) => {
      if (!value || isMeaningLine(value) || /^[0-9]+[.?)]/.test(value) || value.length > 110) return false;
      const devanagariRatio = (value.match(/[\u0900-\u097F]/g) || []).length / Math.max(value.length, 1);
      return devanagariRatio >= 0.5 && (/[?]$/.test(value) || /[?]/.test(value) || (/[?]$/.test(value) && value.length <= 80));
    };

    for (let index = 0; index < paragraphs.length; index += 1) {
      const paragraph = paragraphs[index];
      const text = normalizeText(paragraph.textContent || '');
      if (!text) continue;

      if (paragraph.classList.contains(''hdr2'') || paragraph.classList.contains(''hdr3'')) {
        paragraph.classList.add(''amrutanubhav-chapter-title'');
        continue;
      }

      if (isMeaningLine(text) || text.length > 140) {
        paragraph.classList.add(''meaning-text'');
        continue;
      }

      const verseRun = [paragraph];
      let probe = index + 1;
      while (probe < paragraphs.length) {
        const candidate = paragraphs[probe];
        const candidateText = normalizeText(candidate.textContent || '');
        if (!candidateText) {
          probe += 1;
          continue;
        }
        if (candidate.classList.contains(''hdr2'') || candidate.classList.contains(''hdr3'') || isMeaningLine(candidateText) || candidateText.length > 140) {
          break;
        }
        if (isVerseLine(candidateText)) {
          verseRun.push(candidate);
          probe += 1;
          continue;
        }
        break;
      }

      if (isVerseLine(text) || verseRun.length > 1) {
        const verseWrapper = document.createElement(''div'');
        verseWrapper.className = ''verse'';
        paragraph.parentNode.insertBefore(verseWrapper, paragraph);
        verseRun.forEach((line) => {
          line.classList.add(''amrutanubhav-verse'');
          line.removeAttribute(''style'');
          verseWrapper.appendChild(line);
        });
        index = probe - 1;
      } else {
        paragraph.classList.add(''meaning-text'');
      }
    }    const actions = document.querySelector('.abhang-post .post-content > .abhang-post-actions');
    if (actions) entry.appendChild(actions);
  };

  formatAmrutanubhavPage();
  const formatChangdevPasashtiPage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/changdev-pasashti/')) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.changdevFormatted === 'true') return;
    entry.dataset.changdevFormatted = 'true';
    document.body.classList.add('changdev-pasashti-page');
    entry.classList.add('changdev-reading-card');

    Array.from(entry.querySelectorAll('p')).forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      if (!text) return;

      if (/^(?:?????\s+???????\s+???????|???????????????????????|????\s+???????\s+???????|?????\s+?????????\s+???\s+??????????????)/.test(text)) {
        paragraph.remove();
        return;
      }

      if (paragraph.querySelector('b, strong') && /?\s*[?-?0-9]+\s*?|?\s*[?-?0-9]+\s*?/.test(text)) {
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
  const formatDnyaneshwarPasaydanPage = () => {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (!path.includes('/sants/dnyaneshwar/pasaydan/')) return;

    const entry = document.querySelector('.abhang-post .entry-content');
    if (!entry || entry.dataset.pasaydanFormatted === 'true') return;
    entry.dataset.pasaydanFormatted = 'true';
    document.body.classList.add('dnyaneshwar-pasaydan-page');
    entry.classList.add('pasaydan-reading-card');

    Array.from(entry.querySelectorAll('p')).forEach((paragraph) => {
      const text = normalizeText(paragraph.textContent || '');
      if (!text) return;

      if (text === '???????') {
        const wrapper = paragraph.closest('.msg');
        if (wrapper && normalizeText(wrapper.textContent || '') === '???????') {
          wrapper.remove();
        } else {
          paragraph.remove();
        }
        return;
      }

      if (/?\s*[?-?0-9]+\s*?/.test(text)) {
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
    const meaningLabelPattern = /^\s*(\u0905\u0930\u094D\u0925|\u092D\u093E\u0935\u093E\u0930\u094D\u0925|meaning)\s*[::\-��]?\s*$/i;

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

        if ((hasOrangeVerse || looksNumberedVerse || (isCentered && verseMarkerPattern.test(text))) && !/^\s*\u0905\u0930\u094D\u0925\s*[::\-��]/i.test(text)) {
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
    const markerPattern = /?\s*[?-?0-9]+\s*?/g;

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
      <button class="abhang-btn social-share-btn copy-link-share-btn" data-platform="copylink" aria-label="???? ???? ???">
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
    showToast(copied ? '???? ???? ????.' : '???? ???? ???? ??? ????.');
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
    .replace(/[??.,:;!?()\[\]{}"'`~|/\\_-]+/g, ' ')
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
          <span class="search-result-type">${escapeHtml(result.type || '???????')}</span>
          <span class="search-result-saint">${escapeHtml(result.saint || '')}</span>
        </div>
        <div class="search-result-title">${libraryHighlight(result.title || result.heading || '?????', query)}</div>
        <div class="search-result-description">${libraryHighlight(result.excerpt || result.description || '', query)}</div>
      </div>
      ${compact ? '' : '<span class="search-result-view-btn">???</span>'}
    </a>
  `;

  const libraryRenderResults = (query, results, titleNode, listNode, compact = false) => {
    if (!titleNode || !listNode) return;
    titleNode.textContent = query ? `"${query}" ???? ${results.length} ?????` : '??? ??????';
    listNode.innerHTML = results.length
      ? results.map((result) => libraryResultMarkup(result, query, compact)).join('')
      : '<div class="search-empty-state">?? ???????? ?????? ?????? ?????.</div>';
  };

  const libraryGoToSearchPage = (query) => {
    const value = (query || '').trim();
    if (!value) {
      showToast('????? ??? ???? ????.');
      return;
    }
    window.location.href = `${librarySearchPageUrl}?q=${encodeURIComponent(value)}`;
  };

  const libraryWireInput = (input, listNode, titleNode, options = {}) => {
    if (!input || input.dataset.librarySearchReady === 'true') return;
    input.dataset.librarySearchReady = 'true';
    input.setAttribute('placeholder', '????, ???? ????? ??????? ??? ????...');

    const runSuggestions = async () => {
      const query = input.value.trim();
      if (!query) {
        if (listNode) listNode.innerHTML = '';
        if (titleNode) titleNode.textContent = options.title || '??? ?????';
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
          <input class="library-search-input" type="search" placeholder="????, ???? ????? ??????? ??? ????..." aria-label="????, ???? ????? ??????? ??? ????">
          <button class="library-search-submit" type="button">????</button>
        </div>
        <div class="library-search-suggestions" hidden>
          <div class="search-results-header">
            <span class="search-results-title">??? ?????</span>
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
    libraryWireInput(input, listNode, titleNode, { limit: 7, title: '??? ?????' });
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
    libraryWireInput(input, listNode, titleNode, { limit: 30, title: '??? ??????' });
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
      libraryWireInput(modalInput, listNode, titleNode, { limit: 8, title: '??? ?????' });
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
    const verseEndPattern = /?\s*[?-?0-9]+(?:[-�][?-?0-9]+)?\s*?/g;

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
    const openingNumberPattern = /^\s*[?-?0-9]+\s*[.)?:-]\s*/u;
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
      '.post-title', '.sant-title'
    ].join(', ');

    roots.forEach((root) => {
      const readingNodes = [root, ...root.querySelectorAll('*')];
      readingNodes.forEach((node) => {
        if (!(node instanceof HTMLElement) || node.matches(skipSelector)) return;
        node.style.setProperty('font-weight', '300', 'important');
        node.style.setProperty('font-synthesis', 'none', 'important');
        const eknathHaripathReading = document.body.classList.contains('eknath-haripath-page')
          && Boolean(node.closest('.eknath-haripath-card'));
        node.style.setProperty(
          'font-family',
          eknathHaripathReading
            ? '"Nirmala UI Semilight", "Nirmala UI", "Segoe UI", sans-serif'
            : 'Helvetica, "Kokila", "Mangal", Verdana, sans-serif',
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
        const label = `??? ${index + 1}`;
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
  enforceNormalReadingWeight();
  sortBlogCardsNewestFirst();
  libraryInitSearchBars();
  libraryInitSearchPage();});
































