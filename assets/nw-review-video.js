if (!customElements.get('nw-review-video')) {
  class NwReviewVideo extends HTMLElement {
    connectedCallback() {
      this._videoBound = false;
      this._initSlider();
      this._bindEditorEvents();
    }

    disconnectedCallback() {
      this._unbindEditorEvents();
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _whenSwiperReady(callback) {
      if (typeof Swiper !== 'undefined') {
        callback();
      } else {
        window.setTimeout(() => this._whenSwiperReady(callback), 50);
      }
    }

    _getBlockCount() {
      return parseInt(this.dataset.blockCount, 10) || 1;
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
        this._pauseOtherVideos(video);
        card.classList.add('is-playing');
        video.play();
      });

      this.addEventListener('pause', (e) => {
        if (e.target && e.target.tagName === 'VIDEO') {
          var card = e.target.closest('.nw-review-video__card');
          if (e.target.currentTime === 0 || e.target.ended) {
            if (card) card.classList.remove('is-playing');
          }
          var sliderEl = this.querySelector('[data-nw-review-slider]');
          if (sliderEl && sliderEl.swiper && sliderEl.swiper.autoplay) {
            sliderEl.swiper.autoplay.start();
          }
        }
      }, true);

      this.addEventListener('ended', (e) => {
        if (e.target && e.target.tagName === 'VIDEO') {
          var card = e.target.closest('.nw-review-video__card');
          if (card) card.classList.remove('is-playing');
          var sliderEl = this.querySelector('[data-nw-review-slider]');
          if (sliderEl && sliderEl.swiper && sliderEl.swiper.autoplay) {
            sliderEl.swiper.autoplay.start();
          }
        }
      }, true);
    }

    _updateCustomPagination(swiper) {
      var totalBlocks = this._getBlockCount();
      if (totalBlocks <= 1) return;
      var currentRealIndex = swiper.realIndex % totalBlocks;
      var bullets = this.querySelectorAll('[data-nw-review-pagination] .nw-review-video__bullet');
      bullets.forEach(function (bullet, idx) {
        bullet.classList.toggle('nw-review-video__bullet--active', idx === currentRealIndex);
      });
    }

    _runSlider() {
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (!sliderEl) return;
      if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

      var enableAutoplay = this.dataset.enableAutoplay === 'true';
      var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 3000;
      var showArrows = this.dataset.showArrows === 'true';

      var swiperOptions = {
        slidesPerView: 'auto',
        spaceBetween: 20,
        centeredSlides: true,
        loop: true,
        speed: 600,
        grabCursor: true,
        simulateTouch: true,
        allowTouchMove: true,
        watchSlidesProgress: true,
        breakpoints: {
          0: { slidesPerView: 'auto', spaceBetween: 12, centeredSlides: true },
          750: { slidesPerView: 'auto', spaceBetween: 16, centeredSlides: true },
          990: { slidesPerView: 'auto', spaceBetween: 20, centeredSlides: true }
        }
      };

      if (enableAutoplay) {
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
      });
      this._updateCustomPagination(swiperInstance);

      var paginationEl = this.querySelector('[data-nw-review-pagination]');
      if (paginationEl && !paginationEl._bound) {
        paginationEl._bound = true;
        paginationEl.addEventListener('click', (e) => {
          var bullet = e.target.closest('.nw-review-video__bullet');
          if (!bullet) return;
          var targetIndex = parseInt(bullet.getAttribute('data-bullet-index'), 10);
          if (!isNaN(targetIndex) && sliderEl.swiper) {
            sliderEl.swiper.slideToLoop(targetIndex, 600);
          }
        });
      }

      this._bindVideoEvents();
    }

    _initSlider() {
      this._whenSwiperReady(() => this._runSlider());
    }

    _onSectionSelect = () => {
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.update();
      }
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
      var sliderEl = this.querySelector('[data-nw-review-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.update();
      }
    };

    _bindEditorEvents() {
      if (!Shopify || !Shopify.designMode) return;
      document.addEventListener('shopify:section:select', this._onSectionSelect);
      document.addEventListener('shopify:block:select', this._onBlockSelect);
      document.addEventListener('shopify:block:deselect', this._onBlockDeselect);
    }

    _unbindEditorEvents() {
      document.removeEventListener('shopify:section:select', this._onSectionSelect);
      document.removeEventListener('shopify:block:select', this._onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this._onBlockDeselect);
    }
  }

  customElements.define('nw-review-video', NwReviewVideo);
}
