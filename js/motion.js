/**
 * motion.js — Premium scroll experience & micro-interactions
 * Lightweight, dependency-free animation engine for scroll reveals,
 * parallax, idle floating, and magnetic hover effects.
 */
(function () {
  'use strict';

  // Respect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Utility ──────────────────────────────────────────────────
  function lerp(a, b, n) { return a + (b - a) * n; }

  // ─── 1. Scroll-Triggered Reveal System ────────────────────────
  // Case-study pages mark whole sections with data-reveal, but the
  // individual items inside them (feature cards, list rows, pills,
  // metrics...) had no reveal of their own. Auto-tag the common repeating
  // "item" classes here instead of hand-editing every case-study file, and
  // stagger siblings so lists/grids cascade in rather than popping together.
  const AUTO_REVEAL_SELECTOR = [
    '.pain-item', '.pill', '.grid3 > .card', '.out-summary-grid > div',
    '.learn-item', '.metric', '.cs-sol-feature', '.tk-grid > .card', '.step'
  ].join(',');

  function autoTagRevealItems() {
    const groups = new Map();
    document.querySelectorAll(AUTO_REVEAL_SELECTOR).forEach(el => {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
      const parent = el.parentElement;
      const i = groups.get(parent) || 0;
      el.setAttribute('data-reveal-delay', String(Math.min(i, 5) * 80));
      groups.set(parent, i + 1);
    });
  }

  function initScrollReveals() {
    autoTagRevealItems();
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length) return;

    if (prefersReducedMotion) {
      // Show everything immediately
      revealEls.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.revealDelay || '0', 10);

          if (delay > 0) {
            setTimeout(() => el.classList.add('is-visible'), delay);
          } else {
            el.classList.add('is-visible');
          }

          // One-shot: unobserve after reveal
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
  }

  // ─── 2. Unified Background Motion (Parallax + Idle Float) ─────
  function initBackgroundMotion() {
    const floaters = document.querySelectorAll('.gradient-ellipse, .contact-glow');
    if (!floaters.length) return;
    if (prefersReducedMotion) return;

    // Skip if contact page has its own richer mouse-follow animation
    const hasContactPage = document.querySelector('.contact-page');
    if (hasContactPage) return;

    let scrollY = window.scrollY;
    let ticking = false;

    // Track scroll position
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          scrollY = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    let t = 0;
    const state = Array.from(floaters).map((el, i) => {
      // Determine parallax multipliers based on element class
      let scrollMultY = 0;
      let scrollMultX = 0;
      if (el.classList.contains('gradient-ellipse-1')) {
        scrollMultY = 0.25;
        scrollMultX = 0.08;
      } else if (el.classList.contains('gradient-ellipse-2')) {
        scrollMultY = -0.20;
        scrollMultX = -0.06;
      }

      return {
        el,
        cx: 0, cy: 0, cr: 0, cs: 1,
        // Frequencies for organic motion
        freqX: 0.2 + i * 0.1,
        freqY: 0.15 + i * 0.08,
        freqR: 0.1 + i * 0.05,
        // Doubled amplitudes to restore the dynamic feeling now that they are separated
        ampX: 80 + i * 40,
        ampY: 60 + i * 30,
        ampR: 10 + i * 5,
        scrollMultY,
        scrollMultX
      };
    });

    function animate() {
      t += 0.005;

      state.forEach(s => {
        // Calculate idle float targets
        const floatX = Math.sin(t * s.freqX) * s.ampX + Math.sin(t * s.freqX * 1.7) * (s.ampX * 0.3);
        const floatY = Math.cos(t * s.freqY) * s.ampY + Math.cos(t * s.freqY * 1.5) * (s.ampY * 0.25);
        const floatR = Math.sin(t * s.freqR) * s.ampR;
        const floatS = 1 + Math.sin(t * (s.freqR * 0.8)) * 0.04; // Gentle scale between 0.96 and 1.04

        // Add scroll parallax offsets
        const targetX = floatX + (scrollY * s.scrollMultX);
        const targetY = floatY + (scrollY * s.scrollMultY);

        // Smoothly interpolate to targets
        s.cx = lerp(s.cx, targetX, 0.04);
        s.cy = lerp(s.cy, targetY, 0.04);
        s.cr = lerp(s.cr, floatR, 0.03);
        s.cs = lerp(s.cs, floatS, 0.03);

        s.el.style.transform = `translate(${s.cx}px, ${s.cy}px) rotate(${s.cr}deg) scale(${s.cs})`;
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ─── 4b. Home hero parallax (drift + fade as the Intro section covers it) ───
  function initHeroParallax() {
    const layer = document.getElementById('hero-parallax');
    if (!layer) return;
    if (prefersReducedMotion) return;

    let ticking = false;
    function update() {
      const y = window.scrollY;
      layer.style.transform = 'translateY(' + (y * 0.35) + 'px)';
      layer.style.opacity = Math.max(0, 1 - y / 400);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // ─── 4. Magnetic Hover Effect on CTA Buttons ──────────────────
  function initMagneticHover() {
    // Skip on touch devices
    if ('ontouchstart' in window) return;
    if (prefersReducedMotion) return;

    const buttons = document.querySelectorAll('.btn-primary, .top-nav-contact');
    if (!buttons.length) return;

    buttons.forEach(btn => {
      let animId = null;
      let cx = 0, cy = 0;
      let targetX = 0, targetY = 0;

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        targetX = (e.clientX - btnCenterX) * 0.2;
        targetY = (e.clientY - btnCenterY) * 0.2;

        if (!animId) {
          function tick() {
            cx = lerp(cx, targetX, 0.15);
            cy = lerp(cy, targetY, 0.15);
            btn.style.transform = `translate(${cx}px, ${cy}px)`;

            if (Math.abs(cx - targetX) > 0.1 || Math.abs(cy - targetY) > 0.1) {
              animId = requestAnimationFrame(tick);
            } else {
              animId = null;
            }
          }
          animId = requestAnimationFrame(tick);
        }
      });

      btn.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;

        function springBack() {
          cx = lerp(cx, 0, 0.12);
          cy = lerp(cy, 0, 0.12);
          btn.style.transform = `translate(${cx}px, ${cy}px)`;

          if (Math.abs(cx) > 0.3 || Math.abs(cy) > 0.3) {
            requestAnimationFrame(springBack);
          } else {
            btn.style.transform = '';
            cx = 0;
            cy = 0;
            animId = null;
          }
        }

        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
        requestAnimationFrame(springBack);
      });
    });
  }

  // ─── 5. Custom Inverting Cursor ────────────────────────────────
  // A small light dot that follows the pointer with mix-blend-mode:
  // difference, so it reads as a color-inverting circle over any
  // background. Grows over anything with cursor:pointer.
  function initCustomCursor() {
    if ('ontouchstart' in window) return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    document.body.classList.add('has-custom-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cx = mouseX;
    let cy = mouseY;
    let active = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!active) {
        active = true;
        cursor.style.opacity = '1';
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      active = false;
    });

    // cursor:none is applied to interactive elements below (to hide the
    // native pointer under the custom one), so their own computed cursor
    // can't be used to detect "clickable" — match by selector instead.
    const CLICKABLE = 'a, button, [role="button"], input, textarea, select, label, summary, .lang-btn, .hamburger, .top-nav-social, .work-num';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(CLICKABLE)) {
        cursor.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(CLICKABLE)) {
        cursor.classList.remove('is-hover');
      }
    });

    function animate() {
      const ease = prefersReducedMotion ? 1 : 0.2;
      cx = lerp(cx, mouseX, ease);
      cy = lerp(cy, mouseY, ease);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ─── 6. Hero Intro Sequence ────────────────────────────────────
  // Home hero only: the badge types itself out character by character,
  // then the title, subtitle, CTA and "Works" link fade in one after
  // another. Runs once on load — the hero is always in view, so the
  // scroll-triggered observer above isn't the right tool for staging this.
  function initHeroIntroSequence() {
    const badge = document.querySelector('.hero-badge-text');
    const sequenceEls = Array.from(document.querySelectorAll('.hero-sequence-item'));
    if (!badge || !sequenceEls.length) return;

    if (prefersReducedMotion) {
      sequenceEls.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const TYPE_SPEED = 70;   // ms per character
    const STAGGER = 250;     // ms between each subsequent reveal

    const chars = Array.from(badge.textContent);
    badge.textContent = '';

    let i = 0;
    function typeNext() {
      if (i < chars.length) {
        badge.textContent += chars[i];
        i++;
        setTimeout(typeNext, TYPE_SPEED);
      } else {
        sequenceEls.forEach((el, idx) => {
          setTimeout(() => el.classList.add('is-visible'), STAGGER * (idx + 1));
        });
      }
    }
    typeNext();
  }

  // ─── 7. Fast Scroll-To (Works link) ────────────────────────────
  // The "Works" scroll cue should snap down to the first project quickly
  // instead of the page's default (slower, linear-ish) CSS smooth-scroll —
  // a short duration with a hard ease-out reads as a quick pull toward the
  // section rather than a leisurely glide.
  function initFastScrollLinks() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('.hero-scroll-link[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.getElementById(link.getAttribute('href').slice(1));
        if (!target) return;
        e.preventDefault();

        const startY = window.scrollY;
        const targetY = target.getBoundingClientRect().top + startY;
        const distance = targetY - startY;
        const duration = 900;
        const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
        let startTime = null;

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          window.scrollTo(0, startY + distance * easeOutExpo(progress));
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    });
  }

  // ─── 8. Hamburger Auto-Contrast ────────────────────────────────
  // The hamburger is fixed in place while the page scrolls underneath it,
  // crossing both dark and light section backgrounds — mix-blend-mode
  // turned out unreliable against this page's actual stacking contexts, so
  // this samples the real element under the icon instead and flips a class
  // based on that background's luminance.
  function initHamburgerContrast() {
    const hamburger = document.getElementById('hamburger');
    if (!hamburger) return;

    function luminance(rgbStr) {
      const m = rgbStr.match(/[\d.]+/g);
      if (!m) return 0;
      const [r, g, b] = m.map(Number);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    // The hamburger sits inside the fixed .top-nav bar's own footprint.
    // When the bar has its own real background (solidified on scroll —
    // .scrolled/.nav-solid), THAT'S what's actually painted there and
    // should win. Only when it's transparent (showing the hero straight
    // through it) do we need to punch through it and the hamburger itself
    // so elementFromPoint can reach the real content behind both —
    // hero-band is a sibling of .top-nav, not a DOM ancestor, so walking
    // up from a hit inside the transparent nav would otherwise miss it.
    const topNav = document.getElementById('top-nav');
    function bgAt(x, y) {
      if (topNav) {
        const navBg = getComputedStyle(topNav).backgroundColor;
        if (navBg && navBg !== 'transparent' && navBg !== 'rgba(0, 0, 0, 0)') return navBg;
      }
      const restores = [hamburger, topNav].filter(Boolean).map(el => [el, el.style.pointerEvents]);
      restores.forEach(([el]) => { el.style.pointerEvents = 'none'; });
      let el = document.elementFromPoint(x, y);
      restores.forEach(([el, prev]) => { el.style.pointerEvents = prev; });
      while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
        el = el.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    }

    function update() {
      const rect = hamburger.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const isLight = luminance(bgAt(x, y)) > 0.6;
      hamburger.classList.toggle('on-light', isLight);
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
    // The very first call can land before layout/paint has fully settled,
    // sampling the wrong point and falling through to body's own light
    // background — re-check at a few more points so it settles correctly
    // regardless of how long that takes.
    window.addEventListener('load', update);
    requestAnimationFrame(() => requestAnimationFrame(update));
    setTimeout(update, 300);
    setTimeout(update, 1000);
  }

  // ─── Initialize ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveals();
    initBackgroundMotion();
    initHeroParallax();
    initMagneticHover();
    initCustomCursor();
    initHeroIntroSequence();
    initHamburgerContrast();
    initFastScrollLinks();
  });
})();
