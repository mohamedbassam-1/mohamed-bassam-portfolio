(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const header = document.getElementById('siteHeader');
  const scrollProgress = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = themeToggle?.querySelector('.theme-label');
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const cursorGlow = document.getElementById('cursorGlow');
  const copyrightYear = document.getElementById('copyrightYear');
  if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());

  // ------------------------------
  // Theme
  // ------------------------------
  const applyTheme = (theme) => {
    const useIce = theme === 'ice';
    body.classList.toggle('ice', useIce);
    if (themeLabel) themeLabel.textContent = useIce ? 'Night' : 'Ice';
    themeToggle?.setAttribute('aria-label', useIce ? 'Switch to night theme' : 'Switch to ice theme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', useIce ? '#eef8ff' : '#061327');
    localStorage.setItem('mb-portfolio-theme-final', theme);
  };

  const storedTheme = localStorage.getItem('mb-portfolio-theme-final');
  applyTheme(storedTheme === 'night' ? 'night' : 'ice');

  themeToggle?.addEventListener('click', () => {
    applyTheme(body.classList.contains('ice') ? 'night' : 'ice');
  });

  // ------------------------------
  // Mobile navigation
  // ------------------------------
  const closeMobileNav = () => {
    if (!mobileNav || !menuToggle) return;
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  };

  menuToggle?.addEventListener('click', () => {
    if (!mobileNav) return;
    const shouldOpen = mobileNav.hidden;
    mobileNav.hidden = !shouldOpen;
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Close menu' : 'Open menu');
  });

  mobileNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  document.addEventListener('click', (event) => {
    if (!mobileNav || mobileNav.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!mobileNav.contains(target) && !menuToggle?.contains(target)) closeMobileNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !mobileNav || mobileNav.hidden) return;
    closeMobileNav();
    menuToggle?.focus();
  });

  // ------------------------------
  // Scroll UI
  // ------------------------------
  const updateScrollUI = () => {
    const y = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (y / maxScroll) * 100)) : 0;

    if (scrollProgress) scrollProgress.style.width = `${progress}%`;
    header?.classList.toggle('scrolled', y > 18);
    backToTop?.classList.toggle('visible', y > 650);
  };

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', updateScrollUI);

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  // ------------------------------
  // Reveal on scroll
  // ------------------------------
  const revealItems = [...document.querySelectorAll('.reveal')];
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min((index % 4) * 60, 180)}ms`;
      revealObserver.observe(item);
    });
  }

  // ------------------------------
  // Skill tabs + keyboard navigation
  // ------------------------------
  const skillTabs = [...document.querySelectorAll('.skill-tab')];
  const skillPanels = [...document.querySelectorAll('[data-skill-panel]')];

  const activateSkill = (skill, focus = false) => {
    skillTabs.forEach((tab) => {
      const active = tab.dataset.skill === skill;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });

    skillPanels.forEach((panel) => {
      const active = panel.dataset.skillPanel === skill;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  };

  skillTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateSkill(tab.dataset.skill));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % skillTabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + skillTabs.length) % skillTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = skillTabs.length - 1;
      activateSkill(skillTabs[nextIndex].dataset.skill, true);
    });
  });

  // ------------------------------
  // Project filters
  // ------------------------------
  const filterButtons = [...document.querySelectorAll('.filter-button')];
  const projectCards = [...document.querySelectorAll('.project-card[data-category]')];

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter || 'all';
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      projectCards.forEach((card) => {
        const categories = (card.dataset.category || '').split(/\s+/);
        const show = filter === 'all' || categories.includes(filter);
        card.classList.toggle('is-hidden', !show);
      });
    });
  });

  // ------------------------------
  // Expandable project details
  // ------------------------------
  document.querySelectorAll('.details-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const details = button.closest('.project-body')?.querySelector('.project-details');
      if (!(details instanceof HTMLElement)) return;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      details.hidden = expanded;
      button.textContent = expanded ? 'Why it matters +' : 'Hide details −';
    });
  });

  // ------------------------------
  // Copy email
  // ------------------------------
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-copy');
      if (!value) return;
      const original = button.innerHTML;
      try {
        await navigator.clipboard.writeText(value);
        button.innerHTML = '<span>Copied</span>Email copied ✓';
      } catch {
        const helper = document.createElement('textarea');
        helper.value = value;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
        button.innerHTML = '<span>Copied</span>Email copied ✓';
      }
      window.setTimeout(() => { button.innerHTML = original; }, 1700);
    });
  });

  // ------------------------------
  // Image modal
  // ------------------------------
  const modal = document.getElementById('previewModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  let lastFocused = null;

  const focusableSelector = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const openModal = (source, title, trigger) => {
    if (!modal || !(modalImage instanceof HTMLImageElement) || !modalTitle) return;
    lastFocused = trigger instanceof HTMLElement ? trigger : document.activeElement;
    modalImage.src = source;
    modalImage.alt = title;
    modalTitle.textContent = title;
    modal.hidden = false;
    body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => modalClose?.focus());
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    body.style.overflow = '';
    if (modalImage instanceof HTMLImageElement) {
      modalImage.src = '';
      modalImage.alt = '';
    }
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  document.querySelectorAll('[data-preview]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const source = trigger.getAttribute('data-preview');
      const title = trigger.getAttribute('data-title') || 'Project preview';
      if (source) openModal(source, title, trigger);
    });
  });

  modalClose?.addEventListener('click', closeModal);
  modal?.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key !== 'Tab' || !modal || modal.hidden) return;
    const focusable = [...modal.querySelectorAll(focusableSelector)].filter((el) => !el.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // ------------------------------
  // Active navigation state
  // ------------------------------
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const navSections = navLinks
    .map((link) => {
      const selector = link.getAttribute('href');
      if (!selector?.startsWith('#')) return null;
      const section = document.querySelector(selector);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && navSections.length) {
    const ratios = new Map();
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target.id, entry.intersectionRatio));
      const current = [...navSections]
        .sort((a, b) => (ratios.get(b.section.id) || 0) - (ratios.get(a.section.id) || 0))[0];
      navLinks.forEach((link) => link.classList.toggle('active', link === current?.link && (ratios.get(current.section.id) || 0) > 0));
    }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.05, 0.2, 0.5, 1] });
    navSections.forEach(({ section }) => navObserver.observe(section));
  }

  // ------------------------------
  // Count-up stat
  // ------------------------------
  const countTargets = [...document.querySelectorAll('[data-count]')];
  if (countTargets.length) {
    const runCount = (element) => {
      const target = Number(element.getAttribute('data-count') || 0);
      if (!target || element.dataset.counted === 'true') return;
      element.dataset.counted = 'true';
      if (prefersReducedMotion) {
        element.textContent = String(target);
        return;
      }
      const start = performance.now();
      const duration = 900;
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      countTargets.forEach((item) => counterObserver.observe(item));
    } else {
      countTargets.forEach(runCount);
    }
  }

  // ------------------------------
  // Pointer glow
  // ------------------------------
  if (!prefersReducedMotion && cursorGlow && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });
  } else if (cursorGlow) {
    cursorGlow.style.display = 'none';
  }

  // ------------------------------
  // Subtle tilt cards
  // ------------------------------
  if (!prefersReducedMotion && window.matchMedia('(pointer:fine)').matches) {
    const maxTilt = 7;
    const applyTilt = (element, strength = 1) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * maxTilt * strength;
        const rotateX = (0.5 - y) * maxTilt * strength;
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    };

    document.querySelectorAll('[data-tilt]').forEach((element) => applyTilt(element, 1));
    document.querySelectorAll('[data-tilt-soft]').forEach((element) => applyTilt(element, 0.48));
  }

  // ------------------------------
  // Magnetic buttons
  // ------------------------------
  if (!prefersReducedMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.07}px, ${y * 0.1}px) translateY(-3px)`;
      });
      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  // ------------------------------
  // Neural background canvas
  // ------------------------------
  const canvas = document.getElementById('neuralCanvas');
  if (canvas instanceof HTMLCanvasElement && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes = [];
    let raf = 0;
    let pointer = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      const targetCount = Math.max(34, Math.min(92, Math.floor((width * height) / 18000)));
      nodes = Array.from({ length: targetCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.7 + Math.random() * 1.3,
      }));
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const isIce = body.classList.contains('ice');
      const lineRGB = isIce ? '14, 136, 194' : '105, 216, 255';
      const pointRGB = isIce ? '2, 132, 199' : '103, 245, 255';
      const maxDistance = Math.min(155, Math.max(105, width / 9));

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;
      });

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.16;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${lineRGB}, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (pd < 180) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.strokeStyle = `rgba(${lineRGB}, ${(1 - pd / 180) * 0.24})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pointRGB}, 0.34)`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (event) => {
      pointer = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        draw();
      }
    });
  }
})();
