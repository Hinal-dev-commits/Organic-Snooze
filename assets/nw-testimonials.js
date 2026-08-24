if (!customElements.get('nw-testimonials')) {
  class NwTestimonials extends HTMLElement {
    connectedCallback() {
      this._initSwiper();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-testimonials__swiper');
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

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-testimonials__swiper');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var showArrows = this.dataset.showArrows === 'true';
        var showPagination = this.dataset.showPagination === 'true';
        var paginationId = this.dataset.paginationId;

        var options = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          centeredSlides: true,
          grabCursor: true,
          watchOverflow: true,
          breakpoints: {
            750: {
              centeredSlides: false,
              spaceBetween: 20
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

  customElements.define('nw-testimonials', NwTestimonials);
}
