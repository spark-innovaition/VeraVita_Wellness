/* ===========================
   VeraVita Clinic — Main JS
   GSAP + ScrollTrigger + Lenis
   =========================== */

/* ============================================
   DYNAMIC NAVBAR INJECTION (Site-wide)
   Centralized navigation for easy updating
   ============================================ */
(function injectNavbar() {
  const navbarElement = document.querySelector('.navbar');
  if (!navbarElement) return;

  const currentPath = window.location.pathname;
  const isHome = currentPath === '/' || currentPath.endsWith('index.html');
  
  navbarElement.innerHTML = `
    <div class="container">
      <div class="navbar-inner">

        <a href="/" class="navbar-logo">
          <img src="images/Logo/logo.png" alt="VeraVita" class="logo-img logo-img--desktop"
               onerror="this.style.display='none'; var nx=this.nextElementSibling; nx.style.display='flex'; nx.nextElementSibling.style.display='inline';" />
          <!-- UPDATED: Using full logo for mobile instead of the favicon/hand icon -->
          <img src="images/Logo/logo.png" alt="VeraVita" class="logo-img logo-img--mobile" />
          <div class="logo-icon" style="display:none;">
            <img src="images/Logo/logo.png" alt="VeraVita" style="width:100%;height:100%;object-fit:contain;" />
          </div>
          <span class="logo-text" style="display:none;">VeraVita</span>
        </a>

        <ul class="navbar-nav">
          <li><a href="/" class="nav-link ${isHome ? 'active' : ''}">Home</a></li>
          <li class="nav-dropdown">
            <a href="#" class="nav-link ${currentPath.includes('cat-') || currentPath.includes('services') ? 'active' : ''}">Services <i class="fa-solid fa-chevron-down" style="font-size:0.6rem;opacity:0.7;margin-left:0.1rem"></i></a>
            <div class="nav-dropdown-menu">
              <a href="/cat-naturopathic.html" class="nav-dd-item">
                <div class="nav-dd-icon"><i class="fa-solid fa-leaf"></i></div>
                <div class="nav-dd-text"><strong>Naturopathic Medicine</strong><span>Lead: Dr. Jill Nazar, ND</span></div>
              </a>
              <a href="/cat-iv-therapy.html" class="nav-dd-item">
                <div class="nav-dd-icon"><i class="fa-solid fa-droplet"></i></div>
                <div class="nav-dd-text"><strong>Testing & IV Therapy</strong><span>Lead: Dr. Jill Nazar, ND</span></div>
              </a>
              <a href="/cat-acupuncture.html" class="nav-dd-item">
                <div class="nav-dd-icon"><i class="fa-solid fa-hand-sparkles"></i></div>
                <div class="nav-dd-text"><strong>Acupuncture & TCM</strong><span>Leads: Dr. Viktoriia Taylor & Joseph Wei</span></div>
              </a>
              <a href="/cat-massage-therapy.html" class="nav-dd-item">
                <div class="nav-dd-icon"><i class="fa-solid fa-hand-holding-heart"></i></div>
                <div class="nav-dd-text"><strong>Massage Therapy</strong><span>Leads: Jean-Wilson, Lisseth & Johnvel</span></div>
              </a>
              <a href="/cat-osteopathy.html" class="nav-dd-item">
                <div class="nav-dd-icon"><i class="fa-solid fa-person-rays"></i></div>
                <div class="nav-dd-text"><strong>Osteopathy</strong><span>Lead: Amy Lutz, MOMSc</span></div>
              </a>
            </div>
          </li>
          <li><a href="/about.html" class="nav-link ${currentPath.includes('about') ? 'active' : ''}">About</a></li>
          <li><a href="/practitioners.html" class="nav-link ${currentPath.includes('practitioners') ? 'active' : ''}">Practitioners</a></li>
          <li><a href="/contact.html" class="nav-link ${currentPath.includes('contact') ? 'active' : ''}">Contact</a></li>
        </ul>

        <a href="https://veravitanaturopathicclinic.janeapp.com/" target="_blank" rel="noopener" class="btn-ihb btn-ihb--primary">
          <span class="btn-ihb-blob"></span>
          <span class="btn-ihb-default">Book an appointment</span>
          <span class="btn-ihb-reveal"><i class="fa-solid fa-arrow-right"></i> Book an appointment</span>
        </a>

        <button class="navbar-toggle" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>

      </div>
    </div>
  `;
})();

/* ---- Hero video source injection (device-aware) ---- */
const isMobile = window.matchMedia('(max-width: 768px)').matches;
(function () {
  const v = document.getElementById('hero-video');
  if (!v) return;
  const sources = [
    { src: 'images/Home Page Video.mp4', type: 'video/mp4' },
  ];
  sources.forEach(({ src, type }) => {
    const s = document.createElement('source');
    s.src = src; s.type = type;
    v.appendChild(s);
  });
  v.load();
})();

