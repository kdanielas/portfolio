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
  function initScrollReveals() {
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

  // ─── Initialize ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveals();
    initBackgroundMotion();
    initHeroParallax();
    initMagneticHover();
  });
})();
