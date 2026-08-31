if (!customElements.get('nw-build-process')) {
  class NwBuildProcess extends HTMLElement {
    connectedCallback() {
      this._handleResize = this._checkAndInitSwiper.bind(this);
      window.addEventListener('resize', this._handleResize);
      this._checkAndInitSwiper();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._handleResize);
      this._destroySwiper();
    }

    _destroySwiper() {
      if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      }

      var wrapper = this.querySelector('.nw-build-process__grid');
      if (wrapper) {
        wrapper.removeAttribute('style');
      }

      var slides = this.querySelectorAll('.nw-build-process__card');
      slides.forEach(function (slide) {
        slide.removeAttribute('style');
      });
    }

    _checkAndInitSwiper() {
      var sliderEl = this.querySelector('.nw-build-process__swiper');
      if (!sliderEl) return;

      if (window.innerWidth >= 750) {
        this._destroySwiper();
        return;
      }

      if (this.swiperInstance) {
        this.swiperInstance.update();
        return;
      }

      window.nwWhenSwiperReady(() => {
        if (window.innerWidth >= 750) return;

        var paginationEl = this.querySelector('.nw-build-process__pagination');
        var options = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          slidesOffsetBefore: 16,
          slidesOffsetAfter: 16,
          grabCursor: true,
          watchOverflow: true
        };

        if (paginationEl) {
          options.pagination = {
            el: paginationEl,
            clickable: true
          };
        }

        this.swiperInstance = new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-build-process', NwBuildProcess);
}
