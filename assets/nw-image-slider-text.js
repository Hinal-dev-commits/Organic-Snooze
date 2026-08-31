if (!customElements.get('nw-image-slider-text')) {
  class NwImageSliderText extends HTMLElement {
    connectedCallback() {
      this.swiperInstance = null;
      this._initSwiper();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-image-slider-text__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
      this.swiperInstance = null;
    }

    _whenSwiperReady(callback) {
      if (typeof window.nwWhenSwiperReady === 'function') {
        window.nwWhenSwiperReady(callback);
      } else if (typeof Swiper !== 'undefined') {
        callback();
      }
    }

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-image-slider-text__swiper');
        if (!sliderEl) return;

        var slideCount = parseInt(this.dataset.slideCount, 10) || 0;
        if (slideCount <= 1) return;

        if (sliderEl.swiper) {
          sliderEl.swiper.destroy(true, true);
        }

        var showArrows = this.dataset.showArrows === 'true';
        var showPagination = this.dataset.showPagination === 'true';
        var paginationId = this.dataset.paginationId;

        var options = {
          slidesPerView: 1,
          spaceBetween: 0,
          speed: 500,
          loop: slideCount > 1,
          watchOverflow: true,
          grabCursor: true
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

        this.swiperInstance = new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-image-slider-text', NwImageSliderText);
}
