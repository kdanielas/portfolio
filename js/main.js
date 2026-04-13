document.addEventListener('DOMContentLoaded', () => {
  // Language switcher
  const savedLang = localStorage.getItem('portfolio-lang') || 'en';
  setLanguage(savedLang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
      localStorage.setItem('portfolio-lang', lang);
    });
  });

  // Set active nav item
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Mobile hamburger menu
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

    // Close menu on nav link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }


  function setLanguage(lang) {
    // Update buttons (both sidebar and mobile menu)
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    // Update elements with HTML content
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    document.documentElement.lang = lang;
  }

  // Paste this into your page's <script>
  const e1 = document.querySelector('.gradient-ellipse-1');
  const e2 = document.querySelector('.gradient-ellipse-2');
  const container = document.querySelector('.contact-page'); // adjust selector

  let mouseX = null, mouseY = null;
  let t = 0;
  let c1x = 0, c1y = 0, c2x = 0, c2y = 0;
  let target1x = 0, target1y = 0, target2x = 0, target2y = 0;

  container.addEventListener('mousemove', (ev) => {
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
});