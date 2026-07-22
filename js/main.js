(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Sticky reservation bar ──────────────────────────────
     Shows once the hero has scrolled out of view, hides again
     once the footer (which has its own reservation links) is reached. */
  var stickyCta = document.getElementById('stickyCta');
  var hero = document.querySelector('.jl-hero');
  var footer = document.querySelector('.jl-footer');

  if (stickyCta && hero && footer && 'IntersectionObserver' in window) {
    var heroVisible = true;
    var footerVisible = false;

    var updateStickyCta = function () {
      var shouldShow = !heroVisible && !footerVisible;
      stickyCta.classList.toggle('jl-sticky-cta--visible', shouldShow);
      stickyCta.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    };

    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      updateStickyCta();
    }).observe(hero);

    new IntersectionObserver(function (entries) {
      footerVisible = entries[0].isIntersecting;
      updateStickyCta();
    }).observe(footer);
  }

  /* ── Hero image carousel ─────────────────────────────────
     Auto-advances through the hero slides, with dot controls
     and touch-swipe support; pauses auto-advance for anyone who
     prefers reduced motion. */
  var heroSlides = document.querySelectorAll('.jl-hero__slide');
  var heroDots = document.querySelectorAll('.jl-hero__dot');
  var heroSlidesEl = document.getElementById('heroSlides');

  if (heroSlides.length > 1 && heroSlidesEl) {
    var currentSlide = 0;
    var autoplayId = null;
    var AUTOPLAY_MS = 5000;

    var goToSlide = function (index) {
      heroSlides[currentSlide].classList.remove('jl-hero__slide--active');
      if (heroDots[currentSlide]) {
        heroDots[currentSlide].classList.remove('jl-hero__dot--active');
        heroDots[currentSlide].setAttribute('aria-pressed', 'false');
      }

      currentSlide = (index + heroSlides.length) % heroSlides.length;

      heroSlides[currentSlide].classList.add('jl-hero__slide--active');
      if (heroDots[currentSlide]) {
        heroDots[currentSlide].classList.add('jl-hero__dot--active');
        heroDots[currentSlide].setAttribute('aria-pressed', 'true');
      }
    };

    var stopAutoplay = function () {
      if (autoplayId) {
        clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    var startAutoplay = function () {
      if (prefersReducedMotion) return;
      stopAutoplay();
      autoplayId = setInterval(function () {
        goToSlide(currentSlide + 1);
      }, AUTOPLAY_MS);
    };

    heroDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        goToSlide(i);
        startAutoplay();
      });
    });

    var touchStartX = null;
    heroSlidesEl.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    heroSlidesEl.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 40) {
        goToSlide(currentSlide + (deltaX < 0 ? 1 : -1));
        startAutoplay();
      }
      touchStartX = null;
    }, { passive: true });

    startAutoplay();
  }

  /* ── Heritage number scramble ────────────────────────────
     Digits flicker randomly and lock in left-to-right until the
     real value (1971 / 55년 / 100%) settles, once per element. */
  var heritageNumbers = document.querySelectorAll('[data-count-target]');

  var randomDigits = function (length) {
    var out = '';
    for (var i = 0; i < length; i++) {
      out += Math.floor(Math.random() * 10);
    }
    return out;
  };

  var scrambleToTarget = function (el) {
    var target = el.getAttribute('data-count-target');
    var suffix = el.getAttribute('data-count-suffix') || '';

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    var duration = 1500;
    var start = null;

    var step = function (timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var lockCount = Math.floor(progress * target.length);

      el.textContent = target.slice(0, lockCount) + randomDigits(target.length - lockCount) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    };

    requestAnimationFrame(step);
  };

  if (heritageNumbers.length) {
    if ('IntersectionObserver' in window) {
      var countObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            scrambleToTarget(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });

      heritageNumbers.forEach(function (el) {
        countObserver.observe(el);
      });
    } else {
      heritageNumbers.forEach(function (el) {
        el.textContent = el.getAttribute('data-count-target') + (el.getAttribute('data-count-suffix') || '');
      });
    }
  }

  /* ── Scroll reveal ────────────────────────────────────────
     Text blocks and image slots fade + rise into place the first
     time they cross into the viewport. */
  var revealEls = document.querySelectorAll('.jl-reveal');

  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) {
        el.classList.add('jl-reveal--visible');
      });
    } else {
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('jl-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

      revealEls.forEach(function (el) {
        revealObserver.observe(el);
      });
    }
  }
})();
