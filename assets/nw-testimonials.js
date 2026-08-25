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
      window.nwWhenSwiperReady(callback);
    }

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-testimonials__swiper');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var showArrows = this.dataset.showArrows === 'true';
        var showPagination = this.dataset.showPagination === 'true';
        var isFullWidth = this.dataset.fullWidth === 'true';
        var enableLoop = this.dataset.loop === 'true';

        var prevBtn = this.querySelector('.nw-swiper-btn--prev');
        var nextBtn = this.querySelector('.nw-swiper-btn--next');
        var paginationEl = this.querySelector('.nw-swiper-pagination');

        var options = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          centeredSlides: isFullWidth,
          grabCursor: true,
          simulateTouch: true,
          allowTouchMove: true,
          watchOverflow: false,
          observer: true,
          observeParents: true,
          resizeObserver: true,
          loop: enableLoop,
          loopPreventsSliding: false,
          breakpoints: {
            750: {
              centeredSlides: isFullWidth,
              spaceBetween: 20
            }
          }
        };

        if (showArrows && prevBtn && nextBtn) {
          options.navigation = {
            prevEl: prevBtn,
            nextEl: nextBtn
          };
        }

        if (showPagination && paginationEl) {
          options.pagination = {
            el: paginationEl,
            clickable: true
          };
        }

        new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-testimonials', NwTestimonials);
}
