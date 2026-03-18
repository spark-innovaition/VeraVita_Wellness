/* ===========================
   VeraVita Clinic — Main JS
   GSAP + ScrollTrigger + Lenis
   =========================== */

/* ---- Lenis Smooth Scroll ---- */
const lenis = new Lenis({
  duration: 0.9,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

/* ---- GSAP + ScrollTrigger ---- */
gsap.registerPlugin(ScrollTrigger);

/* Drive Lenis from GSAP ticker only — never double-call */
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

/* ============================================
   CINEMATIC TEXT-ZOOM HERO (about page)
   Canvas-based overlay so the text cutout
   works regardless of video compositor layer.
   ============================================ */
(function initCinematicHero() {
  const section     = document.querySelector('.ph-cinematic');
  if (!section) return;

  const label       = section.querySelector('.ph-cin-label');
  const heroContent = section.querySelector('.ph-hero-content');
  const heroItems   = heroContent ? [...heroContent.children] : [];

  /* --- Canvas overlay --- */
  const canvas = document.createElement('canvas');
  canvas.className = 'ph-cin-canvas';
  section.insertBefore(canvas, label);          // sits below label in DOM
  const ctx = canvas.getContext('2d');

  /* Mutable state driven by GSAP */
  const s = { textScale: 1, overlayAlpha: 1, labelAlpha: 0.5 };

  /* Load cloud hero image */
  const heroBg = new Image();
  heroBg.src = 'images/Hero section.png';

  function resize() {
    canvas.width  = section.clientWidth;
    canvas.height = section.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* Draw overlay colour + both text cutouts each GSAP tick */
  function drawFrame() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (s.overlayAlpha < 0.004) return;

    /* 1. Image overlay — draw cloud image scaled to fill, shifted up so
          the cloud ring (vertical center of image) aligns with the text */
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = s.overlayAlpha;

    if (heroBg.complete && heroBg.naturalWidth > 0) {
      /* Zoom image in sync with textScale (1→18), from 1.15× up to 1.65× */
      const zoom   = 1.15 + (s.textScale - 1) / 17 * 0.5;
      const scale  = Math.max((w * zoom) / heroBg.naturalWidth, (h * zoom) / heroBg.naturalHeight);
      const drawW  = heroBg.naturalWidth  * scale;
      const drawH  = heroBg.naturalHeight * scale;
      const drawX  = (w - drawW) / 2;
      /* Shift image up slightly so cloud ring sits at vertical center (text position) */
      const drawY  = (h - drawH) / 2 - h * 0.06;
      ctx.drawImage(heroBg, drawX, drawY, drawW, drawH);
    } else {
      /* Fallback while image loads */
      ctx.fillStyle = '#1e3528';
      ctx.fillRect(0, 0, w, h);
    }

    /* 2. Cut out main heading */
    const basePx = Math.min(w * 0.185, 320);
    const fontPx = basePx * s.textScale;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.font         = `italic bold ${fontPx}px "Libre Caslon Text", serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#000';
    ctx.fillText('VeraVita', w / 2, h / 2);

    /* 3. Cut out label above heading — fades with labelAlpha */
    if (s.labelAlpha > 0.004) {
      const headingHalfH = basePx * 1.1 / 2;          // generous estimate of text half-height
      const labelY       = h / 2 - headingHalfH - 56; // push label clearly above heading
      const labelPx      = Math.max(Math.round(w * 0.009), 10);
      ctx.globalAlpha    = s.labelAlpha;
      ctx.letterSpacing  = '0.18em';
      ctx.font           = `500 ${labelPx}px "DM Sans", sans-serif`;
      ctx.fillText('NATUROPATHIC & AESTHETIC MEDICINE · CALGARY', w / 2, labelY);
      ctx.letterSpacing  = '0px';
    }
  }

  /* Drive canvas from GSAP ticker — stays in sync with ScrollTrigger scrub */
  gsap.ticker.add(drawFrame);

  /* Init hero items hidden */
  if (heroItems.length) gsap.set(heroItems, { opacity: 0, y: 80 });

  /* ScrollTrigger-scrubbed timeline */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=300%',       // 3× viewport — plenty of room for a relaxed pace
      scrub: 2.5,          // heavy damping keeps it buttery
      pin: true,
      anticipatePin: 1,
    }
  });

  tl
    .to(s, { labelAlpha: 0,     duration: 0.08, ease: 'none'      },  0   )
    .to(s, { textScale: 18,     duration: 0.78, ease: 'none'      },  0   )
    .to(s, { overlayAlpha: 0,   duration: 0.22, ease: 'power2.in' },  0.78);

  /* Hero content slides up — long, staggered, unhurried */
  if (heroItems.length) {
    tl.to(heroItems, {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      ease: 'power3.out',
      duration: 0.50,
    }, 0.88);
  }

  ScrollTrigger.refresh();
})();

/* ===========================
   NAVBAR — scroll effect
   =========================== */
const navbar = document.querySelector('.navbar');
ScrollTrigger.create({
  start: 'top -80',
  end: 99999,
  toggleClass: { className: 'navbar--scrolled', targets: navbar }
});


/* ===========================
   HERO SPLIT — entrance animations
   Left: stagger y:20 opacity:0 → y:0 opacity:1 (matches itemVariants)
   Right: clip-path reveal polygon (matches circOut transition)
   =========================== */
(function () {
  const item = { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' };

  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl.from('.hs-eyebrow',  { ...item });
  heroTl.from('.hs-title',    { ...item }, '+=0.05');
  heroTl.from('.hs-divider',  { ...item, scaleX: 0, transformOrigin: 'left center' }, '-=0.2');
  heroTl.from('.hs-subtitle', { ...item }, '-=0.25');
  heroTl.from('.hs-footer',   { ...item }, '-=0.2');

  /* Clip-path diagonal reveal for image panel */
  gsap.fromTo('.hs-right',
    { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' },
    { clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)', duration: 1.2, ease: 'circ.out', delay: 0.2 }
  );
}());

/* ===========================
   GENERIC FADE-UP (all pages)
   =========================== */
document.querySelectorAll('.fade-up').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    y: 50, opacity: 0, duration: 0.8, ease: 'power3.out'
  });
});

/* STAGGER GRIDS */
document.querySelectorAll('.stagger-grid').forEach(grid => {
  const items = grid.querySelectorAll('.stagger-item');
  gsap.from(items, {
    scrollTrigger: { trigger: grid, start: 'top 85%', toggleActions: 'play none none none' },
    y: 50, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12
  });
});

/* FADE LEFT */
document.querySelectorAll('.fade-left').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    x: -60, opacity: 0, duration: 0.9, ease: 'power3.out'
  });
});

/* FADE RIGHT */
document.querySelectorAll('.fade-right').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    x: 60, opacity: 0, duration: 0.9, ease: 'power3.out'
  });
});

/* ===========================
   ANIMATED COUNTERS
   =========================== */
document.querySelectorAll('.counter').forEach(el => {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;

  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function () {
          el.textContent = prefix + this.targets()[0].val.toFixed(decimals) + suffix;
        }
      });
    }
  });
});

/* ===========================
   MARQUEE
   =========================== */
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  const clone = marqueeTrack.innerHTML;
  marqueeTrack.innerHTML += clone; // duplicate for seamless loop
}

/* ===========================
   SERVICE TABS
   =========================== */
const tabBtns  = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.querySelector(`.tab-pane[data-tab="${target}"]`);
    if (pane) {
      pane.classList.add('active');
      gsap.from(pane, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' });
    }
  });
});

/* ===========================
   SERVICES FILTER
   =========================== */
const filterBtns  = document.querySelectorAll('.filter-btn');
const serviceCards = document.querySelectorAll('[data-category]');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    serviceCards.forEach(card => {
      if (cat === 'all' || card.dataset.category === cat) {
        card.style.display = '';
        gsap.from(card, { opacity: 0, y: 20, duration: 0.4 });
      } else {
        card.style.display = 'none';
      }
    });
  });
});

/* ===========================
   FAQ ACCORDION
   =========================== */
document.querySelectorAll('.faq-item').forEach(item => {
  const btn    = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!btn || !answer) return;

  /* set initial state */
  if (!item.classList.contains('open')) {
    gsap.set(answer, { height: 0, opacity: 0, paddingBottom: 0 });
  }

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    /* close all */
    document.querySelectorAll('.faq-item.open').forEach(openItem => {
      openItem.classList.remove('open');
      const a = openItem.querySelector('.faq-answer');
      gsap.to(a, { height: 0, opacity: 0, paddingBottom: 0, duration: 0.35, ease: 'power2.inOut' });
    });

    if (!isOpen) {
      item.classList.add('open');
      gsap.set(answer, { height: 'auto', opacity: 1, paddingBottom: '1.5rem' });
      gsap.from(answer, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
    }
  });
});

/* ===========================
   MOBILE NAV TOGGLE
   =========================== */
const navToggle = document.querySelector('.navbar-toggle');
const navMenu   = document.querySelector('.navbar-nav');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('open');
    if (isOpen) {
      navToggle.classList.remove('open');
      gsap.to(navMenu, { opacity: 0, y: -10, duration: 0.25, onComplete: () => navMenu.classList.remove('open') });
    } else {
      navToggle.classList.add('open');
      navMenu.classList.add('open');
      gsap.from(navMenu, { opacity: 0, y: -10, duration: 0.25 });
    }
  });
}

/* ===========================
   FORM SUBMISSION
   =========================== */
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = 'Sent! ✓';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      btn.style.opacity = '';
      form.reset();
    }, 3000);
  });
});

/* ===========================
   CARD HOVER PARALLAX (subtle)
   =========================== */
document.querySelectorAll('.hover-tilt').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect   = card.getBoundingClientRect();
    const x      = (e.clientX - rect.left) / rect.width  - 0.5;
    const y      = (e.clientY - rect.top)  / rect.height - 0.5;
    gsap.to(card, { rotateY: x * 6, rotateX: -y * 6, transformPerspective: 800, duration: 0.4, ease: 'power1.out' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power1.out' });
  });
});

/* ============================================
   HEADING CLIP REVEAL (for .heading-wrap elements)
   ============================================ */
document.querySelectorAll('.heading-wrap').forEach(wrap => {
  const inner = wrap.querySelector('.heading-inner');
  if (!inner) return;
  gsap.set(inner, { y: '100%', opacity: 0 });
  ScrollTrigger.create({
    trigger: wrap,
    start: 'top 88%',
    onEnter: () => {
      gsap.to(inner, {
        y: '0%',
        opacity: 1,
        duration: 0.9,
        ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
    },
    once: true
  });
});

/* ============================================
   REVEAL CLASS (.reveal elements) — batched
   ============================================ */
gsap.set('.reveal', { opacity: 0, y: 24 });
ScrollTrigger.batch('.reveal', {
  start: 'top 90%',
  once: true,
  onEnter: batch => gsap.to(batch, {
    opacity: 1, y: 0,
    duration: 0.7, ease: 'power2.out',
    stagger: 0.07, overwrite: true,
  }),
});

/* ============================================
   TEXT GRADIENT SCROLL
   Adapted from: TextGradientScroll (framer-motion → GSAP scrub)
   Splits the intro paragraph into characters and drives opacity
   via ScrollTrigger scrub as the user scrolls through the section.
   ============================================ */
(function initTextGradientScroll() {
  const el = document.getElementById('intro-tgs');
  if (!el) return;

  const text = el.textContent.trim();
  el.innerHTML = '';
  el.setAttribute('aria-label', text);

  /* Animate per-word (not per-character) — ~10x fewer GSAP targets per frame */
  text.split(' ').forEach((word, wi, arr) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'tgs-word';
    wordEl.textContent = word;
    el.appendChild(wordEl);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });

  const words = el.querySelectorAll('.tgs-word');
  gsap.fromTo(words,
    { opacity: 0.08 },
    {
      opacity: 1,
      stagger: { each: 0.04 },
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1,
      }
    }
  );
})();

/* ============================================
   TEAM CARD TOOLTIPS (GSAP spring-in)
   Adapted from: AnimatedTooltip (framer-motion → GSAP)
   Each team card shows a spring-animated tooltip on hover.
   Tooltip tilts subtly with mouse position.
   ============================================ */
document.querySelectorAll('.team-card').forEach(card => {
  const tooltip = card.querySelector('.team-tooltip');
  if (!tooltip) return;

  gsap.set(tooltip, { opacity: 0, y: 12, scale: 0.85 });

  card.addEventListener('mouseenter', () => {
    gsap.to(tooltip, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.7)' });
  });

  card.addEventListener('mouseleave', () => {
    gsap.to(tooltip, { opacity: 0, y: 12, scale: 0.85, duration: 0.2, ease: 'power2.in', rotateZ: 0 });
  });

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
    gsap.to(tooltip, { rotateZ: xNorm * 6, duration: 0.3, ease: 'power1.out' });
  });
});

/* ============================================
   ANIMATED TESTIMONIALS CAROUSEL
   Adapted from: AnimatedTestimonials (framer-motion → GSAP)
   Stacked image cards rotate/scale into position as the active
   testimonial changes. Quote text fades+slides on switch.
   ============================================ */
(function initAnimTestimonials() {
  const section = document.querySelector('.anim-testimonials');
  if (!section) return;

  const data = [
    {
      quote: "VeraVita transformed my approach to health. After years of chronic fatigue, Dr. Mitchell identified the root cause and created a plan that actually worked. I feel like a completely new person!",
      name: "Jessica L.", role: "Fatigue Treatment · Calgary, AB",
      avatar: "images/Testimonails 1.jpg",
      img: "images/Testimonails 1.jpg"
    },
    {
      quote: "The IV therapy sessions have been a game-changer for my energy levels. The team is knowledgeable, the clinic is beautiful, and I always leave feeling incredible. Highly recommend!",
      name: "Mark R.", role: "IV Therapy · Calgary, AB",
      avatar: "images/Testimonails 2.jpg",
      img: "images/Testimonails 2.jpg"
    },
    {
      quote: "I came for dermal fillers and was amazed by the natural-looking results. Dr. Chen listened to exactly what I wanted and delivered beyond my expectations. I won't go anywhere else!",
      name: "Amanda K.", role: "Aesthetic Medicine · Calgary, AB",
      avatar: "images/Testimonails 3.jpg",
      img: "images/Testimonails 3.jpg"
    },
    {
      quote: "The holistic care I received at VeraVita was unlike anything I've experienced before. Every detail was considered and the results speak for themselves. Absolutely incredible team.",
      name: "Sarah M.", role: "Naturopathic Care · Calgary, AB",
      avatar: "images/Testimonails 4.jpg",
      img: "images/Testimonails 4.jpg"
    }
  ];

  const cards     = section.querySelectorAll('.at-card');
  const quoteEl   = section.querySelector('.at-quote');
  const avatarEl  = section.querySelector('.at-author-avatar');
  const nameEl    = section.querySelector('.at-author-name');
  const roleEl    = section.querySelector('.at-author-role');
  const dotsWrap  = section.querySelector('.at-dots');
  const prevBtn   = section.querySelector('.at-prev');
  const nextBtn   = section.querySelector('.at-next');

  let current = 0, busy = false;

  // Populate card images
  cards.forEach((card, i) => {
    const img = card.querySelector('img');
    if (img && data[i]) { img.src = data[i].img; img.alt = data[i].name; }
  });

  // Build navigation dots
  data.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'at-dot' + (i === 0 ? ' at-dot--active' : '');
    dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  // Stack positions: [front, mid, back]
  const POS = [
    { x: 0,   y: 0,  rot: 0,  scale: 1,    op: 1    },
    { x: 42,  y: 28, rot: 5,  scale: 0.91, op: 0.72 },
    { x: -28, y: 52, rot: -4, scale: 0.82, op: 0.5  }
  ];

  function layout(active, animate, onDone) {
    let completed = 0;
    cards.forEach((card, i) => {
      const offset = (i - active + cards.length) % cards.length;
      const p = POS[Math.min(offset, 2)];
      card.style.zIndex = 3 - Math.min(offset, 2);
      if (animate) {
        gsap.to(card, {
          x: p.x, y: p.y, rotation: p.rot, scale: p.scale, opacity: p.op,
          duration: 0.5, ease: 'power3.out',
          onComplete: () => { if (++completed === cards.length && onDone) onDone(); }
        });
      } else {
        gsap.set(card, { x: p.x, y: p.y, rotation: p.rot, scale: p.scale, opacity: p.op });
      }
    });
  }

  function updateText(index) {
    const d = data[index];
    const els = [quoteEl, nameEl, roleEl];
    gsap.killTweensOf(els);
    gsap.killTweensOf(avatarEl);
    gsap.to(els, {
      opacity: 0, y: -8, duration: 0.15, ease: 'power2.in',
      onComplete() {
        quoteEl.textContent = '\u201c' + d.quote + '\u201d';
        nameEl.textContent = d.name; roleEl.textContent = d.role;
        gsap.fromTo(els,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', stagger: 0.06 }
        );
      }
    });
    gsap.to(avatarEl, {
      opacity: 0, duration: 0.15, ease: 'power2.in',
      onComplete() {
        avatarEl.src = d.avatar; avatarEl.alt = d.name;
        gsap.to(avatarEl, { opacity: 1, duration: 0.3, ease: 'power3.out' });
      }
    });
  }

  function updateDots(active) {
    dotsWrap.querySelectorAll('.at-dot').forEach((d, i) =>
      d.classList.toggle('at-dot--active', i === active)
    );
  }

  function goTo(index) {
    if (busy || index === current) return;
    busy = true; current = index;
    layout(current, true, () => { busy = false; });
    updateText(current);
    updateDots(current);
  }

  // Preload all avatar images so src swaps never decode mid-scroll
  data.forEach(d => { const img = new Image(); img.src = d.avatar; });

  // Initialise
  layout(0, false);
  updateText(0);

  prevBtn.addEventListener('click', () => goTo((current - 1 + data.length) % data.length));
  nextBtn.addEventListener('click', () => goTo((current + 1) % data.length));

  // Auto-advance — pauses during scroll to avoid mid-frame GSAP collision
  let autoTimer = null;
  function scheduleAdvance() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      if (!document.hidden) goTo((current + 1) % data.length);
      scheduleAdvance();
    }, 5000);
  }
  scheduleAdvance();
  let scrollPauseTimer = null;
  lenis.on('scroll', () => {
    clearTimeout(autoTimer);
    clearTimeout(scrollPauseTimer);
    scrollPauseTimer = setTimeout(scheduleAdvance, 1200);
  });
})();

/* ============================================
   STICKY FOOTER — smooth fade-in animation
   Triggers once when the footer placeholder
   enters the viewport while scrolling down.
   ============================================ */
(function initStickyFooterAnim() {
  const footer = document.querySelector('.sf-footer');
  const fixed  = document.querySelector('.sf-fixed');
  if (!footer || !fixed) return;

  // Elements to stagger-animate inside the fixed panel
  const brand  = fixed.querySelector('.sf-brand');
  const cols   = fixed.querySelectorAll('.sf-col');
  const bottom = fixed.querySelector('.sf-bottom');
  const groups = [brand, ...cols, bottom].filter(Boolean);

  // Hide immediately via GSAP inline styles
  gsap.set(groups, { opacity: 0, y: 28 });

  let played = false;
  function playAnim() {
    if (played) return;
    played = true;
    gsap.to(groups, {
      opacity: 1,
      y: 0,
      duration: 0.65,
      ease: 'power2.out',
      stagger: 0.1,
    });
  }

  // Fire when the placeholder div enters the viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { playAnim(); io.disconnect(); } });
  }, { threshold: 0.01 });
  io.observe(footer);

  // Fallback: if already in view on load, play immediately
  const rect = footer.getBoundingClientRect();
  if (rect.top < window.innerHeight) playAnim();
})();

/* ============================================
   NEW SERVICES ACCORDION (.accord-item)
   — separate from FAQ accordion (.faq-item)
   ============================================ */
(function initServicesAccordion() {
  const items = document.querySelectorAll('.accord-item');
  if (!items.length) return;

  /* Preload all service images so switching never causes paint jank */
  const preview = document.getElementById('accord-preview');
  items.forEach(item => {
    const src = item.querySelector('.accord-trigger')?.dataset.image;
    if (src) { const img = new Image(); img.src = src; }
  });

  /* Init: collapse all bodies using max-height (no layout reflow on animate) */
  items.forEach(item => {
    const body = item.querySelector('.accord-body');
    if (body) gsap.set(body, { maxHeight: 0, overflow: 'hidden' });
  });

  items.forEach(item => {
    const trigger = item.querySelector('.accord-trigger');
    const body    = item.querySelector('.accord-body');
    if (!trigger || !body) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      /* Close all open items */
      document.querySelectorAll('.accord-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        gsap.to(openItem.querySelector('.accord-body'), {
          maxHeight: 0, duration: 0.35, ease: 'power2.inOut'
        });
      });

      /* Open clicked item */
      if (!isOpen) {
        item.classList.add('open');
        /* measure natural height once */
        gsap.set(body, { maxHeight: 'none' });
        const h = body.scrollHeight;
        gsap.fromTo(body,
          { maxHeight: 0 },
          { maxHeight: h, duration: 0.4, ease: 'power2.inOut' }
        );

        /* Swap service image — images already preloaded, no network lag */
        const src = trigger.dataset.image;
        if (src && preview && !preview.src.endsWith(src)) {
          gsap.to(preview, {
            opacity: 0, duration: 0.2, ease: 'power2.in',
            onComplete: () => {
              preview.src = src;
              gsap.to(preview, { opacity: 1, duration: 0.35, ease: 'power2.out' });
            }
          });
        }
      }
    });
  });
})();

/* ============================================
   PAUSE BACKGROUND VIDEOS WHEN OFF-SCREEN
   Reduces GPU load during scroll
   ============================================ */
(function initVideoPauseOnScroll() {
  document.querySelectorAll('.accord-video-bg, .svc-hero-video').forEach(video => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { video.play(); }
        else { video.pause(); }
      });
    }, { threshold: 0.01 });
    io.observe(video);
  });
})();

/* ============================================
   SCROLL WORD REVEAL — .js-word-reveal
   Splits heading into per-word <span>s then
   scrubs opacity 0.12 → 1 as the element
   scrolls through the viewport.
   ============================================ */
(function initWordReveal() {
  document.querySelectorAll('.js-word-reveal').forEach(el => {
    /* Wrap every word in a span, preserving spaces */
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');

    const spans = [...el.querySelectorAll('.word')];

    gsap.set(spans, { opacity: 0.1 });
    gsap.to(spans, {
      opacity: 1,
      ease: 'power2.out',
      stagger: 0.05,
      duration: 0.5,
      scrollTrigger: {
        trigger: el,
        start: 'top 82%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });
})();

/* ============================================
   GLOWING BORDER EFFECT — value cards
   Ports the React GlowingEffect component:
   tracks mouse position, rotates a conic-
   gradient arc around the card border to
   follow the cursor angle.
   ============================================ */
(function initGlowingBorders() {
  const cards = [...document.querySelectorAll('.value-card')];
  if (!cards.length) return;

  const INACTIVE_ZONE = 0.7;   // dead zone: if cursor is this fraction from center, hide effect
  let lastX = 0, lastY = 0, rafId = null;

  function update(mx, my) {
    cards.forEach(card => {
      const fx = card.querySelector('.glowing-effect');
      if (!fx) return;

      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  * 0.5;
      const cy    = rect.top  + rect.height * 0.5;
      const dist  = Math.hypot(mx - cx, my - cy);
      const dead  = 0.5 * Math.min(rect.width, rect.height) * INACTIVE_ZONE;

      /* Inside inactive (center) zone — hide */
      if (dist < dead) { fx.style.setProperty('--active', '0'); return; }

      /* Outside card proximity — hide */
      const near = mx > rect.left && mx < rect.right && my > rect.top && my < rect.bottom;
      fx.style.setProperty('--active', near ? '1' : '0');
      if (!near) return;

      /* Angle from card center to cursor (same formula as the React component) */
      const targetAngle = (180 * Math.atan2(my - cy, mx - cx)) / Math.PI + 90;
      const current     = parseFloat(fx.style.getPropertyValue('--start') || '0');
      const diff        = ((targetAngle - current + 180) % 360) - 180;

      /* Smooth rotation — mirrors the motion/react animate() ease */
      gsap.to(fx, {
        '--start': current + diff,
        duration: 2,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    });
  }

  document.body.addEventListener('pointermove', e => {
    lastX = e.clientX; lastY = e.clientY;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => update(lastX, lastY));
  }, { passive: true });

  /* Re-evaluate on scroll so cards that enter view pick up the current cursor */
  window.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => update(lastX, lastY));
  }, { passive: true });
})();
