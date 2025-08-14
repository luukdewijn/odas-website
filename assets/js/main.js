// ODAS — main interactions and hero background animation

(function () {
  const header = document.querySelector('.site-header');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  // Keep the glassy header permanent
  header.classList.add('scrolled');

  // Active nav link highlighting
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id');
        const link = navLinks.find((a) => a.getAttribute('href') === `#${id}`);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0.2 }
  );
  sections.forEach((sec) => observer.observe(sec));

  // Smooth scroll with proper offset is handled by CSS scroll-behavior and scroll-margin-top on sections

  // Page enter animation — remove class after first frame on load for smooth reveal
  function triggerPageEnter() {
    document.body.classList.remove('page-enter');
  }
  if (document.readyState === 'complete') {
    requestAnimationFrame(triggerPageEnter);
  } else {
    window.addEventListener('load', () => requestAnimationFrame(triggerPageEnter));
  }

  // Contact form handling → send POST request to webhook (CORS-safe)
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      statusEl.textContent = '';

      const name = (document.getElementById('name') || {}).value?.trim() || '';
      const yourEmail = (document.getElementById('email') || {}).value?.trim() || '';
      const message = (document.getElementById('message') || {}).value?.trim() || '';

      if (!name || !yourEmail || !message) {
        statusEl.textContent = 'Please complete all fields.';
        return;
      }

      // Email format validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const emailInput = document.getElementById('email');
      if (!emailPattern.test(yourEmail)) {
        statusEl.textContent = 'Please enter a valid email address.';
        if (emailInput) {
          emailInput.setAttribute('aria-invalid', 'true');
          try { emailInput.focus(); } catch (_) {}
        }
        return;
      }
      if (emailInput) emailInput.removeAttribute('aria-invalid');

      const endpoint = 'https://one-anemone-able.ngrok-free.app/webhook/ee7d496c-9ada-4b75-82f2-c64fa8f1e759';
      const params = new URLSearchParams({ name, yourEmail, message });

      statusEl.textContent = 'Sending…';

      // Prefer sendBeacon (no CORS required, fire-and-forget). Fallback to POST fetch with safe-listed content-type.
      const sentWithBeacon = typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
        ? navigator.sendBeacon(endpoint, params)
        : false;

      if (sentWithBeacon) {
        statusEl.textContent = "Thanks! We'll be in touch shortly.";
        try { form.reset(); } catch (_) {}
        return;
      }

      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: params
      })
        .then(() => {
          statusEl.textContent = "Thanks! We'll be in touch shortly.";
          try { form.reset(); } catch (_) {}
        })
        .catch(() => {
          statusEl.textContent = "Thanks! We'll be in touch shortly.";
        });
    });
  }

  // HERO animated background — particle network in faint red tones
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('hero-bg');
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!prefersReduced && canvas && ctx) {
    let width = 0;
    let height = 0;
    let particles = [];
    let animationId;

  const config = {
      density: 0.00008, // particles per pixel
      maxVelocity: 0.4,
      linkDistance: 140,
      pointRadius: 1.6,
      lineColor: 'rgba(254, 0, 27, 0.15)',
      pointColor: 'rgba(254, 0, 27, 0.32)'
    };

    function init() {
      resize();
      createParticles();
      cancelAnimationFrame(animationId);
      animate();
    }

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function createParticles() {
      const count = Math.max(40, Math.floor(width * height * config.density));
      particles = new Array(count).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * config.maxVelocity,
        vy: (Math.random() - 0.5) * config.maxVelocity
      }));
    }

    function step() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20 || p.x > width + 20) p.vx *= -1;
        if (p.y < -20 || p.y > height + 20) p.vy *= -1;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Lines
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);
          if (dist < config.linkDistance) {
            ctx.strokeStyle = config.lineColor;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }
      ctx.stroke();

      // Points
      ctx.fillStyle = config.pointColor;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, config.pointRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      step();
      draw();
      animationId = requestAnimationFrame(animate);
    }

    const onResize = () => {
      resize();
      createParticles();
    };
    window.addEventListener('resize', onResize);
    init();

    // Cleanup when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animationId);
      else animate();
    });
  }
})();


