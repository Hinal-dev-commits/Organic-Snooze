if (!customElements.get('nw-benefits')) {
  class NwBenefits extends HTMLElement {
    connectedCallback() {
      this._initSwiper();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-benefits__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-benefits__swiper');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var showArrows = this.dataset.showArrows === 'true';
        var showPagination = this.dataset.showPagination === 'true';
        var paginationId = this.dataset.paginationId;
        var isStyle2 = this.dataset.cardStyle === 'style_2';

        var options = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          centeredSlides: isStyle2,
          grabCursor: true,
          watchOverflow: true,
          breakpoints: {
            750: {
              spaceBetween: 12,
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

  customElements.define('nw-benefits', NwBenefits);
}
