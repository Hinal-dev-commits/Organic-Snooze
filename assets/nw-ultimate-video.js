if (!customElements.get('nw-ultimate-video')) {
  class NwUltimateVideo extends HTMLElement {
    connectedCallback() {
      this._swiper = null;
      this._onResize = this._handleResize.bind(this);
      window.addEventListener('resize', this._onResize);
      window.nwWhenSwiperReady(() => this._initSwiper());
      this._bindEditorEvents();
      this._bindVideoPlay();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      this._unbindEditorEvents();
      this._destroySwiper();
    }

    _getBlockCount() {
      return parseInt(this.dataset.blockCount, 10) || 0;
    }


    _getOriginalIndex(swiper) {
      var activeSlide = swiper.slides && swiper.slides[swiper.activeIndex];
      if (activeSlide && activeSlide.dataset.slideIndex !== undefined) {
        return parseInt(activeSlide.dataset.slideIndex, 10) || 0;
      }

      return swiper.activeIndex;
    }

    _updateCustomPagination(swiper) {
      var totalBlocks = this._getBlockCount();
      if (totalBlocks <= 1) return;

      var currentIndex = this._getOriginalIndex(swiper);
      var bullets = this.querySelectorAll('[data-nw-ultimate-video-pagination] .swiper-pagination-bullet');
      bullets.forEach(function (bullet, idx) {
        bullet.classList.toggle('swiper-pagination-bullet-active', idx === currentIndex);
      });
    }

    _bindCustomPagination() {
      var paginationEl = this.querySelector('[data-nw-ultimate-video-pagination]');
      if (!paginationEl || paginationEl._bound) return;

      paginationEl._bound = true;
      paginationEl.addEventListener('click', (e) => {
        var bullet = e.target.closest('.swiper-pagination-bullet');
        if (!bullet || !this._swiper) return;

        var targetIndex = parseInt(bullet.getAttribute('data-bullet-index'), 10);
        if (Number.isNaN(targetIndex)) return;

        this._swiper.slideTo(targetIndex, 500);
      });
    }

    _handleResize() {
      if (!this._swiper) return;
      this._swiper.update();
      if (this._swiper.navigation) {
        this._swiper.navigation.update();
      }
      this._updateCustomPagination(this._swiper);
    }

    _initSwiper() {
      var sliderEl = this.querySelector('.nw-ultimate-video__swiper');
      if (!sliderEl) return;

      this._destroySwiper();

      var showPagination = this.dataset.showPagination === 'true';
      var showArrows = this.dataset.showArrows === 'true';
      var enableAutoplay = this.dataset.enableAutoplay === 'true';
      var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 4000;
      var blockCount = this._getBlockCount();
      var prevBtn = this.querySelector('.nw-swiper-btn--prev');
      var nextBtn = this.querySelector('.nw-swiper-btn--next');

      var options = {
        slidesPerView: 1,
        spaceBetween: 10,
        speed: 500,
        watchOverflow: true,
        grabCursor: blockCount > 1,
        simulateTouch: blockCount > 1,
        allowTouchMove: blockCount > 1,
        watchSlidesProgress: true,
        breakpoints: {
          640: {
            slidesPerView: 2,
            spaceBetween: 20
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20
          }
        }
      };

      if (showArrows && prevBtn && nextBtn) {
        options.navigation = {
          prevEl: prevBtn,
          nextEl: nextBtn,
          disabledClass: 'swiper-button-disabled'
        };
      }

      if (window.nwAutoplayEnabled(enableAutoplay) && blockCount > 1) {
        options.autoplay = {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          stopOnLastSlide: true
        };
      }

      this._swiper = new Swiper(sliderEl, options);

      this._swiper.slideTo(0, 0);

      if (showPagination) {
        this._swiper.on('slideChange', () => {
          this._updateCustomPagination(this._swiper);
        });
        this._swiper.on('init', () => {
          this._updateCustomPagination(this._swiper);
        });
        this._bindCustomPagination();
        this._updateCustomPagination(this._swiper);
      }

      if (showArrows && this._swiper.navigation) {
        this._swiper.navigation.update();
      }

      requestAnimationFrame(() => {
        if (!this._swiper) return;
        this._swiper.update();
        if (this._swiper.navigation) {
          this._swiper.navigation.update();
        }
        if (showPagination) {
          this._updateCustomPagination(this._swiper);
        }
      });
    }

    _destroySwiper() {
      if (!this._swiper) return;
      this._swiper.destroy(true, true);
      this._swiper = null;
    }

    _setVideoControlState(card, isPlaying) {
      if (!card) return;
      card.classList.toggle('is-playing', isPlaying);
      var btn = card.querySelector('[data-uv-video-play]');
      if (btn) {
        btn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
      }
    }

    _pauseOtherVideos(currentVideo) {
      var self = this;
      this.querySelectorAll('video').forEach(function (video) {
        if (video === currentVideo) return;
        video.pause();
        self._setVideoControlState(video.closest('.nw-ultimate-video__card'), false);
      });
    }

    _bindVideoPlay() {
      var self = this;

      this.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-uv-video-play]');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        var card = btn.closest('.nw-ultimate-video__card');
        if (!card) return;

        var video = card.querySelector('video');
        if (!video) return;

        if (!video.paused && !video.ended) {
          video.pause();
          self._setVideoControlState(card, false);
          return;
        }

        self._pauseOtherVideos(video);
        video.play();
        self._setVideoControlState(card, true);
      });

      this.addEventListener('play', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('.nw-ultimate-video__card'), true);
      }, true);

      this.addEventListener('ended', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('.nw-ultimate-video__card'), false);
      }, true);

      this.addEventListener('pause', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('.nw-ultimate-video__card'), false);
      }, true);
    }

    _onSectionLoad = (e) => {
      var section = this.closest('.shopify-section');
      if (!section || e.target !== section) return;
      window.nwWhenSwiperReady(() => this._initSwiper());
    };

    _bindEditorEvents() {
      if (!Shopify || !Shopify.designMode) return;
      document.addEventListener('shopify:section:load', this._onSectionLoad);
    }

    _unbindEditorEvents() {
      document.removeEventListener('shopify:section:load', this._onSectionLoad);
    }
  }

  customElements.define('nw-ultimate-video', NwUltimateVideo);
}
