if (!customElements.get('nw-review-video')) {
  class NwReviewVideo extends HTMLElement {
    connectedCallback() {
      this._videoBound = false;
      this._onResize = this._handleResize.bind(this);
      window.addEventListener('resize', this._onResize);
      this._syncVideoLoop();
      this._initSlider();
      this._bindEditorEvents();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      this._unbindEditorEvents();
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _getBlockCount() {
      return parseInt(this.dataset.blockCount, 10) || 1;
    }

    _shouldLoopVideos() {
      return this.dataset.enableVideoLoop === 'true';
    }

    _syncVideoLoop() {
      var shouldLoop = this._shouldLoopVideos();
      this.querySelectorAll('video').forEach(function (video) {
        video.loop = shouldLoop;
      });
    }

    _sliderNeedsNavigation(swiper) {
      if (!swiper || !swiper.wrapperEl || !swiper.el) return false;
      return swiper.wrapperEl.scrollWidth > swiper.el.clientWidth + 1;
    }

    _updateStaticSliderState(swiper) {
      var wrap = this.querySelector('.nw-review-video__slider-wrap');
      if (!wrap || !swiper) return;

      var enableLoop = this._shouldLoopVideos();
      var needsNav = this._sliderNeedsNavigation(swiper);
      var isStatic = !enableLoop && !needsNav;

      wrap.classList.toggle('nw-review-video__slider-wrap--static', isStatic);

      swiper.allowTouchMove = !isStatic;
      swiper.params.simulateTouch = !isStatic;

      if (isStatic) {
        swiper.slideTo(0, 0);
        swiper.wrapperEl.style.transform = 'translate3d(0px, 0, 0)';
      }

      if (swiper.navigation && swiper.navigation.update) {
        swiper.navigation.update();
      }
    }

    _handleResize() {
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (!sliderEl || !sliderEl.swiper) return;
      sliderEl.swiper.update();
      this._updateStaticSliderState(sliderEl.swiper);
    }

    _pauseOtherVideos(currentVideo) {
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (sliderEl && sliderEl.swiper && sliderEl.swiper.autoplay && sliderEl.swiper.autoplay.running) {
        sliderEl.swiper.autoplay.stop();
      }
      this.querySelectorAll('video').forEach(function (video) {
        if (video !== currentVideo) {
          video.pause();
          var card = video.closest('.nw-review-video__card');
          if (card) card.classList.remove('is-playing');
        }
      });
    }

    _bindVideoEvents() {
      if (this._videoBound) return;
      this._videoBound = true;

      this.addEventListener('click', (e) => {
        var btn = e.target.closest('.nw-review-video__play');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        var card = btn.closest('.nw-review-video__card');
        if (!card) return;
        var video = card.querySelector('video');
        if (!video) return;
        this._syncVideoLoop();
        this._pauseOtherVideos(video);
        card.classList.add('is-playing');
        video.play();
      });

      this.addEventListener('pause', (e) => {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        if (e.target.loop) return;

        var card = e.target.closest('.nw-review-video__card');
        if (e.target.currentTime === 0 || e.target.ended) {
          if (card) card.classList.remove('is-playing');
        }

        var sliderEl = this.querySelector('[data-nw-review-slider]');
        if (sliderEl && sliderEl.swiper && sliderEl.swiper.autoplay) {
          sliderEl.swiper.autoplay.start();
        }
      }, true);

      this.addEventListener('ended', (e) => {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        if (e.target.loop) {
          e.target.play();
          return;
        }

        var card = e.target.closest('.nw-review-video__card');
        if (card) card.classList.remove('is-playing');

        var sliderEl = this.querySelector('[data-nw-review-slider]');
        if (sliderEl && sliderEl.swiper && sliderEl.swiper.autoplay) {
          sliderEl.swiper.autoplay.start();
        }
      }, true);
    }

    _updateCustomPagination(swiper) {
      if (!this._shouldLoopVideos()) return;

      var totalBlocks = this._getBlockCount();
      if (totalBlocks <= 1) return;
      var currentRealIndex = swiper.realIndex % totalBlocks;
      var bullets = this.querySelectorAll('[data-nw-review-pagination] .swiper-pagination-bullet');
      bullets.forEach(function (bullet, idx) {
        bullet.classList.toggle('swiper-pagination-bullet-active', idx === currentRealIndex);
      });
    }

    _runSlider() {
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (!sliderEl) return;
      if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

      var enableAutoplay = this.dataset.enableAutoplay === 'true';
      var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 3000;
      var showArrows = this.dataset.showArrows === 'true';
      var enableLoop = this._shouldLoopVideos();
      var centeredSlides = enableLoop;

      var swiperOptions = {
        slidesPerView: 'auto',
        spaceBetween: 20,
        centeredSlides: centeredSlides,
        loop: enableLoop,
        watchOverflow: true,
        speed: 600,
        grabCursor: enableLoop,
        simulateTouch: enableLoop,
        allowTouchMove: enableLoop,
        watchSlidesProgress: true,
        breakpoints: {
          0: { slidesPerView: 'auto', spaceBetween: 12, centeredSlides: centeredSlides },
          750: { slidesPerView: 'auto', spaceBetween: 16, centeredSlides: centeredSlides },
          990: { slidesPerView: 'auto', spaceBetween: 20, centeredSlides: centeredSlides }
        }
      };

      if (enableAutoplay && enableLoop) {
        swiperOptions.autoplay = {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        };
      }

      if (showArrows) {
        swiperOptions.navigation = {
          nextEl: this.querySelector('.nw-swiper-btn--next'),
          prevEl: this.querySelector('.nw-swiper-btn--prev')
        };
      }

      var swiperInstance = new Swiper(sliderEl, swiperOptions);

      swiperInstance.on('slideChange', () => {
        this._updateCustomPagination(swiperInstance);
      });
      swiperInstance.on('init', () => {
        this._updateCustomPagination(swiperInstance);
        this._updateStaticSliderState(swiperInstance);
      });
      swiperInstance.on('resize', () => {
        this._updateStaticSliderState(swiperInstance);
      });
      this._updateCustomPagination(swiperInstance);
      this._updateStaticSliderState(swiperInstance);

      var paginationEl = this.querySelector('[data-nw-review-pagination]');
      if (paginationEl && !paginationEl._bound) {
        paginationEl._bound = true;
        paginationEl.addEventListener('click', (e) => {
          var bullet = e.target.closest('.swiper-pagination-bullet');
          if (!bullet) return;
          var targetIndex = parseInt(bullet.getAttribute('data-bullet-index'), 10);
          if (!isNaN(targetIndex) && sliderEl.swiper) {
            if (sliderEl.swiper.params.loop) {
              sliderEl.swiper.slideToLoop(targetIndex, 600);
            } else {
              sliderEl.swiper.slideTo(targetIndex, 600);
            }
          }
        });
      }

      this._syncVideoLoop();
      this._bindVideoEvents();
    }

    _initSlider() {
      this._whenSwiperReady(() => this._runSlider());
    }

    _onSectionSelect = () => {
      this._handleResize();
    };

    _onSectionLoad = (e) => {
      var section = this.closest('.shopify-section');
      if (!section || e.target !== section) return;
      this._videoBound = false;
      this._syncVideoLoop();
      this._whenSwiperReady(() => this._runSlider());
    };

    _onBlockSelect = (e) => {
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (!sliderEl || !sliderEl.swiper) return;
      var slideIndex = e.target.getAttribute('data-slide-index');
      if (slideIndex === null || slideIndex === undefined) return;
      var index = parseInt(slideIndex, 10);
      if (sliderEl.swiper.params.loop) {
        sliderEl.swiper.slideToLoop(index, 400);
      } else {
        sliderEl.swiper.slideTo(index, 400);
      }
      sliderEl.swiper.update();
    };

    _onBlockDeselect = () => {
      this._handleResize();
    };

    _bindEditorEvents() {
      if (!Shopify || !Shopify.designMode) return;
      document.addEventListener('shopify:section:select', this._onSectionSelect);
      document.addEventListener('shopify:section:load', this._onSectionLoad);
      document.addEventListener('shopify:block:select', this._onBlockSelect);
      document.addEventListener('shopify:block:deselect', this._onBlockDeselect);
    }

    _unbindEditorEvents() {
      document.removeEventListener('shopify:section:select', this._onSectionSelect);
      document.removeEventListener('shopify:section:load', this._onSectionLoad);
      document.removeEventListener('shopify:block:select', this._onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this._onBlockDeselect);
    }
  }

  customElements.define('nw-review-video', NwReviewVideo);
}
