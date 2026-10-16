window.nwAnimateCountUp = window.nwAnimateCountUp || function (el, options) {
  if (!el) return;

  var targetRaw = el.getAttribute('data-nw-count-target');
  if (!targetRaw) return;

  var target = parseFloat(String(targetRaw).replace(/,/g, ''));
  if (!Number.isFinite(target)) return;

  var settings = options || {};
  var duration = settings.duration || 2000;
  var decimals = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
  var startedAt = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function format(value) {
    var fixed = value.toFixed(decimals);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function frame(now) {
    var progress = Math.min(1, (now - startedAt) / duration);
    var current = target * easeOutCubic(progress);
    el.textContent = format(current);
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = format(target);
    }
  }

  el.textContent = format(0);
  requestAnimationFrame(frame);
};

if (!customElements.get('nw-trade-in-hero')) {
  class NwTradeInHero extends HTMLElement { 
    connectedCallback() {
      this._swiper = null;
      this._videoBound = false;
      this._counterStarted = false;

      this._syncVideoLoop();
      this._startCounters();
      this._whenSwiperReady(() => {
        this._initSlider();
        this._bindVideoEvents();
        this._handleActiveSlideVideo();
      });
      this._bindEditorEvents();
    }

    disconnectedCallback() {
      this._destroySlider();
      this._unbindEditorEvents();
    }

    _whenSwiperReady(callback) {
      if (typeof window.nwWhenSwiperReady === 'function') {
        window.nwWhenSwiperReady(callback);
      } else if (typeof Swiper !== 'undefined') {
        callback();
      } else {
        window.setTimeout(() => this._whenSwiperReady(callback), 50);
      }
    }

    _startCounters() {
      if (this._counterStarted) return;
      this._counterStarted = true;

      var duration = parseInt(this.dataset.counterDuration, 10) || 2000;
      var run = () => {
        this.querySelectorAll('[data-nw-count-target]').forEach(function (el) {
          window.nwAnimateCountUp(el, { duration: duration });
        });
      };

      if (typeof window.nwAnimateCountUp === 'function') {
        run();
      } else {
        requestAnimationFrame(run);
      }
    }

    _destroySlider() {
      var sliderEl = this.querySelector('[data-nw-trade-in-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
      this._swiper = null;
    }

    _pauseAllVideos() {
      this.querySelectorAll('video').forEach(function (video) {
        video.pause();
        var slide = video.closest('.nw-trade-in-hero__slide');
        if (slide) slide.classList.remove('is-playing');
      });
    }

    _isSettingTrue(value) {
      return value === 'true' || value === true;
    }

    _shouldAutoplayVideo() {
      return this._isSettingTrue(this.dataset.videoAutoplay);
    }

    _shouldLoopVideos() {
      return this._isSettingTrue(this.dataset.loopVideos);
    }

    _getTransitionSpeed() {
      var speed = parseInt(this.dataset.sliderSpeed, 10);
      return Number.isFinite(speed) && speed > 0 ? speed : 750;
    }

    _getAutoplayDelay() {
      var delay = parseInt(this.dataset.autoplayDelay, 10);
      return Number.isFinite(delay) && delay > 0 ? delay : 6000;
    }

    _getSlidesOffsetAfter() {
      var parsed = parseFloat(getComputedStyle(this).getPropertyValue('--nw-slider-offset-after'));
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 20;
    }

    _applySlidesOffsetAfter(swiper) {
      if (!swiper || swiper.destroyed) return;
      swiper.params.slidesOffsetAfter = this._getSlidesOffsetAfter();
      swiper.update();
    }

    _syncVideoLoop() {
      var shouldLoop = this._shouldLoopVideos();
      this.querySelectorAll('.nw-trade-in-hero__video').forEach(function (video) {
        video.loop = shouldLoop;
      });
    }

    _getActiveSlideEl() {
      var sliderEl = this.querySelector('[data-nw-trade-in-slider]');
      if (sliderEl) {
        var active = sliderEl.querySelector('.swiper-slide-active');
        if (active) return active;
      }
      return this.querySelector('.nw-trade-in-hero__slide');
    }

    _handleActiveSlideVideo() {
      if (!this._shouldAutoplayVideo()) return;

      this._pauseAllVideos();

      var activeSlide = this._getActiveSlideEl();
      if (!activeSlide) return;

      var video = activeSlide.querySelector('video');
      if (!video) return;

      video.muted = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
      activeSlide.classList.add('is-playing');
    }

    _toggleVideoPlayback(slide, video, btn) {
      if (!video) return;

      if (!btn && slide) {
        btn = slide.querySelector('[data-nw-trade-in-video-toggle]');
      }

      if (video.paused) {
        this._pauseAllVideos();
        video.muted = false;
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
        if (slide) slide.classList.add('is-playing');
        if (btn) btn.setAttribute('aria-label', 'Pause video');
        var sliderEl = this.querySelector('[data-nw-trade-in-slider]');
        if (sliderEl && sliderEl.swiper && sliderEl.swiper.autoplay) {
          sliderEl.swiper.autoplay.stop();
        }
      } else {
        video.pause();
        if (slide) slide.classList.remove('is-playing');
        if (btn) btn.setAttribute('aria-label', 'Play video');
        var sliderEl2 = this.querySelector('[data-nw-trade-in-slider]');
        if (
          sliderEl2 &&
          sliderEl2.swiper &&
          sliderEl2.swiper.autoplay &&
          window.nwAutoplayEnabled(this._isSettingTrue(this.dataset.enableAutoplay))
        ) {
          sliderEl2.swiper.autoplay.start();
        }
      }
    }

    _updateNavState(swiper, prevEl, nextEl) {
      if (!swiper || !prevEl || !nextEl) return;

      var atStart = swiper.isBeginning;
      var atEnd = swiper.isEnd;

      prevEl.classList.toggle('swiper-button-disabled', atStart);
      nextEl.classList.toggle('swiper-button-disabled', atEnd);
      prevEl.toggleAttribute('disabled', atStart);
      nextEl.toggleAttribute('disabled', atEnd);
    }

    _bindNavClicks(swiper) {
      var navRoot = this.querySelector('[data-nw-trade-in-nav]');
      if (!navRoot || !swiper) return;

      var prevEl = navRoot.querySelector('.nw-swiper-btn--prev');
      var nextEl = navRoot.querySelector('.nw-swiper-btn--next');
      if (!prevEl || !nextEl) return;

      if (this._navHandlers) {
        prevEl.removeEventListener('click', this._navHandlers.prev);
        nextEl.removeEventListener('click', this._navHandlers.next);
      }

      var self = this;

      this._navHandlers = {
        prev: function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (!swiper || swiper.destroyed || swiper.isBeginning) return;
          swiper.slidePrev();
        },
        next: function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (!swiper || swiper.destroyed || swiper.isEnd) return;
          swiper.slideNext();
        }
      };

      prevEl.addEventListener('click', this._navHandlers.prev);
      nextEl.addEventListener('click', this._navHandlers.next);

      this._updateNavState(swiper, prevEl, nextEl);

      var syncNav = function () {
        self._updateNavState(swiper, prevEl, nextEl);
      };

      swiper.on('slideChange', syncNav);
      swiper.on('slideChangeTransitionEnd', syncNav);
      swiper.on('resize', syncNav);
      swiper.on('reachBeginning', syncNav);
      swiper.on('reachEnd', syncNav);
    }

    _bindVideoEvents() {
      if (this._videoBound) return;
      this._videoBound = true;

      this.addEventListener('click', (e) => {
        if (e.target.closest('[data-nw-trade-in-nav]') || e.target.closest('.nw-swiper-btn')) return;

        var slide = e.target.closest('.nw-trade-in-hero__slide');
        if (!slide) return;

        var video = slide.querySelector('video');
        if (!video) return;

        var mediaInner = slide.querySelector('.nw-trade-in-hero__media-inner');
        if (!mediaInner || !mediaInner.contains(e.target)) return;

        e.preventDefault();
        var btn = slide.querySelector('[data-nw-trade-in-video-toggle]');
        this._toggleVideoPlayback(slide, video, btn);
      });

      this.addEventListener('ended', (e) => {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        var video = e.target;

        if (this._shouldLoopVideos() || video.loop) {
          return;
        }

        var slide = video.closest('.nw-trade-in-hero__slide');
        if (slide) slide.classList.remove('is-playing');

        var sliderEl = this.querySelector('[data-nw-trade-in-slider]');
        if (
          sliderEl &&
          sliderEl.swiper &&
          sliderEl.swiper.autoplay &&
          window.nwAutoplayEnabled(this._isSettingTrue(this.dataset.enableAutoplay))
        ) {
          sliderEl.swiper.autoplay.start();
        }
      }, true);

      this.addEventListener('pause', (e) => {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        if (e.target.ended) return;
        var slide = e.target.closest('.nw-trade-in-hero__slide');
        if (slide && e.target.paused) slide.classList.remove('is-playing');
      }, true);
    }

    _initSlider() {
      var sliderEl = this.querySelector('[data-nw-trade-in-slider]');
      if (!sliderEl || typeof Swiper === 'undefined') return;

      if (sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }

      var slideCount =
        parseInt(this.dataset.slideCount, 10) || sliderEl.querySelectorAll('.swiper-slide').length;

      if (slideCount <= 1) {
        this._handleActiveSlideVideo();
        return;
      }

      var enableAutoplay = this._isSettingTrue(this.dataset.enableAutoplay);
      var autoplayDelay = this._getAutoplayDelay();
      var showArrows = this._isSettingTrue(this.dataset.showArrows);
      var useFade = this.dataset.sliderEffect === 'fade';
      var transitionSpeed = this._getTransitionSpeed();

      var swiperOptions = {
        slidesPerView: 'auto',
        spaceBetween: 16,
        slidesOffsetAfter: this._getSlidesOffsetAfter(),
        speed: transitionSpeed,
        watchOverflow: true,
        grabCursor: true,
        allowTouchMove: true,
        loop: false,
        rewind: false,
        observer: true,
        observeParents: true,
        observeSlideChildren: false,
        watchSlidesProgress: true,
        roundLengths: false,
        touchRatio: 1,
        threshold: 5,
        longSwipesRatio: 0.35,
        resistanceRatio: 0.85,
        breakpoints: {
          0: { spaceBetween: 12 },
          750: { spaceBetween: 16 }
        }
      };

      if (useFade) {
        swiperOptions.slidesPerView = 1;
        swiperOptions.spaceBetween = 0;
        swiperOptions.effect = 'fade';
        swiperOptions.fadeEffect = { crossFade: true };
      }

      if (window.nwAutoplayEnabled(enableAutoplay)) {
        swiperOptions.autoplay = {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true,
          stopOnLastSlide: true
        };
      }

      var swiperInstance = new Swiper(sliderEl, swiperOptions);
      this._swiper = swiperInstance;

      if (showArrows) {
        this._bindNavClicks(swiperInstance);
      }

      swiperInstance.on('slideChangeTransitionStart', () => {
        this._pauseAllVideos();
        this.querySelectorAll('.nw-trade-in-hero__slide.is-playing').forEach(function (slide) {
          slide.classList.remove('is-playing');
        });
      });

      swiperInstance.on('slideChangeTransitionEnd', () => {
        this._handleActiveSlideVideo();
      });

      var self = this;
      swiperInstance.on('resize', function () {
        self._applySlidesOffsetAfter(swiperInstance);
      });

      window.requestAnimationFrame(function () {
        if (!swiperInstance || swiperInstance.destroyed) return;
        self._applySlidesOffsetAfter(swiperInstance);
        swiperInstance.slideTo(0, 0, false);
        if (showArrows) {
          var navRoot = self.querySelector('[data-nw-trade-in-nav]');
          if (navRoot) {
            self._updateNavState(
              swiperInstance,
              navRoot.querySelector('.nw-swiper-btn--prev'),
              navRoot.querySelector('.nw-swiper-btn--next')
            );
          }
        }
        self._syncVideoLoop();
        self._handleActiveSlideVideo();
      });
    }

    _onSectionLoad = (e) => {
      var section = this.closest('.shopify-section');
      if (!section || e.target !== section) return;
      this._videoBound = false;
      this._counterStarted = false;
      this.querySelectorAll('[data-nw-count-target]').forEach(function (el) {
        el.textContent = '0';
      });
      this._syncVideoLoop();
      this._startCounters();
      this._whenSwiperReady(() => {
        this._initSlider();
        this._bindVideoEvents();
        this._handleActiveSlideVideo();
      });
    };

    _onBlockSelect = (e) => {
      var sliderEl = this.querySelector('[data-nw-trade-in-slider]');
      if (!sliderEl || !sliderEl.swiper) return;
      var slideIndex = e.target.getAttribute('data-slide-index');
      if (slideIndex === null || slideIndex === undefined) return;
      var index = parseInt(slideIndex, 10);
      sliderEl.swiper.slideTo(index, 400);
      this._handleActiveSlideVideo();
    };

    _bindEditorEvents() {
      if (typeof Shopify === 'undefined' || !Shopify.designMode) return;
      document.addEventListener('shopify:section:load', this._onSectionLoad);
      document.addEventListener('shopify:block:select', this._onBlockSelect);
    }

    _unbindEditorEvents() {
      if (typeof Shopify === 'undefined' || !Shopify.designMode) return;
      document.removeEventListener('shopify:section:load', this._onSectionLoad);
      document.removeEventListener('shopify:block:select', this._onBlockSelect);
    }
  }

  customElements.define('nw-trade-in-hero', NwTradeInHero);
}
