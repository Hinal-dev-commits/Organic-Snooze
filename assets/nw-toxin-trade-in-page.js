(function () {
  var MAIN_ID = 'MainContent';
  var SCROLL_TRIGGER = 'scroll-trigger';
  var OFFER_HASH = '#toxin-offer';
  var OFFER_ID = 'toxin-offer';
  var SCROLL_GAP = 12;

  var SECTION_TARGETS = [
    { match: 'section-nw-trade-in-hero', selector: '.nw-trade-in-hero__content-col', animation: 'fade-in' },
    { match: 'section-nw-trade-in-video-explainer', selector: '.nw-trade-in-video-explainer__content-col', animation: 'slide-in' },
    { match: 'section-nw-testimonial-video', selector: '.nw-testimonial-video__header', animation: 'slide-in' },
    { match: 'section-nw-testimonial-video', selector: '.nw-testimonial-video__slider-block', animation: 'slide-in' },
    { match: 'section-nw-offer', selector: '.nw-offer__copy', animation: 'slide-in' },
    { match: 'section-nw-offer', selector: '.nw-offer__card', animation: 'slide-in' },
    { match: 'section-nw-step-v3', selector: '.nw-step-v3__header', animation: 'slide-in' },
    { match: 'section-nw-old-mattress', selector: '.nw-old-mattress__header', animation: 'slide-in' },
    { match: 'section-nw-shop-mattress', selector: '.nw-shop-mattress__header', animation: 'slide-in' },
    { match: 'section-nw-faq-v3', selector: '.nw-faq-v3__heading--desktop', animation: 'slide-in' },
    { match: 'section-nw-our-story', selector: '.nw-our-story__header', animation: 'slide-in' },
  ];

  function getToxinTradeInMain() {
    var main = document.getElementById(MAIN_ID);
    if (!main || !main.classList.contains('nw-toxin-trade-in-page')) return null;
    return main;
  }

  function getMainForAnimations() {
    var main = getToxinTradeInMain();
    if (!main || main.getAttribute('data-nw-scroll-animate') !== 'true') return null;
    return main;
  }

  function getScrollBehavior() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'auto';
    }
    return 'smooth';
  }

  function getHeaderScrollOffset() {
    var rootStyles = window.getComputedStyle(document.documentElement);
    var headerHeight = parseFloat(rootStyles.getPropertyValue('--header-height'));
    if (Number.isFinite(headerHeight) && headerHeight > 0) {
      return Math.round(headerHeight) + SCROLL_GAP;
    }

    var stickyHeader = document.querySelector('sticky-header');
    if (stickyHeader && stickyHeader.offsetHeight) {
      return stickyHeader.offsetHeight + SCROLL_GAP;
    }

    var headerWrapper = document.querySelector('.header-wrapper');
    if (headerWrapper) {
      return Math.round(headerWrapper.getBoundingClientRect().height) + SCROLL_GAP;
    }

    return 76 + SCROLL_GAP;
  }

  function getOfferTarget() {
    return document.getElementById(OFFER_ID);
  }

  function scrollToOfferSection(updateHash) {
    var target = getOfferTarget();
    if (!target) return false;

    var offset = getHeaderScrollOffset();
    var top =
      target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - offset;

    window.scrollTo({
      top: Math.max(0, top),
      left: 0,
      behavior: getScrollBehavior(),
    });

    if (updateHash !== false && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', OFFER_HASH);
    }

    return true;
  }

  function normalizeHash(hash) {
    if (!hash) return '';
    var value = String(hash).trim().toLowerCase();
    if (value.charAt(0) !== '#') value = '#' + value;
    return value;
  }

  function isSamePagePath(url) {
    return (
      url.origin === window.location.origin &&
      url.pathname.replace(/\/+$/, '') === window.location.pathname.replace(/\/+$/, '')
    );
  }

  function isOfferAnchorLink(anchor) {
    if (!anchor || anchor.tagName !== 'A') return false;
    var href = anchor.getAttribute('href');
    if (!href || href === '#') return false;

    var hash = '';
    if (href.charAt(0) === '#') {
      hash = normalizeHash(href);
    } else {
      try {
        var url = new URL(anchor.href, window.location.href);
        if (!isSamePagePath(url)) return false;
        hash = normalizeHash(url.hash);
      } catch (err) {
        return false;
      }
    }

    return hash === OFFER_HASH;
  }

  function bindOfferAnchorScroll(main) {
    if (main._nwOfferScrollBound) return;
    main._nwOfferScrollBound = true;

    main.addEventListener('click', function (event) {
      var anchor = event.target.closest('a[href]');
      if (!anchor || !main.contains(anchor)) return;
      if (!isOfferAnchorLink(anchor)) return;

      event.preventDefault();
      scrollToOfferSection(true);
    });

    if (normalizeHash(window.location.hash) === OFFER_HASH) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          scrollToOfferSection(false);
        });
      });
    }
  }

  function addAnimationClasses(el, animation) {
    if (!el || el.classList.contains(SCROLL_TRIGGER)) return;
    el.classList.add(SCROLL_TRIGGER, 'animate--' + animation);
  }

  function revealScrollTriggersInViewport(root) {
    if (!root) return;
    var triggers = root.querySelectorAll('.scroll-trigger--offscreen');
    triggers.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        el.classList.remove('scroll-trigger--offscreen');
      }
    });
  }

  function applyScrollAnimations(main) {
    SECTION_TARGETS.forEach(function (config) {
      var sections = main.querySelectorAll('.shopify-section.' + config.match);
      sections.forEach(function (section) {
        var target = section.querySelector(config.selector);
        addAnimationClasses(target, config.animation);
      });
    });

    if (typeof initializeScrollAnimationTrigger === 'function') {
      initializeScrollAnimationTrigger(main);
    }

    revealScrollTriggersInViewport(main);
    window.requestAnimationFrame(function () {
      revealScrollTriggersInViewport(main);
    });
  }

  function init() {
    var main = getToxinTradeInMain();
    if (!main) return;

    bindOfferAnchorScroll(main);

    var animationMain = getMainForAnimations();
    if (animationMain) applyScrollAnimations(animationMain);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (event) {
      var main = getToxinTradeInMain();
      if (!main || !main.contains(event.target)) return;

      var animationMain = getMainForAnimations();
      if (animationMain) {
        applyScrollAnimations(animationMain);
        if (typeof initializeScrollAnimationTrigger === 'function') {
          initializeScrollAnimationTrigger(event.target, true);
        }
      }
    });
  }
})();
