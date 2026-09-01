if (!customElements.get('nw-follow')) {
  class NwFollow extends HTMLElement {
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

    _shouldLoop() {
      return this.dataset.enableLoop === 'true';
    }

    _getOriginalIndex(swiper) {
      var totalBlocks = this._getBlockCount();
      if (totalBlocks <= 0) return 0;
      return swiper.activeIndex % totalBlocks;
    }

    _updateCustomPagination(swiper) {
      var totalBlocks = this._getBlockCount();
      if (totalBlocks <= 1) return;

      var currentIndex = this._getOriginalIndex(swiper);
      var bullets = this.querySelectorAll('[data-nw-follow-pagination] .swiper-pagination-bullet');
      bullets.forEach(function (bullet, idx) {
        bullet.classList.toggle('swiper-pagination-bullet-active', idx === currentIndex);
      });
    }

    _bindCustomPagination() {
      var paginationEl = this.querySelector('[data-nw-follow-pagination]');
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
      var sliderEl = this.querySelector('.nw-follow__swiper');
      if (!sliderEl) return;

      this._destroySwiper();

      var showArrows = this.dataset.showArrows === 'true';
      var enableAutoplay = this.dataset.enableAutoplay === 'true';
      var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 4000;
      var enableLoop = this._shouldLoop();
      var blockCount = this._getBlockCount();
      var canLoop = enableLoop && blockCount > 1;

      var options = {
        slidesPerView: 'auto',
        spaceBetween: 20,
        centeredSlides: true,
        loop: true,
        watchOverflow: true,
        speed: 500,
        grabCursor: blockCount > 1,
        simulateTouch: blockCount > 1,
        allowTouchMove: blockCount > 1,
        watchSlidesProgress: true,
        breakpoints: {
          0: {
            slidesPerView: 'auto',
            spaceBetween: 20,
            centeredSlides: true
          },
          750: {
            slidesPerView: 'auto',
            spaceBetween: 20,
            centeredSlides: true
          },
          990: {
            slidesPerView: '6',
            spaceBetween: 20,
            centeredSlides: true
          }
        }
      };

      if (showArrows) {
        options.navigation = {
          nextEl: this.querySelector('.nw-swiper-btn--next'),
          prevEl: this.querySelector('.nw-swiper-btn--prev'),
          disabledClass: 'swiper-button-disabled'
        };
      }

      if (enableAutoplay && blockCount > 1) {
        options.autoplay = {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          stopOnLastSlide: !canLoop
        };
      }

      this._swiper = new Swiper(sliderEl, options);

      this._swiper.on('slideChange', () => {
        this._updateCustomPagination(this._swiper);
      });
      this._swiper.on('init', () => {
        this._updateCustomPagination(this._swiper);
      });

      if (this._swiper.navigation) {
        this._swiper.navigation.update();
      }

      this._bindCustomPagination();
      this._updateCustomPagination(this._swiper);

      requestAnimationFrame(() => {
        if (!this._swiper) return;
        this._swiper.update();
        if (this._swiper.navigation) {
          this._swiper.navigation.update();
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
      var btn = card.querySelector('[data-nw-follow-video-play]');
      if (btn) {
        btn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
      }
    }

    _pauseOtherVideos(currentVideo) {
      var self = this;
      this.querySelectorAll('video').forEach(function (video) {
        if (video === currentVideo) return;
        video.pause();
        self._setVideoControlState(video.closest('.nw-follow__card'), false);
      });
    }

    _bindVideoPlay() {
      var self = this;

      this.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-nw-follow-video-play]');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        var card = btn.closest('.nw-follow__card');
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
        self._setVideoControlState(e.target.closest('.nw-follow__card'), true);
      }, true);

      this.addEventListener('ended', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('.nw-follow__card'), false);
      }, true);

      this.addEventListener('pause', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('.nw-follow__card'), false);
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

  customElements.define('nw-follow', NwFollow);
}
