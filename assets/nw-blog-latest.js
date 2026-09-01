if (!customElements.get('nw-blog-latest')) {
  class NwBlogLatest extends HTMLElement {
    connectedCallback() {
      this._swiper = null;
      this._onResize = this._handleResize.bind(this);
      window.addEventListener('resize', this._onResize);
      window.nwWhenSwiperReady(() => this._initSwiper());
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

    _getSlidesDesktop() {
      var count = parseInt(this.dataset.slidesDesktop, 10);
      if (Number.isNaN(count) || count < 1) return 4;
      return Math.min(count, 4);
    }

    _initSwiper() {
      var sliderEl = this.querySelector('.nw-blog-latest__swiper');
      if (!sliderEl) return;

      this._destroySwiper();

      var showPagination = this.dataset.showPagination === 'true';
      var showArrows = this.dataset.showArrows === 'true';
      var paginationId = this.dataset.paginationId;
      var enableAutoplay = this.dataset.enableAutoplay === 'true';
      var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 4000;
      var slidesDesktop = this._getSlidesDesktop();
      var prevBtn = this.querySelector('.nw-swiper-btn--prev');
      var nextBtn = this.querySelector('.nw-swiper-btn--next');

      var options = {
        slidesPerView: '1.5',
        spaceBetween: 10,
        slidesOffsetAfter: 32,
        centeredSlides: false,
        grabCursor: true,
        watchOverflow: true,
        speed: 500,
        breakpoints: {
          990: {
            spaceBetween: 12,
            slidesPerView: '4',
            slidesPerView: slidesDesktop,
            slidesOffsetAfter: 0,
            centeredSlides: false
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
  }

  customElements.define('nw-blog-latest', NwBlogLatest);
}
