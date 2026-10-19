if (!customElements.get('nw-testimonial-video')) {
  class NwTestimonialVideo extends HTMLElement {
    connectedCallback() {
      this._swiper = null;
      this._videoBound = false;
      this._syncVideoLoop();
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

    _isSettingTrue(value) {
      return value === 'true' || value === true;
    }

    _shouldLoopVideos() {
      return this._isSettingTrue(this.dataset.loopVideos);
    }

    _shouldAutoplayVideo() {
      return this._isSettingTrue(this.dataset.videoAutoplay);
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
      this.querySelectorAll('.nw-testimonial-video__video').forEach(function (video) {
        video.loop = shouldLoop;
      });
    }

    _destroySlider() {
      var sliderEl = this.querySelector('[data-nw-tv-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
      this._swiper = null;
    }

    _pauseAllVideos(resetPlayingState) {
      this.querySelectorAll('video').forEach(function (video) {
        video.pause();
        if (resetPlayingState) {
          var slide = video.closest('.nw-testimonial-video__slide');
          if (slide) slide.classList.remove('is-playing');
        }
      });
    }

    _setSliderSliding(isSliding) {
      var block = this.querySelector('.nw-testimonial-video__slider-block');
      if (!block) return;
      block.classList.toggle('is-sliding', isSliding);
    }

    _getActiveSlideEl() {
      var sliderEl = this.querySelector('[data-nw-tv-slider]');
      if (sliderEl) {
        var active = sliderEl.querySelector('.swiper-slide-active');
        if (active) return active;
      }
      return this.querySelector('.nw-testimonial-video__slide');
    }

    _handleActiveSlideVideo() {
      if (!this._shouldAutoplayVideo()) return;
      this._pauseAllVideos(true);
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
        btn = slide.querySelector('[data-nw-tv-video-toggle]');
      }

      if (video.paused) {
        this._pauseAllVideos(true);
        var sliderEl = this.querySelector('[data-nw-tv-slider]');
        if (sliderEl && sliderEl.swiper && sliderEl.swiper.autoplay) {
          sliderEl.swiper.autoplay.stop();
        }
        video.muted = false;
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
        if (slide) slide.classList.add('is-playing');
        if (btn) btn.setAttribute('aria-label', 'Pause video');
      } else {
        video.pause();
        if (slide) slide.classList.remove('is-playing');
        if (btn) btn.setAttribute('aria-label', 'Play video');
        var sliderEl2 = this.querySelector('[data-nw-tv-slider]');
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

    _bindVideoEvents() {
      if (this._videoBound) return;
      this._videoBound = true;

      this.addEventListener('click', (e) => {
        if (e.target.closest('[data-nw-tv-nav]') || e.target.closest('.nw-swiper-btn')) return;

        var slide = e.target.closest('.nw-testimonial-video__slide');
        if (!slide) return;

        var video = slide.querySelector('video');
        if (!video) return;

        var mediaInner = slide.querySelector('.nw-testimonial-video__media-inner');
        if (!mediaInner || !mediaInner.contains(e.target)) return;

        e.preventDefault();
        var btn = slide.querySelector('[data-nw-tv-video-toggle]');
        this._toggleVideoPlayback(slide, video, btn);
      });

      this.addEventListener('ended', (e) => {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        if (this._shouldLoopVideos() || e.target.loop) {
          return;
        }
        var slide = e.target.closest('.nw-testimonial-video__slide');
        if (slide) slide.classList.remove('is-playing');
        var sliderEl = this.querySelector('[data-nw-tv-slider]');
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
        var slide = e.target.closest('.nw-testimonial-video__slide');
        if (slide && e.target.paused) slide.classList.remove('is-playing');
      }, true);
    }

    _updateNavState(swiper) {
      if (!swiper) return;

      var atStart = swiper.isBeginning;
      var atEnd = swiper.isEnd;

      this.querySelectorAll('[data-nw-tv-nav] .nw-swiper-btn--prev').forEach(function (el) {
        el.classList.toggle('swiper-button-disabled', atStart);
        el.toggleAttribute('disabled', atStart);
      });
      this.querySelectorAll('[data-nw-tv-nav] .nw-swiper-btn--next').forEach(function (el) {
        el.classList.toggle('swiper-button-disabled', atEnd);
        el.toggleAttribute('disabled', atEnd);
      });
    }

    _bindNavClicks(swiper) {
      var prevButtons = this.querySelectorAll('[data-nw-tv-nav] .nw-swiper-btn--prev');
      var nextButtons = this.querySelectorAll('[data-nw-tv-nav] .nw-swiper-btn--next');
      if (!prevButtons.length || !nextButtons.length || !swiper) return;

      if (this._navHandlers) {
        prevButtons.forEach(function (el) {
          el.removeEventListener('click', this._navHandlers.prev);
        }, this);
        nextButtons.forEach(function (el) {
          el.removeEventListener('click', this._navHandlers.next);
        }, this);
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

      prevButtons.forEach(function (el) {
        el.addEventListener('click', self._navHandlers.prev);
      });
      nextButtons.forEach(function (el) {
        el.addEventListener('click', self._navHandlers.next);
      });

      this._updateNavState(swiper);

      var syncNav = function () {
        self._updateNavState(swiper);
      };

      swiper.on('slideChange', syncNav);
      swiper.on('slideChangeTransitionEnd', syncNav);
      swiper.on('resize', syncNav);
      swiper.on('reachBeginning', syncNav);
      swiper.on('reachEnd', syncNav);
    }

    _initSlider() {
      var sliderEl = this.querySelector('[data-nw-tv-slider]');
      if (!sliderEl || typeof Swiper === 'undefined') return;

      if (sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }

      var slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
      if (!slideCount) {
        slideCount = parseInt(this.dataset.slideCount, 10) || 0;
      }

      if (slideCount <= 1) {
        this._handleActiveSlideVideo();
        return;
      }

      var enableAutoplay = this._isSettingTrue(this.dataset.enableAutoplay);
      var autoplayDelay = this._getAutoplayDelay();
      var showArrows = this._isSettingTrue(this.dataset.showArrows);
      var transitionSpeed = this._getTransitionSpeed();

      var swiperOptions = {
        slidesPerView: 'auto',
        spaceBetween: 20,
        slidesOffsetAfter: this._getSlidesOffsetAfter(),
        speed: transitionSpeed,
        watchOverflow: true,
        grabCursor: true,
        allowTouchMove: true,
        loop: false,
        rewind: false,
        roundLengths: false,
        touchRatio: 1,
        threshold: 5,
        longSwipesRatio: 0.35,
        resistanceRatio: 0.85,
        observer: true,
        observeParents: true,
        observeSlideChildren: false,
        watchSlidesProgress: true,
        passiveListeners: true,
        breakpoints: {
          0: { spaceBetween: 12 },
          990: { spaceBetween: 20 }
        }
      };

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
        this._setSliderSliding(true);
        this._pauseAllVideos(false);
      });

      swiperInstance.on('slideChangeTransitionEnd', () => {
        this._setSliderSliding(false);
        this.querySelectorAll('.nw-testimonial-video__slide.is-playing').forEach(function (slide) {
          slide.classList.remove('is-playing');
        });
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
          self._updateNavState(swiperInstance);
        }
        self._syncVideoLoop();
        self._handleActiveSlideVideo();
      });
    }

    _onSectionLoad = (e) => {
      var section = this.closest('.shopify-section');
      if (!section || e.target !== section) return;
      this._videoBound = false;
      this._syncVideoLoop();
      this._whenSwiperReady(() => {
        this._initSlider();
        this._bindVideoEvents();
        this._handleActiveSlideVideo();
      });
    };

    _bindEditorEvents() {
      if (typeof Shopify === 'undefined' || !Shopify.designMode) return;
      document.addEventListener('shopify:section:load', this._onSectionLoad);
    }

    _unbindEditorEvents() {
      if (typeof Shopify === 'undefined' || !Shopify.designMode) return;
      document.removeEventListener('shopify:section:load', this._onSectionLoad);
    }
  }

  customElements.define('nw-testimonial-video', NwTestimonialVideo);
}
