if (!customElements.get('nw-breezeline-collection')) {
  class NwBreezelineCollection extends HTMLElement {
    connectedCallback() {
      this._initSwiper();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-breezeline-collection__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-breezeline-collection__swiper');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var showPagination = this.dataset.showPagination === 'true';
        var showArrows = this.dataset.showArrows === 'true';
        var paginationId = this.dataset.paginationId;

        var options = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          centeredSlides: true,
          grabCursor: true,
          watchOverflow: true,
          breakpoints: {
            750: {
              slidesPerView: 3,
              spaceBetween: 24,
              centeredSlides: false
            }
          }
        };

        if (showArrows) {
          options.navigation = {
            nextEl: this.querySelector('.nw-swiper-btn--next'),
            prevEl: this.querySelector('.nw-swiper-btn--prev')
          };
        }

        if (showPagination && paginationId) {
          options.pagination = {
            el: '#' + paginationId,
            clickable: true
          };
        }

        new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-breezeline-collection', NwBreezelineCollection);
}