/* ---- Background videos: slow down + prevent black-flash on loop ---- */
document.querySelectorAll('.page-hero-video, .ph-cin-video').forEach(v => {
  if (v.classList.contains('page-hero-video')) v.playbackRate = 0.65;
  /* Seek back 0.4s before the end so the loop is seamless */
  v.addEventListener('timeupdate', function () {
    if (this.duration && this.currentTime >= this.duration - 0.4) {
      this.currentTime = 0;
    }
  }, { passive: true });
});

/* ---- GSAP + ScrollTrigger ---- */
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(500, 33);
}

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
  heroBg.src = 'images/bg-hero-section.webp';

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
      ctx.fillText('NATUROPATHIC MEDICINE · CALGARY', w / 2, labelY);
      ctx.letterSpacing = '0px';
    }
  }

  /* Create spacer — hero is position:fixed, content slides over it */
  const spacer = document.createElement('div');
  spacer.className = 'ph-cinematic-spacer';
  section.parentNode.insertBefore(spacer, section.nextSibling);
  spacer.style.height = isMobile ? '300vh' : '280vh';

  /* Drive canvas from GSAP ticker — fully optimized to ignore calls when offscreen */
  let heroActive = true;
  let needsDraw = true;
  
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.addEventListener('scrollStart', () => { needsDraw = true; });
    ScrollTrigger.addEventListener('scrollEnd', () => { needsDraw = false; drawFrame(); });
    gsap.ticker.add(function() { if (heroActive && needsDraw) drawFrame(); });
  }

  /* Hide hero when spacer is fully scrolled past */
  new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      heroActive = e.isIntersecting;
      section.style.visibility = e.isIntersecting ? 'visible' : 'hidden';
    });
  }, { threshold: 0 }).observe(spacer);

  /* Init hero items hidden */
  if (heroItems.length && typeof gsap !== 'undefined') {
    gsap.set(heroItems, { opacity: 0, y: 80 });

    /* ScrollTrigger timeline — NO pin, hero is already fixed.
       Spacer height controls total scroll distance.
       Zoom is snappy (done by 35%), text appears at 38%, rest is read buffer. */
    /* Animation scroll = 1.5 viewport heights for the zoom */
    var animEnd = Math.round(window.innerHeight * 1.5);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacer,
        start: 'top top',
        end: '+=' + animEnd,
        scrub: 0.4,
      }
    });

    /* Phase 1 (0–0.65): Logo zoom-through */
    tl
      .to(s, { labelAlpha: 0,     duration: 0.10, ease: 'none'      },  0   )
      .to(s, { textScale: 18,     duration: 0.65, ease: 'none'      },  0   )
      .to(s, { overlayAlpha: 0,   duration: 0.15, ease: 'power2.in' },  0.55);

    /* Phase 2 (0.65–1.0): Hero content fades in */
    if (heroItems.length) {
      tl.to(heroItems, {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        ease: 'power3.out',
        duration: 0.30,
      }, 0.68);
    }

    ScrollTrigger.refresh();
  }
})();

/* ===========================
   NAVBAR — scroll effect
   =========================== */
const navbar = document.querySelector('.navbar');
if (typeof ScrollTrigger !== 'undefined' && navbar) {
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    toggleClass: { className: 'navbar--scrolled', targets: navbar }
  });
}


/* ===========================
   HERO SPLIT — entrance animations
   =========================== */
(function () {
  if (typeof gsap === 'undefined') return;
  const item = { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' };

  if (document.querySelector('.hs-eyebrow')) {
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
  }
}());

/* ===========================
   GENERIC FADE-UP (all pages)
   =========================== */
if (typeof gsap !== 'undefined') {
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
}

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
      if (typeof gsap !== 'undefined') {
        gsap.from(pane, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' });
      }
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
        if (typeof gsap !== 'undefined') {
          gsap.from(card, { opacity: 0, y: 20, duration: 0.4 });
        }
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
    if (typeof gsap !== 'undefined') {
      gsap.set(answer, { height: 0, opacity: 0, paddingBottom: 0 });
    }
  }

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    /* close all */
    document.querySelectorAll('.faq-item.open').forEach(openItem => {
      openItem.classList.remove('open');
      const a = openItem.querySelector('.faq-answer');
      if (typeof gsap !== 'undefined') {
        gsap.to(a, { height: 0, opacity: 0, paddingBottom: 0, duration: 0.35, ease: 'power2.inOut' });
      }
    });

    if (!isOpen) {
      item.classList.add('open');
      if (typeof gsap !== 'undefined') {
        gsap.set(answer, { height: 'auto', opacity: 1, paddingBottom: '1.5rem' });
        gsap.from(answer, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
    }
  });
});

/* ===========================
   INTERIOR PAGE HERO ANIMATIONS
   =========================== */

if (typeof gsap !== 'undefined') {
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
}

/* ===========================
   MOBILE NAV TOGGLE
   =========================== */
const navToggle = document.querySelector('.navbar-toggle');
const navMenu   = document.querySelector('.navbar-nav');

