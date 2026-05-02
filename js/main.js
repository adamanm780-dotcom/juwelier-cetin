/* ===============================================
   JUWELIER LEMI — Interactions
   =============================================== */

(() => {
  'use strict';

  /* ---------- NAV SCROLL STATE ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- MOBILE MENU ---------- */
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- HERITAGE MARQUEE (duplicate for seamless loop) ---------- */
  const track = document.getElementById('heritageTrack');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  /* ---------- HERO MARBLE PARALLAX (subtle) ---------- */
  const marble = document.querySelector('.hero-marble');
  if (marble && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            marble.style.transform = `translateY(${y * 0.22}px) scale(${1 + y * 0.00015})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- HERO FIGURE MICRO PARALLAX ---------- */
  const heroFig = document.querySelector('.hero-figure');
  if (heroFig && window.matchMedia('(pointer: fine)').matches) {
    const container = heroFig.parentElement;
    container.addEventListener('mousemove', e => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroFig.style.transform = `rotate(1.5deg) translate(${x * 6}px, calc(-2% + ${y * 4}px))`;
    });
    container.addEventListener('mouseleave', () => {
      heroFig.style.transform = '';
    });
  }

  /* ---------- YEAR ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- SMOOTH SCROLL (anchor offset for fixed nav) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

})();
