document.addEventListener('DOMContentLoaded', () => {
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

  // --- Copy Abhang Content ---
  const copyBtns = document.querySelectorAll('.copy-abhang-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.abhang-card') || e.target.closest('.arrival-card');
      if (card) {
        const textContent = card.querySelector('.abhang-content')?.innerText || 
                            card.querySelector('.arrival-excerpt')?.innerText;
        const title = card.querySelector('.abhang-card-title')?.innerText || 
                      card.querySelector('.arrival-title')?.innerText;
        
        if (textContent) {
          const fullText = `${title}\n\n${textContent}\n\n- वाकीभ संतसाहित्य`;
          navigator.clipboard.writeText(fullText).then(() => {
            showToast('अभंग क्लिपबोर्डवर कॉपी केला!');
            // Visual feedback on button
            const icon = btn.querySelector('i');
            if (icon) {
              icon.className = 'fas fa-check';
              icon.style.color = '#25d366';
              setTimeout(() => {
                icon.className = 'far fa-copy';
                icon.style.color = '';
              }, 2000);
            }
          }).catch(err => {
            console.error('Copy failed: ', err);
          });
        }
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
          showToast('अभंग आवडत्या यादीत जोडला!');
        } else {
          icon.style.color = '';
        }
      }
    });
  });

  // --- Share Button Action (Web Share API fallback to copy link) ---
  const shareBtns = document.querySelectorAll('.share-abhang-btn');
  shareBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.abhang-card') || e.target.closest('.arrival-card');
      const title = card ? (card.querySelector('.abhang-card-title')?.innerText || card.querySelector('.arrival-title')?.innerText) : 'वाकीभ संतसाहित्य';
      
      if (navigator.share) {
        navigator.share({
          title: title,
          text: `वाकीभ संतसाहित्य वरून वाचा: ${title}`,
          url: window.location.href
        }).then(() => {
          showToast('यशस्वीरीत्या शेअर केले!');
        }).catch(err => {
          console.log('Share canceled or failed', err);
        });
      } else {
        // Fallback to copying link
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('वेबसाइट लिंक कॉपी केली! सोशल मीडियावर शेअर करा.');
        });
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
      showToast('कृपया शोधण्यासाठी काहीतरी टाईप करा.');
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
      showToast(`शोध जुळला: ${query}`);
    } else {
      showToast('कोणतीही जुळणी सापडली नाही.');
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

  // --- Audio Player Logic ---
  const audio = new Audio();
  audio.src = 'Vakibh/vaakibh_audio.mp3';

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

  // Play/Pause State
  const togglePlay = () => {
    if (audio.paused) {
      // Pause any running card audio players
      stopAllCardAudio();
      
      audio.play().then(() => {
        if (playIcon) playIcon.className = 'fas fa-pause';
        showToast('ऑडिओ सुरू झाला.');
      }).catch(err => {
        console.error("Audio playback error: ", err);
        showToast('ऑडिओ चालू करू शकत नाही.');
      });
    } else {
      audio.pause();
      if (playIcon) playIcon.className = 'fas fa-play';
      showToast('ऑडिओ थांबवला.');
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

  audio.addEventListener('ended', () => {
    if (playIcon) playIcon.className = 'fas fa-play';
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
        if (volumeSlider) volumeSlider.value = 0;
      } else {
        const prev = audio.dataset.prevVolume || 1;
        audio.volume = prev;
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
        if (playIcon) playIcon.className = 'fas fa-play';
      }

      const isPlaying = btn.classList.contains('playing');
      stopAllCardAudio();

      if (!isPlaying) {
        btn.classList.add('playing');
        btn.innerHTML = '<i class="fas fa-pause"></i>';
        if (cardAudioIndicator) {
          cardAudioIndicator.textContent = 'चालू आहे...';
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
});
