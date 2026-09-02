if (!customElements.get('nw-featured-articles')) {
  class NwFeaturedArticles extends HTMLElement {
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
      if (Number.isNaN(count) || count < 1) return 3;
      return Math.min(count, 6);
    }

    _initSwiper() {
      var sliderEl = this.querySelector('.nw-featured-articles__swiper');
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
        slidesPerView: '1.2',
        spaceBetween: 10,
        centeredSlides: false,
        grabCursor: true,
        watchOverflow: true,
        speed: 500,
        breakpoints: {
          750: {
            spaceBetween: 16,
            slidesPerView: '2',
            centeredSlides: true,
          },
          990: {
            spaceBetween: 20,
            slidesPerView: '2',
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
  }

  customElements.define('nw-featured-articles', NwFeaturedArticles);
}
