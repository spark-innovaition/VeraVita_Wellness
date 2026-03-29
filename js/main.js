/* ===========================
   VeraVita Clinic — Main JS
   GSAP + ScrollTrigger + Lenis
   =========================== */

/* ---- Lenis Smooth Scroll (desktop only) ---- */
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const lenis = new Lenis({
  duration: isMobile ? 0 : 0.9,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

/* ---- Background videos: slow down + prevent black-flash on loop ---- */
document.querySelectorAll('.page-hero-video, .ph-cin-video').forEach(v => {
  if (v.classList.contains('page-hero-video')) v.playbackRate = 0.65;
  /* Seek back 0.4s before the end so the loop is seamless */
  v.addEventListener('timeupdate', function () {
    if (this.duration && this.currentTime >= this.duration - 0.4) {
      this.currentTime = 0;
    }
  });
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
  const s = { textScale: 1, overlayAlpha: 1, labelAlpha: 0.5, sectionAlpha: 1 };
  let lastDrawn = {};

  /* Load cloud hero image */
  const heroBg = new Image();
  heroBg.src = 'images/bg-hero-section.jpg';

  function resize() {
    canvas.width  = section.clientWidth;
    canvas.height = section.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* Draw overlay colour + both text cutouts each GSAP tick */
  function drawFrame() {
    const w = canvas.width, h = canvas.height;
    /* Skip redraw if nothing changed */
    if (lastDrawn.textScale === s.textScale && lastDrawn.overlayAlpha === s.overlayAlpha && lastDrawn.labelAlpha === s.labelAlpha) return;
    lastDrawn = { textScale: s.textScale, overlayAlpha: s.overlayAlpha, labelAlpha: s.labelAlpha };
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
      /* Image not yet loaded — leave canvas transparent so CSS background shows */
      return;
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

    /* 3. Draw label above heading as solid readable text (not a cutout) */
    if (s.labelAlpha > 0.004) {
      const headingHalfH = basePx * 1.1 / 2;
      const labelY       = h / 2 - headingHalfH - 56;
      const labelPx      = Math.max(Math.round(w * 0.009), 10);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha  = s.labelAlpha;
      ctx.fillStyle    = '#1e3528';
      ctx.letterSpacing = '0.18em';
      ctx.font         = `600 ${labelPx}px "DM Sans", sans-serif`;
      ctx.fillText('NATUROPATHIC & AESTHETIC MEDICINE · CALGARY', w / 2, labelY);
      ctx.letterSpacing = '0px';
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
      end: isMobile ? '+=180%' : '+=150%',
      scrub: isMobile ? 0.4 : 0.6,
      pin: true,
      anticipatePin: 1,
    }
  });

  tl
    .to(s, { labelAlpha: 0,     duration: 0.08, ease: 'none'      },  0   )
    .to(s, { textScale: 18,     duration: 0.78, ease: 'none'      },  0   )
    .to(s, { overlayAlpha: 0,   duration: 0.22, ease: 'power2.in' },  0.78);

  /* Hero content slides up */
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
   INTERIOR PAGE HERO ANIMATIONS
   =========================== */

/* Video-backed heroes: prac-hero, careers-hero, page-hero, legal-hero */
(function() {
  const hero = document.querySelector('.prac-hero, .careers-hero, .page-hero, .legal-hero');
  if (!hero) return;
  const label   = hero.querySelector('.section-label');
  const heading = hero.querySelector('h1');
  const sub     = hero.querySelector('p:not(.breadcrumb *)');
  const cta     = hero.querySelector('.btn-ihb, .page-hero-cta');
  const tl = gsap.timeline({ delay: 0.15, defaults: { ease: 'power3.out' } });
  if (label)   tl.from(label,   { opacity: 0, y: 18, duration: 0.55 });
  if (heading) tl.from(heading, { opacity: 0, y: 32, duration: 0.65 }, '-=0.25');
  if (sub)     tl.from(sub,     { opacity: 0, y: 20, duration: 0.55 }, '-=0.35');
  if (cta)     tl.from(cta,     { opacity: 0, y: 14, duration: 0.45 }, '-=0.25');
})();

/* Service detail pages: text slides in from left, image from right */
(function() {
  const sdContent = document.querySelector('.sd-hero-content');
  const sdImg     = document.querySelector('.sd-hero-img-wrap');
  if (!sdContent) return;
  sdContent.classList.remove('reveal'); // handled manually below
  if (sdImg) sdImg.classList.remove('reveal');   // prevent batch overwrite killing x-tween
  const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power3.out' } });
  tl.from(sdContent, { opacity: 0, x: -40, duration: 0.75 });
  if (sdImg) tl.from(sdImg, { opacity: 0, x: 40, duration: 0.75 }, '-=0.5');
})();

/* Practitioner profile pages: text from left, photo from right */
(function() {
  const pdContent = document.querySelector('.pd-hero-content');
  const pdPhoto   = document.querySelector('.pd-photo-wrap');
  if (!pdContent) return;
  pdContent.classList.remove('reveal');
  const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power3.out' } });
  tl.from(pdContent, { opacity: 0, x: -35, duration: 0.75 });
  if (pdPhoto) tl.from(pdPhoto, { opacity: 0, scale: 0.96, duration: 0.75 }, '-=0.45');
})();

/* Contact page hero */
(function() {
  const cthTop  = document.querySelector('.cth-top');
  if (!cthTop) return;
  const title   = cthTop.querySelector('.cth-title');
  const sub     = cthTop.querySelector('.cth-sub');
  const imgWrap = document.querySelector('.cth-img-wrap');
  const form    = document.querySelector('.cth-form-wrap');
  const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power3.out' } });
  if (title)   tl.from(title,   { opacity: 0, y: 30, duration: 0.65 });
  if (sub)     tl.from(sub,     { opacity: 0, y: 20, duration: 0.55 }, '-=0.3');
  if (imgWrap) tl.from(imgWrap, { opacity: 0, x: -40, duration: 0.7 }, '-=0.2');
  if (form)    tl.from(form,    { opacity: 0, x: 40,  duration: 0.7 }, '-=0.6');
})();

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
      document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
      gsap.to(navMenu, { opacity: 0, y: -10, duration: 0.25, onComplete: () => navMenu.classList.remove('open') });
    } else {
      navToggle.classList.add('open');
      navMenu.classList.add('open');
      gsap.fromTo(navMenu, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.25 });
    }
  });
}

