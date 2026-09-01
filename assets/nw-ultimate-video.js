if (!customElements.get('nw-ultimate-video')) {
  class NwUltimateVideo extends HTMLElement {
    connectedCallback() {
      this._swiper = null;
      this._onResize = this._handleResize.bind(this);
      window.addEventListener('resize', this._onResize);
      window.nwWhenSwiperReady(() => this._initSwiper());
      this._bindVideoPlay();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      this._destroySwiper();
    }

    _handleResize() {
      if (!this._swiper) return;
      this._swiper.update();
      if (this._swiper.navigation) {
        this._swiper.navigation.update();
      }
    }

    _initSwiper() {
      var sliderEl = this.querySelector('.nw-ultimate-video__swiper');
      if (!sliderEl) return;

      this._destroySwiper();

      var showPagination = this.dataset.showPagination === 'true';
      var showArrows = this.dataset.showArrows === 'true';
      var paginationId = this.dataset.paginationId;
      var enableAutoplay = this.dataset.enableAutoplay === 'true';
      var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 4000;
      var prevBtn = this.querySelector('.nw-swiper-btn--prev');
      var nextBtn = this.querySelector('.nw-swiper-btn--next');
      var options = {
        slidesPerView: 'auto',
        spaceBetween: 10,
        centeredSlides: true,
        grabCursor: true,
        watchOverflow: true,
        speed: 500,
        breakpoints: {
          990: {
            spaceBetween: 20,
            slidesPerView: 'auto',
            centeredSlides: true
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

      if (showPagination && paginationId) {
        options.pagination = {
          el: '#' + paginationId,
          clickable: true
        };
      }

      if (enableAutoplay) {
        options.autoplay = {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        };
      }

      this._swiper = new Swiper(sliderEl, options);

      if (showArrows && this._swiper.navigation) {
        this._swiper.navigation.update();
      }
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
  }

  customElements.define('nw-ultimate-video', NwUltimateVideo);
}
