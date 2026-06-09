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

  // ─── 2. Scroll-Linked Parallax on Gradient Ellipses ───────────
  function initParallax() {
    const ellipse1 = document.querySelector('.gradient-ellipse-1');
    const ellipse2 = document.querySelector('.gradient-ellipse-2');
    if (!ellipse1 && !ellipse2) return;
    if (prefersReducedMotion) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          if (ellipse1) {
            const y1 = scrollY * 0.08;
            const x1 = Math.sin(scrollY * 0.002) * 12;
            ellipse1.style.transform = `translate(${x1}px, ${y1}px)`;
          }

          if (ellipse2) {
            const y2 = scrollY * -0.05;
            const x2 = Math.cos(scrollY * 0.0015) * 8;
            ellipse2.style.transform = `translate(${x2}px, ${y2}px)`;
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─── 3. Idle Floating Animation for Decorative Elements ───────
  function initIdleFloat() {
    // Gather all gradient ellipses and contact glow orbs
    const floaters = document.querySelectorAll(
      '.gradient-ellipse, .contact-glow'
    );
    if (!floaters.length) return;
    if (prefersReducedMotion) return;

    // Skip if contact page has its own richer mouse-follow animation
    const hasContactPage = document.querySelector('.contact-page');
    if (hasContactPage) return;

    let t = 0;
    const state = Array.from(floaters).map((el, i) => ({
      el,
      cx: 0, cy: 0, cr: 0,
      // Each element gets unique frequencies for organic motion
      freqX: 0.3 + i * 0.15,
      freqY: 0.25 + i * 0.12,
      freqR: 0.18 + i * 0.08,
      ampX: 12 + i * 5,
      ampY: 10 + i * 4,
      ampR: 2 + i * 0.5
    }));

    function animate() {
      t += 0.006;

      state.forEach(s => {
        const targetX = Math.sin(t * s.freqX) * s.ampX + Math.sin(t * s.freqX * 1.7) * (s.ampX * 0.3);
        const targetY = Math.cos(t * s.freqY) * s.ampY + Math.cos(t * s.freqY * 1.5) * (s.ampY * 0.25);
        const targetR = Math.sin(t * s.freqR) * s.ampR;

        s.cx = lerp(s.cx, targetX, 0.03);
        s.cy = lerp(s.cy, targetY, 0.03);
        s.cr = lerp(s.cr, targetR, 0.025);

        s.el.style.transform = `translate(${s.cx}px, ${s.cy}px) rotate(${s.cr}deg)`;
      });

      requestAnimationFrame(animate);
    }

    animate();
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
    initParallax();
    initIdleFloat();
    initMagneticHover();
  });
})();
