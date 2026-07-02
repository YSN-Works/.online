(function () {
  'use strict';

  const nav = document.querySelector('.glass-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const contactForm = document.querySelector('.contact-form');

  /* Scroll-aware nav glow */
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav?.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Nav jelly glass pill — floating liquid hover */
  const jellyPill = document.querySelector('.nav-jelly-pill');
  const navLinkEls = document.querySelectorAll('.nav-links .nav-link');
  const navLinksContainer = document.querySelector('.nav-links-wrap');

  function positionJellyPill(link) {
    if (!jellyPill || !navLinksContainer || window.innerWidth <= 768) return;

    const containerRect = navLinksContainer.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    jellyPill.style.left = `${linkRect.left - containerRect.left}px`;
    jellyPill.style.top = `${linkRect.top - containerRect.top}px`;
    jellyPill.style.width = `${linkRect.width}px`;
    jellyPill.style.height = `${linkRect.height}px`;
    jellyPill.classList.add('visible');
    jellyPill.classList.remove('wobble');
    void jellyPill.offsetWidth;
    jellyPill.classList.add('wobble');
  }

  navLinkEls.forEach((link) => {
    link.addEventListener('mouseenter', () => positionJellyPill(link));
    link.addEventListener('focus', () => positionJellyPill(link));
  });

  /* Pre-position the pill on the first link (invisible) so the very first
     hover doesn't animate in from a 0x0 corner and look laggy */
  if (jellyPill && navLinkEls.length && window.innerWidth > 768) {
    const firstLink = navLinkEls[0];
    const containerRect = navLinksContainer.getBoundingClientRect();
    const linkRect = firstLink.getBoundingClientRect();
    jellyPill.style.transition = 'none';
    jellyPill.style.left = `${linkRect.left - containerRect.left}px`;
    jellyPill.style.top = `${linkRect.top - containerRect.top}px`;
    jellyPill.style.width = `${linkRect.width}px`;
    jellyPill.style.height = `${linkRect.height}px`;
    requestAnimationFrame(() => {
      jellyPill.style.transition = '';
    });
  }

  navLinksContainer?.addEventListener('mouseleave', () => {
    jellyPill?.classList.remove('visible', 'wobble');
  });

  /* Mobile menu */
  const navOverlay = document.querySelector('.nav-overlay');

  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navOverlay?.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  navToggle?.addEventListener('click', () => {
    setMenu(!navLinks.classList.contains('open'));
  });

  navOverlay?.addEventListener('click', () => setMenu(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      setMenu(false);
    }
  });

  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  /* Scroll reveal */
  const revealEls = document.querySelectorAll(
    '.section-header, .work-card, .service-card, .about-layout, .contact-wrapper, .hero-content, .hero-visual'
  );
  revealEls.forEach((el) => el.classList.add('reveal'));

  /* Elements higher up the page rise into view quickly (short, snappy);
     elements further down take longer (slower, heavier) — based on each
     element's actual vertical position on the page, not just DOM order. */
  const docHeight = document.documentElement.scrollHeight;
  revealEls.forEach((el) => {
    const depthRatio = (el.getBoundingClientRect().top + window.scrollY) / docHeight;
    const duration = 0.5 + depthRatio * 0.9; // ~0.5s near the top, up to ~1.4s near the bottom
    const distance = 24 + depthRatio * 40; // travels a bit further the lower it sits
    el.style.transitionDuration = `${duration.toFixed(2)}s`;
    el.style.setProperty('--reveal-distance', `${distance.toFixed(0)}px`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('visible', entry.isIntersecting);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => observer.observe(el));

  /* Stagger work cards */
  document.querySelectorAll('.work-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`;
  });
  document.querySelectorAll('.service-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.06}s`;
  });

  /* Contact form — Web3Forms email delivery */
  const formStatus = document.getElementById('form-status');
  const submitBtn = contactForm?.querySelector('.form-submit');
  const submitBtnLabel = submitBtn?.querySelector('.btn-label');
  const submitBtnDefaultText = submitBtnLabel?.textContent || 'Send Message';
  const config = window.CONTACT_CONFIG || {};

  function setFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form-status';
    if (type) formStatus.classList.add(`is-${type}`);
  }

  function resetSubmitButton() {
    if (!submitBtn || !submitBtnLabel) return;
    submitBtn.disabled = false;
    submitBtnLabel.textContent = submitBtnDefaultText;
  }

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const accessKey = config.web3formsAccessKey;
    if (!accessKey || accessKey === 'YOUR_ACCESS_KEY_HERE') {
      setFormStatus(
        'Email delivery is not configured yet. Add your Web3Forms access key in contact-config.js (see setup instructions in that file).',
        'error'
      );
      return;
    }

    const name = contactForm.querySelector('#name').value.trim();
    const email = contactForm.querySelector('#email').value.trim();
    const message = contactForm.querySelector('#message').value.trim();

    if (!name || !email || !message) {
      setFormStatus('Please fill in all fields before sending.', 'error');
      return;
    }

    submitBtn.disabled = true;
    if (submitBtnLabel) submitBtnLabel.textContent = 'Sending…';
    setFormStatus('Sending your message…', 'loading');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          name,
          email,
          message,
          subject: 'New contact from YSN Works website',
          from_name: 'YSN Works Contact Form',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormStatus('Message sent! I’ll get back to you soon.', 'success');
        contactForm.reset();
        if (submitBtnLabel) submitBtnLabel.textContent = 'Message Sent!';
        setTimeout(resetSubmitButton, 3000);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      setFormStatus(
        'Something went wrong. Please try again or reach out via WhatsApp.',
        'error'
      );
      resetSubmitButton();
      console.error('Contact form error:', err);
    }
  });

  /* Smooth anchor offset for fixed nav */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 100;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* Liquid glass mouse parallax on hero card */
  const heroCard = document.querySelector('.hero-card');
  if (heroCard && window.matchMedia('(pointer: fine)').matches) {
    const heroVisual = document.querySelector('.hero-visual');
    heroVisual?.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroCard.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-12px)`;
    });
    heroVisual?.addEventListener('mouseleave', () => {
      heroCard.style.transform = '';
    });
  }
})();