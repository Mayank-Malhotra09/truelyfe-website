/* =============================================
   TrueLyfe Landing Page — Interactivity
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ─── 1. Scroll Animations (Intersection Observer) ───
  const animateElements = document.querySelectorAll('.animate-on-scroll');

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animateElements.forEach((el) => scrollObserver.observe(el));


  // ─── 2. Navbar Scroll Effect ───
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });


  // ─── 3. SKU Toggle (Hero Variant Switch) ───
  const skuBtns = document.querySelectorAll('.sku-btn');
  const bottleTeal = document.getElementById('bottle-teal');
  const bottlePurple = document.getElementById('bottle-purple');
  const heroHeadline = document.getElementById('hero-headline');
  const heroSubheadline = document.getElementById('hero-subheadline');
  const heroSubmitBtn = document.getElementById('hero-submit-btn');

  const variantContent = {
    regular: {
      headline: 'Milk That Works As Hard As You Do.',
      subheadline: 'TrueLyfe is ultra-filtered whole cow milk with 2x the protein of regular milk — sterilized, pure, and delivered to your door. No powders. No compromises.',
      btnClass: 'btn-teal'
    },
    'lactose-free': {
      headline: 'Great Taste. Zero Discomfort.',
      subheadline: 'Lactose is a natural sugar in milk that nearly 70% of people struggle to digest — causing gas, bloating, and discomfort. TrueLyfe Lactose-Free breaks down lactose naturally, so you get real whole cow milk with 2x protein, without any of the digestive trouble.',
      btnClass: 'btn-purple'
    }
  };

  skuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const variant = btn.dataset.variant;

      // Update active button
      skuBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Crossfade bottles
      if (variant === 'lactose-free') {
        bottleTeal.classList.remove('active');
        bottlePurple.classList.add('active');
      } else {
        bottlePurple.classList.remove('active');
        bottleTeal.classList.add('active');
      }

      // Update text with fade
      const content = variantContent[variant];
      heroHeadline.style.opacity = 0;
      heroSubheadline.style.opacity = 0;

      setTimeout(() => {
        heroHeadline.textContent = content.headline;
        heroSubheadline.textContent = content.subheadline;
        heroHeadline.style.opacity = 1;
        heroSubheadline.style.opacity = 1;
      }, 200);

      // Update button color
      heroSubmitBtn.classList.remove('btn-teal', 'btn-purple');
      heroSubmitBtn.classList.add(content.btnClass);
    });
  });


  // ─── Google Sheet URL (used by counter + form submission) ───
  const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyWzCNTS9pjnhbYHq7idoCEZk_h4ByoOn81wcRF9cZp0r9qR--W2d3R6-B6moTuwqOo/exec';

  // ─── 4. Waitlist Counter Animation (Dynamic from Google Sheets) ───
  const counterEl = document.getElementById('counter-number');
  const BASE_COUNT = 100; // Base offset — displayed count = BASE_COUNT + actual signups
  let currentCount = BASE_COUNT; // Start with base, updated after fetch
  let counted = false;

  // Animate counter from `from` to `to` over `duration` ms
  function animateCounter(el, from, to, duration) {
    const start = performance.now();
    const diff = to - from;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(from + eased * diff);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = to;
      }
    }

    requestAnimationFrame(tick);
  }

  // Fetch live count from Google Sheets on page load
  async function fetchWaitlistCount() {
    try {
      const response = await fetch(GOOGLE_SHEET_URL);
      const data = await response.json();
      if (data.status === 'success' && typeof data.count === 'number') {
        currentCount = BASE_COUNT + data.count;
      } else {
        currentCount = BASE_COUNT; // fallback to base only
      }
    } catch (err) {
      console.warn('Could not fetch waitlist count, using fallback:', err);
      currentCount = BASE_COUNT; // fallback to base only
    }

    // If counter is already in view, animate immediately
    if (counted) {
      counterEl.textContent = currentCount;
    }
  }

  // Observe the counter element — animate when it scrolls into view
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !counted) {
        counted = true;
        animateCounter(counterEl, 0, currentCount, 1500);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counterObserver.observe(document.getElementById('waitlist-counter'));

  // Increment counter after successful submission (called from form handler)
  function incrementCounter() {
    const oldCount = currentCount;
    currentCount += 1;
    animateCounter(counterEl, oldCount, currentCount, 600);
  }

  // Kick off the fetch
  fetchWaitlistCount();


  // ─── 5. Waitlist Form Handling (Google Sheets Integration) ───

  const heroForm = document.getElementById('hero-email-form');
  const heroSuccess = document.getElementById('hero-success');
  const finalForm = document.getElementById('final-email-form');
  const finalSuccess = document.getElementById('final-success');
  let emailSubmitted = false;

  function handleFormSubmit(form, successEl) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const phone = form.querySelector('[name="phone"]').value.trim();
      const age = form.querySelector('[name="age"]').value;

      if (!name || !email || !isValidEmail(email) || !phone || !age) return;

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      try {
        // Send to Google Sheets
        if (GOOGLE_SHEET_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
          await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'signup', name, email, phone, age })
          });
        }

        // Show success
        successEl.classList.add('show');
        form.querySelector('.form-fields').style.display = 'none';
        const note = form.querySelector('.email-note');
        if (note) note.style.display = 'none';
        emailSubmitted = true;

        // Hide mobile sticky CTA
        const mobileCta = document.getElementById('mobile-sticky-cta');
        if (mobileCta) {
          mobileCta.classList.remove('visible');
          mobileCta.style.display = 'none';
        }

        // Sync the other form
        if (form === heroForm) {
          showSuccessOnOther(finalForm, finalSuccess);
        } else {
          showSuccessOnOther(heroForm, heroSuccess);
        }

        // Increment the waitlist counter
        incrementCounter();

        // Fire Meta Pixel Lead event for conversion tracking
        if (typeof fbq === 'function') {
          fbq('track', 'Lead', {
            content_name: 'Waitlist Signup',
            content_category: 'Early Access'
          });
        }
      } catch (err) {
        console.error('Submission error:', err);
        // Still show success (data may have been saved via no-cors)
        successEl.classList.add('show');
        form.querySelector('.form-fields').style.display = 'none';
        const note = form.querySelector('.email-note');
        if (note) note.style.display = 'none';
        emailSubmitted = true;
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  function showSuccessOnOther(form, successEl) {
    successEl.classList.add('show');
    const fields = form.querySelector('.form-fields');
    if (fields) fields.style.display = 'none';
    const note = form.querySelector('.email-note');
    if (note) note.style.display = 'none';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  handleFormSubmit(heroForm, heroSuccess);
  handleFormSubmit(finalForm, finalSuccess);


  // ─── 6. Smooth Scroll for All CTAs ───
  document.querySelectorAll('.scroll-to-form, .nav-cta, [href="#hero"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const heroSection = document.getElementById('hero');
      const heroInput = document.getElementById('hero-email-input');

      heroSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus the email input after scroll
      setTimeout(() => {
        if (!emailSubmitted) {
          heroInput.focus();
        }
      }, 600);
    });
  });


  // ─── 7. Mobile Sticky CTA ───
  const mobileCta = document.getElementById('mobile-sticky-cta');
  const heroSection = document.getElementById('hero');

  if (mobileCta && heroSection) {
    const stickyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!emailSubmitted) {
          if (entry.isIntersecting) {
            mobileCta.classList.remove('visible');
          } else {
            mobileCta.classList.add('visible');
          }
        }
      });
    }, { threshold: 0.1 });

    stickyObserver.observe(heroSection);
  }


  // ─── 8. Testimonial Ticker Pause on Hover ───
  const tickerTrack = document.getElementById('ticker-track');
  if (tickerTrack) {
    tickerTrack.addEventListener('mouseenter', () => {
      tickerTrack.style.animationPlayState = 'paused';
    });
    tickerTrack.addEventListener('mouseleave', () => {
      tickerTrack.style.animationPlayState = 'running';
    });
  }


  // ─── 9. Process Card Number Fix ───
  // Fix the process card numbers (correcting any typos in HTML)
  const processCards = document.querySelectorAll('.process-card');
  processCards.forEach((card, index) => {
    const numEl = card.querySelector('.process-number');
    if (numEl) {
      numEl.textContent = String(index + 1).padStart(2, '0');
    }
  });

});