/* Nav-dropdown parent link: prevent navigation, toggle on mobile */
document.querySelectorAll('.nav-dropdown > a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    if (window.innerWidth <= 768) {
      const dropdown = link.closest('.nav-dropdown');
      dropdown.classList.toggle('open');
    }
  });
});

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
    { quote: "Very accommodating and Dr. Jill Nazar is very helpful. She explains everything in detail. Highly recommended.", name: "Fatima Escandor", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 1.png", img: "images/Review images/Review 1.png" },
    { quote: "This naturopath clinic exceeded my expectations. The practitioner took the time to understand my health history, lifestyle, and concerns instead of rushing through the appointment. I felt truly heard and supported.", name: "Cassity TFW Canada", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 2.png", img: "images/Review images/Review 2.png" },
    { quote: "My husband and I had IV treatment at VeraVita, and we had an excellent experience. Dr. Jill is very kind, professional, and extremely accommodating. She explained everything clearly and made us feel comfortable throughout the treatment.", name: "Ivy", role: "IV Therapy · Google Review", avatar: "images/Review images/Review 3.png", img: "images/Review images/Review 3.png" },
    { quote: "Dr. Jill has been our Naturopath Doctor for the past few months. She exudes the professionalism, empathy, care and personal touch that is rarely seen in doctors these days. She has always been accommodating and informative.", name: "Richard Velante", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 4.png", img: "images/Review images/Review 4.png" },
    { quote: "I had a great experience with VeraVita Naturopathic Clinic. Dr. Jill is very friendly and accommodating. She made great recommendations and explained the process in detail. The treatment was quick, painless, and I felt noticeably better.", name: "Aleah Sapitanan", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 5.png", img: "images/Review images/Review 5.png" },
    { quote: "My wife and I have both done IV treatments here, and the experience has been excellent every time. Dr. Jill is incredibly knowledgeable, honest, and takes the time to explain things clearly without pressure.", name: "Dominique Fournier", role: "IV Therapy · Google Review", avatar: "images/Review images/Review 6.png", img: "images/Review images/Review 6.png" },
    { quote: "Dr. Jill Nazar is an exceptional naturopath. She is extremely knowledgeable, professional, and truly committed to understanding the root causes of health concerns rather than just treating symptoms.", name: "Gerardo Savo", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 7.png", img: "images/Review images/Review 7.png" },
    { quote: "I visited Dr. Jill Nazar for an immune boost IV therapy, and I was amazed at how quickly I felt the difference. After just my first session, I already started noticing more energy and felt so much better overall.", name: "Andrei Crupco", role: "IV Therapy · Google Review", avatar: "images/Review images/Review 8.png", img: "images/Review images/Review 8.png" },
    { quote: "Dr. Jill was extremely helpful! I had stomach pain for a few months and after just a few days of her prescribed treatment, I felt so much better. My friend recommended her and I am so grateful she did.", name: "Olga Koroleva", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 9.png", img: "images/Review images/Review 9.png" },
    { quote: "I had the pleasure of seeing Dr. Jill Nazar recently, and I can't recommend her enough! From the moment I walked in, I felt welcomed by the positive energy and cozy, clean atmosphere. Dr. Nazar is incredibly pleasant and attentive.", name: "Ana", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 10.png", img: "images/Review images/Review 10.png" },
    { quote: "I am very grateful to Dr. Jill Nazar for her professional advice and attention to detail. A treatment plan was immediately put in place. She is a wonderful person and doctor, and I recommend her to everyone!", name: "Yulia Palamarchuk", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 11.png", img: "images/Review images/Review 11.png" },
    { quote: "Dr. Jill is very accommodating with scheduling and gives excellent patient care service. Answers all our questions professionally; hence we come regularly.", name: "Janet Harlea", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 12.png", img: "images/Review images/Review 12.png" },
    { quote: "I've had the good fortune to find Dr. Jill Nazar. I needed advice on boosting my immune system, and also for weight loss. She is so knowledgeable, generous with her time, and always has solutions for any of my questions. I'm very grateful that I found her.", name: "Audrey C", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 13.png", img: "images/Review images/Review 13.png" },
    { quote: "Dr. Jill is very warm and accommodating to her clients especially to kids. She talks casually without making my daughter hesitant to speak and share her health concerns. Her clinic is well maintained and very clean!", name: "Maria Cecilia Dulfo", role: "Pediatric Care · Google Review", avatar: "images/Review images/Review 14.png", img: "images/Review images/Review 14.png" },
    { quote: "I had a wonderful experience with Dr. Jill Nazar for my weight loss journey. She is highly professional, knowledgeable, and caring. The IV treatment she provided was comfortable and effective.", name: "Vladlena Kravchuk", role: "Weight Loss · Google Review", avatar: "images/Review images/Review 15.png", img: "images/Review images/Review 15.png" },
    { quote: "This wasn't my first experience with Naturopathy Doctors — but Dr. Jill was on a completely different level. I've never met a doctor who was so respectful, attentive and genuinely focused on me as a patient.", name: "Chingiz Tulegenov", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 16.png", img: "images/Review images/Review 16.png" },
    { quote: "She is a very accommodating and kind doctor who took the time to educate us on the proper way of taking vitamins. We will definitely come back for IV vitamin infusion.", name: "Nice Petralba", role: "IV Therapy · Google Review", avatar: "images/Review images/Review 17.png", img: "images/Review images/Review 17.png" },
    { quote: "I had a fantastic experience with Dr. Jill Nazar. She helped me develop a sustainable weight loss plan that fit my lifestyle, provided clear guidance, and offered ongoing support. Thanks to her expertise and encouragement, I have made real progress and feel healthier every step of the way.", name: "Dhiraj Verma", role: "Weight Loss · Google Review", avatar: "images/Review images/Review 18.png", img: "images/Review images/Review 18.png" },
    { quote: "I had an excellent experience with Dr. Jill Nazar for cholesterol and blood pressure management. She is professional, caring, and makes IV therapy so comfortable. The clinic is clean, welcoming, and calming.", name: "Aza Javed", role: "IV Therapy · Google Review", avatar: "images/Review images/Review 19.png", img: "images/Review images/Review 19.png" },
    { quote: "Great professional service. Highly recommend. Clean and tidy clinic with very positive environment. The treatments were very precise and professional, with an individual approach tailored to the patient's needs.", name: "Galina Arhipova", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 20.png", img: "images/Review images/Review 20.png" },
    { quote: "Dr. Jill is kind, knowledgeable, and really takes the time to listen. After her vitamin IV treatment, I felt energized and refreshed — like a much-needed reset! The clinic is warm and professional. Highly recommend VeraVita for anyone looking for holistic, personalized care.", name: "Galiya Burgess", role: "IV Therapy · Google Review", avatar: "images/Review images/Review 21.png", img: "images/Review images/Review 21.png" },
    { quote: "Dr. Jill Nazar has changed my life totally. Best decision I made to come and see her. I first went for immune boost, then carried on for weight loss, cravings and sleep. I have more energy, better sleep, and feel incredible.", name: "Barb B", role: "Weight Loss · Google Review", avatar: "images/Review images/Review 22.png", img: "images/Review images/Review 22.png" },
    { quote: "I really liked the clinic and its convenient location. Dr. Nazar is clearly very passionate about naturopathic medicine — exactly what I was looking for in my treatment. I truly enjoyed my visits!", name: "Marina Fourman", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 23.png", img: "images/Review images/Review 23.png" },
    { quote: "Dr. Jill Nazar is exceptional. She took the time to understand my fatigue, explained possible causes, and created a personalized plan that fit my daily routine. Her clear guidance, empathetic manner, and proactive follow-up made a real difference. I'm feeling more energetic and hopeful.", name: "Natalia Kulikova", role: "Fatigue Treatment · Google Review", avatar: "images/Review images/Review 24.png", img: "images/Review images/Review 24.png" },
    { quote: "We all know how important it is to trust your doctor and find one who is knowledgeable, compassionate and encouraging. Dr. Jill Nazar is the One! I highly recommend her to anyone looking for a more natural approach to health.", name: "Mila Iron", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 25.png", img: "images/Review images/Review 25.png" },
    { quote: "I had a very positive experience at VeraVita. The naturopath was professional, caring, and really took the time to listen. I felt supported throughout the process and noticed real improvements in my overall well-being. Highly recommend this clinic.", name: "Andrea Nguyen", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 26.png", img: "images/Review images/Review 26.png" },
    { quote: "Very helpful doctor, feel better after just 1 session.", name: "Yulia Deg", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 27.png", img: "images/Review images/Review 27.png" },
    { quote: "Dr. Jill is fantastic. The treatments worked very well every time.", name: "Jack Zydron", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 28.png", img: "images/Review images/Review 28.png" },
    { quote: "Best service and amazing experience! Totally recommend Dr. Jill!", name: "Nadiia Konchukovska", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 29.png", img: "images/Review images/Review 29.png" },
    { quote: "I had a very positive experience with Dr. Jill Nazar — she took the time to truly listen and understand my concerns, offered a thoughtful and holistic approach, and provided clear, personalized recommendations that fit my lifestyle.", name: "Olena Tanasescu", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 30.png", img: "images/Review images/Review 30.png" },
    { quote: "Exceptional! Highly recommend — everyone needs to do this. It is life changing for the better.", name: "Ace O", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 31.png", img: "images/Review images/Review 31.png" },
    { quote: "Jill has exceptional experience and amazing competency with Naturopathy.", name: "Dean Leblanc", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 32.png", img: "images/Review images/Review 32.png" },
    { quote: "Dr. Jill is very accommodating and whatever she does with my spine problem it helps ease the discomfort and pain. Highly recommended.", name: "J. Roetag", role: "Naturopathic Care · Google Review", avatar: "images/Review images/Review 33.png", img: "images/Review images/Review 33.png" }
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

  // Populate card images — front card always shows data[index], subsequent cards follow in order
  function updateCards(index) {
    const n = cards.length;
    const frontCard = ((index % n) + n) % n;
    cards.forEach((card, i) => {
      const img = card.querySelector('img');
      const offset = ((i - frontCard) + n) % n;
      const d = data[(index + offset) % data.length];
      if (img && d) { img.src = d.img; img.alt = d.name; }
    });
  }
  updateCards(0);

  // Build navigation — dots for ≤6 items, counter for more
  if (data.length <= 6) {
    data.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'at-dot' + (i === 0 ? ' at-dot--active' : '');
      dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  } else {
    dotsWrap.classList.add('at-counter');
    dotsWrap.textContent = '1 / ' + data.length;
  }

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
    if (dotsWrap.classList.contains('at-counter')) {
      dotsWrap.textContent = (active + 1) + ' / ' + data.length;
    } else {
      dotsWrap.querySelectorAll('.at-dot').forEach((d, i) =>
        d.classList.toggle('at-dot--active', i === active)
      );
    }
  }

  function goTo(index) {
    if (busy || index === current) return;
    busy = true; current = index;
    updateCards(current);
    const n = cards.length;
    layout(((current % n) + n) % n, true, () => { busy = false; });
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

  // Touch swipe — mobile only
  let touchStartX = 0;
  let touchStartY = 0;
  section.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  section.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return; // too short or mostly vertical
    if (dx < 0) goTo((current + 1) % data.length);
    else        goTo((current - 1 + data.length) % data.length);
  }, { passive: true });

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
  const preview     = document.getElementById('accord-preview');
  const previewName = document.getElementById('accord-preview-name');
  const previewLink = document.getElementById('accord-preview-link');
  items.forEach(item => {
    const src = item.querySelector('.accord-trigger')?.dataset.image;
    if (src) { const img = new Image(); img.src = src; }
  });

  /* Init: collapse all bodies */
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
        gsap.set(body, { maxHeight: 'none' });
        const h = body.scrollHeight;
        gsap.fromTo(body,
          { maxHeight: 0 },
          { maxHeight: h, duration: 0.4, ease: 'power2.inOut' }
        );

        /* Swap image + update panel footer */
        const src  = trigger.dataset.image;
        const name = trigger.dataset.name;
        const link = trigger.dataset.link;
        if (src && preview) {
          gsap.to(preview, {
            opacity: 0, duration: 0.2, ease: 'power2.in',
            onComplete: () => {
              preview.src = src;
              if (previewName && name) previewName.textContent = name.replace(/&amp;/g, '&');
              if (previewLink && link) previewLink.href = link;
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

/* ============================================
   SERVICE DETAIL — Related Services Carousel
   2-up overlay cards with ← → arrow nav
   ============================================ */
(function initRelatedCarousel() {
  const header = document.querySelector('.sd-related-header');
  const grid   = document.querySelector('.sd-related-grid');
  if (!header || !grid) return;

  /* Wrap existing header content in text div */
  const textWrap = document.createElement('div');
  textWrap.className = 'sd-related-header-text';
  while (header.firstChild) textWrap.appendChild(header.firstChild);
  header.appendChild(textWrap);

  /* Arrow buttons */
  const arrowWrap = document.createElement('div');
  arrowWrap.className = 'sd-related-arrows';
  arrowWrap.innerHTML =
    '<button class="sd-arrow" id="sd-prev" aria-label="Previous"><i class="fa-solid fa-arrow-left"></i></button>' +
    '<button class="sd-arrow" id="sd-next" aria-label="Next"><i class="fa-solid fa-arrow-right"></i></button>';
  header.appendChild(arrowWrap);

  /* Scrollable grid — CSS already sets display:flex; hide scrollbar */
  grid.style.overflowX      = 'auto';
  grid.style.scrollSnapType = 'x mandatory';
  grid.style.scrollbarWidth = 'none';
  grid.style.msOverflowStyle = 'none';

  const styleEl = document.createElement('style');
  styleEl.textContent = '.sd-related-grid::-webkit-scrollbar{display:none}';
  document.head.appendChild(styleEl);

  /* Snap each card */
  grid.querySelectorAll('.sd-rel-card').forEach(c => {
    c.style.scrollSnapAlign = 'start';
  });

  const scrollAmount = () => {
    const card = grid.querySelector('.sd-rel-card');
    return card ? card.offsetWidth + 20 : grid.clientWidth / 2;
  };

  const prev = document.getElementById('sd-prev');
  const next = document.getElementById('sd-next');

  function updateArrows() {
    prev.disabled = grid.scrollLeft <= 4;
    next.disabled = grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 4;
  }

  prev.addEventListener('click', () => grid.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
  next.addEventListener('click', () => grid.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }));
  grid.addEventListener('scroll', updateArrows, { passive: true });
  updateArrows();
})();

// Shuffle hwnu marquee images on page load
(function() {
  var track = document.getElementById('hwnu-track');
  if (!track) return;
  var imgs = Array.from(track.querySelectorAll('img[aria-hidden="true"]'));
  var originals = Array.from(track.querySelectorAll('img:not([aria-hidden])'));
  // Shuffle originals
  for (var i = originals.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = originals[i].src; originals[i].src = originals[j].src;
    originals[j].src = tmp;
  }
  // Mirror shuffle to duplicates
  originals.forEach(function(img, idx) { imgs[idx].src = img.src; });
})();

/* ============================================
   BG PARALLAX — green sections
   Recreates the background-attachment:fixed
   "slide under" look without breaking Lenis.
   Each section's background-position is scrubbed
   from center 35% → center 65% as it scrolls
   through the viewport.
   ============================================ */
(function initBgParallax() {
  if (window.matchMedia('(max-width: 860px)').matches) return;

  const SELECTORS = [
    '.tmd-section',
    '.about-statement-section',
    '.timeline-section',
    '.hwnu-section',
    '.anim-testimonials',
    '.cth-section',
    '.cfaq-section',
    '.follow-section',
    '.prac-cta-section',
    '.section--book-green',
    '.careers-why',
  ].join(', ');

  document.querySelectorAll(SELECTORS).forEach(section => {
    /* Pause the CSS bg-drift animation so GSAP owns background-position */
    section.style.animationPlayState = 'paused';

    gsap.fromTo(section,
      { backgroundPosition: 'center 35%' },
      {
        backgroundPosition: 'center 65%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      }
    );
  });
})();
