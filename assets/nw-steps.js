if (!customElements.get('nw-steps')) {
  class NwSteps extends HTMLElement {
    connectedCallback() {
      this._initSwiper();
    }

    disconnectedCallback() {
      if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      }
    }

    _initSwiper() {
      window.nwWhenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-steps__swiper');
        if (!sliderEl) return;

        if (this.swiperInstance) {
          this.swiperInstance.destroy(true, true);
          this.swiperInstance = null;
        }

        var paginationEl = this.querySelector('.nw-steps__pagination');

        var options = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          grabCursor: true,
          watchOverflow: true,
          pagination: paginationEl ? {
            el: paginationEl,
            clickable: true
          } : false,
          breakpoints: {
            750: {
              enabled: false
            }
          }
        };

        this.swiperInstance = new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-steps', NwSteps);
}
