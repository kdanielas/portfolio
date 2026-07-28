document.addEventListener('DOMContentLoaded', () => {
  // ─── Language switcher ───────────────────────────────────────
  const savedLang = localStorage.getItem('portfolio-lang') || 'en';
  setLanguage(savedLang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
      localStorage.setItem('portfolio-lang', lang);
    });
  });

  // ─── Active nav link ─────────────────────────────────────────
  // Top nav links + mobile menu links
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.top-nav a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ─── Smooth scrolling ────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ─── Page transitions ────────────────────────────────────────
  function isInternalLink(href) {
    return href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto');
  }

  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (!isInternalLink(href)) return;

    link.addEventListener('click', function (e) {
      const dest = this.getAttribute('href');
      const current = window.location.pathname.split('/').pop() || 'index.html';
      if (dest === current) return;

      e.preventDefault();
      const wrapper = document.querySelector('.page-wrapper') || document.querySelector('.main-content');
      if (wrapper) {
        wrapper.classList.add('page-exit');
        setTimeout(() => { window.location.href = dest; }, 300);
      } else {
        window.location.href = dest;
      }
    });
  });

  // ─── Mobile hamburger menu ───────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-overlay');

  if (hamburger && mobileMenu && mobileOverlay) {
    function openMenu() {
      hamburger.classList.add('active');
      mobileMenu.classList.add('active');
      mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
      if (mobileMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileOverlay.addEventListener('click', closeMenu);

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }

  // ─── Top nav scroll hide / show ──────────────────────────────
  const topNav = document.getElementById('top-nav');
  if (topNav) {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 80; // px before hide-on-scroll-down starts
    const SOLIDIFY_THRESHOLD = 20; // px before nav solidifies — matches the
    // Claude Design NavBar reference component (scrollY > 20)

    function updateNavScrolled(y) {
      // Also flips document.body so the mobile hamburger (fixed, outside
      // .top-nav) can switch from light to dark bars in step with the nav.
      const isScrolled = y > SOLIDIFY_THRESHOLD;
      topNav.classList.toggle('scrolled', isScrolled);
      document.body.classList.toggle('nav-scrolled', isScrolled);
    }
    updateNavScrolled(lastScrollY);

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY < SCROLL_THRESHOLD) {
            // Always show near the top
            topNav.classList.remove('nav-hidden');
          } else if (currentScrollY > lastScrollY) {
            // Scrolling down → hide
            topNav.classList.add('nav-hidden');
          } else {
            // Scrolling up → show
            topNav.classList.remove('nav-hidden');
          }

          updateNavScrolled(currentScrollY);

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─── Language handler ────────────────────────────────────────
  function setLanguage(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    document.documentElement.lang = lang;

    renderSkillChips();
  }

  // ─── Skills as chips ─────────────────────────────────────────
  // .skill-desc holds the same comma-separated i18n string it always did;
  // this just re-renders it as individual pill chips instead of plain text.
  // Runs after every setLanguage() call so it survives language switches.
  function renderSkillChips() {
    document.querySelectorAll('.skill-desc').forEach(el => {
      const parts = el.textContent.split(',').map(s => s.trim()).filter(Boolean);
      el.innerHTML = parts.map(p => `<span class="skill-chip">${p}</span>`).join('');
    });
  }

  // ─── Contact page ellipse animation ──────────────────────────
  const e1 = document.querySelector('.gradient-ellipse-1');
  const e2 = document.querySelector('.gradient-ellipse-2');
  const container = document.querySelector('.contact-page');

  if (e1 && e2 && container) {
    let mouseX = null, mouseY = null;
    let t = 0;
    let c1x = 0, c1y = 0, c2x = 0, c2y = 0;
    let target1x = 0, target1y = 0, target2x = 0, target2y = 0;

    container.addEventListener('mousemove', ev => {
      const rect = container.getBoundingClientRect();
      mouseX = ev.clientX - rect.left;
      mouseY = ev.clientY - rect.top;
    });

    container.addEventListener('mouseleave', () => {
      mouseX = null;
      mouseY = null;
    });

    function lerp(a, b, n) { return a + (b - a) * n; }

    function animate() {
      t += 0.008;
      const W = container.offsetWidth;
      const H = container.offsetHeight;

      if (mouseX !== null) {
        const normX = (mouseX / W - 0.5);
        const normY = (mouseY / H - 0.5);
        target1x = normX * 60 + Math.sin(t * 0.7) * 12;
        target1y = normY * 60 + Math.cos(t * 0.5) * 10;
        target2x = normX * -40 + Math.cos(t * 0.6) * 14;
        target2y = normY * -40 + Math.sin(t * 0.8) * 10;
      } else {
        target1x = Math.sin(t * 0.5) * 30 + Math.sin(t * 1.1) * 10;
        target1y = Math.cos(t * 0.4) * 20 + Math.cos(t * 0.9) * 8;
        target2x = Math.cos(t * 0.6) * 25 + Math.cos(t * 1.3) * 12;
        target2y = Math.sin(t * 0.5) * 18 + Math.sin(t * 1.1) * 7;
      }

      c1x = lerp(c1x, target1x, 0.04);
      c1y = lerp(c1y, target1y, 0.04);
      c2x = lerp(c2x, target2x, 0.035);
      c2y = lerp(c2y, target2y, 0.035);

      e1.style.transform = `translate(${c1x}px, ${c1y}px)`;
      e2.style.transform = `translate(${c2x}px, ${c2y}px)`;

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ─── Solution sidebar scroll-spy (scroll-position based) ─────
  const solLinks = document.querySelectorAll('.cs-sol-link');
  const solFeatures = document.querySelectorAll('.cs-sol-feature');

  if (solLinks.length && solFeatures.length) {
    const navH = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--topnav-height') || '64', 10
    );
    // The "trigger line" — section becomes active when its top crosses this y
    const TRIGGER_OFFSET = navH + 80;

    function setActiveSolLink(id) {
      solLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === id);
      });
    }

    function updateActiveSolLink() {
      // Walk sections from bottom to top — first one whose top <= trigger is active
      let activeId = solFeatures[0].id; // fallback to first
      solFeatures.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= TRIGGER_OFFSET) {
          activeId = section.id;
        }
      });
      setActiveSolLink(activeId);
    }

    // Click: set active immediately + smooth scroll
    solLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation(); // prevent page-transition handler
        const targetId = this.dataset.target;
        const target = document.getElementById(targetId);
        // Set active state immediately on click
        setActiveSolLink(targetId);
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - TRIGGER_OFFSET + 10;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });

    // Scroll: keep sidebar in sync using rAF throttle
    let spyTicking = false;
    window.addEventListener('scroll', () => {
      if (!spyTicking) {
        window.requestAnimationFrame(() => {
          updateActiveSolLink();
          spyTicking = false;
        });
        spyTicking = true;
      }
    }, { passive: true });

    // Run once on load
    updateActiveSolLink();
  }

  // ─── Home page: sticky case-study number rail (01/02/03) ──────
  // Matches the Claude Design reference's work-nums-fixed behavior — the
  // number for whichever case-study block is currently in view lights up.
  const workNums = document.querySelectorAll('.work-num');
  const workBlocks = document.querySelectorAll('.case-studies-section .case-study-card');
  const workNumsWrap = document.querySelector('.work-nums-fixed');

  if (workNums.length && workBlocks.length && workNumsWrap) {
    // Scroll-position based, same approach as the solution-sidebar spy
    // above: a card only counts as active once the viewport's TOP edge is
    // actually inside it (rect.top <= 0 and rect.bottom > 0) — i.e. the
    // card's own color is genuinely what's filling the screen, not just
    // "50% of the card has scrolled by somewhere below the fold" (which
    // could still leave the previous section's cream visible on screen).
    // Also resets opacity to 0 if you scroll back above card 1 or past
    // card 3, instead of staying visible forever once first triggered.
    let workTicking = false;
    function updateWorkNums() {
      let activeIdx = -1;
      workBlocks.forEach((block, i) => {
        const rect = block.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom > 0) {
          activeIdx = i;
        }
      });
      if (activeIdx === -1) {
        workNumsWrap.style.opacity = '0';
      } else {
        workNumsWrap.style.opacity = '1';
        workNums.forEach((n, i) => n.classList.toggle('active', i === activeIdx));
      }
      workTicking = false;
    }
    window.addEventListener('scroll', () => {
      if (!workTicking) {
        window.requestAnimationFrame(updateWorkNums);
        workTicking = true;
      }
    }, { passive: true });
    updateWorkNums();
  }
});