function closeMobileNav() {
  if (!navMenu || !navMenu.classList.contains('open')) return;
  if (navToggle) navToggle.classList.remove('open');
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  if (typeof gsap !== 'undefined') {
    gsap.to(navMenu, { opacity: 0, y: -10, duration: 0.25, onComplete: () => navMenu.classList.remove('open') });
  } else {
    navMenu.classList.remove('open');
  }
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = navMenu.classList.contains('open');
    if (isOpen) {
      closeMobileNav();
    } else {
      navToggle.classList.add('open');
      navMenu.classList.add('open');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(navMenu, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.25 });
      }
    }
  });

  /* Don't close when interacting inside the menu itself */
  navMenu.addEventListener('click', e => e.stopPropagation());

  /* Tap/click anywhere outside the menu closes it */
  document.addEventListener('click', () => closeMobileNav());

  /* Closing the menu on scroll — record the scroll position when the menu opens
     so accidental sub-pixel scroll on tap doesn't immediately close it */
  let openScrollY = 0;
  const observeOpen = new MutationObserver(() => {
    if (navMenu.classList.contains('open')) openScrollY = window.scrollY;
  });
  observeOpen.observe(navMenu, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('scroll', () => {
    if (!navMenu.classList.contains('open')) return;
    if (Math.abs(window.scrollY - openScrollY) > 10) closeMobileNav();
  }, { passive: true });
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
  /* Skip forms with a real action (e.g. Web3Forms) */
  if (form.action && form.action !== '#' && !form.action.endsWith(window.location.pathname)) return;
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
if (typeof gsap !== 'undefined') {
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
  if (document.querySelector('.reveal')) {
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
  }

  /* ============================================
     TEXT GRADIENT SCROLL (per-word reveal)
     ============================================ */
  (function initTextGradientScroll() {
    const el = document.getElementById('intro-tgs');
    if (!el) return;

    /* Split text into spans per word */
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.innerHTML = words.map(function(w) {
      return '<span class="tgs-word">' + w + '</span>';
    }).join(' ');

    var wordEls = el.querySelectorAll('.tgs-word');

    /* Style: start dim, reveal to full color on scroll */
    gsap.set(wordEls, { opacity: 0.2 });

    gsap.to(wordEls, {
      opacity: 1,
      stagger: { each: 1 / wordEls.length },
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        end: 'bottom 50%',
        scrub: 0.3,
      }
    });
  })();

  /* ============================================
     TEAM CARD TOOLTIPS (GSAP spring-in)
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
}

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

  // Hide immediately via GSAP inline styles (or plain JS)
  if (typeof gsap !== 'undefined') {
    gsap.set(groups, { opacity: 0, y: 28 });
  }

  let played = false;
  function playAnim() {
    if (played) return;
    played = true;
    if (typeof gsap !== 'undefined') {
      gsap.to(groups, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power2.out',
        stagger: 0.1,
      });
    }
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
   PAUSE BACKGROUND VIDEOS WHEN OFF-SCREEN
   Reduces GPU load during scroll
   ============================================ */
(function initVideoPauseOnScroll() {
  document.querySelectorAll('.ph-cin-video, .accord-video-bg, .svc-hero-video').forEach(video => {
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
   LAZY-START MARQUEE — paused until visible
   ============================================ */
(function initLazyMarquee() {
  var track = document.getElementById('hwnu-track');
  if (!track) return;
  new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) track.classList.add('is-visible');
      else track.classList.remove('is-visible');
    });
  }, { threshold: 0.01 }).observe(track);
})();

/* ============================================
   SCROLL WORD REVEAL — .js-word-reveal
   ============================================ */
(function initWordReveal() {
  if (typeof gsap === 'undefined') return;
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
   ============================================ */
(function initGlowingBorders() {
  if (typeof gsap === 'undefined') return;
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

      /* Angle from card center to cursor */
      const targetAngle = (180 * Math.atan2(my - cy, mx - cx)) / Math.PI + 90;
      const current     = parseFloat(fx.style.getPropertyValue('--start') || '0');
      const diff        = ((targetAngle - current + 180) % 360) - 180;

      /* Smooth rotation */
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

  /* Re-evaluate on scroll */
  window.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => update(lastX, lastY));
  }, { passive: true });
})();

/* ============================================
   SERVICE DETAIL — Related Services Carousel
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

  /* Scrollable grid */
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

/* ============================================
   BG PARALLAX — green sections
   ============================================ */
(function initBgParallax() {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(max-width: 860px)').matches) return;

  const SELECTORS = [
    '.hwnu-section',
    '.tmd-section',
    '.about-statement-section',
    '.timeline-section',
    '.anim-testimonials',
    '.cth-section',
    '.cfaq-section',
    '.follow-section',
    '.prac-cta-section',
    '.section--book-green',
    '.careers-why',
    '.sd-body',
    '.pd-detail-section',
    '.pd-services-section',
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
          scrub: 0.5,
        }
      }
    );
  });
})();