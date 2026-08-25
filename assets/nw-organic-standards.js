if (!customElements.get('nw-organic-standards')) {
  class NwOrganicStandards extends HTMLElement {
    connectedCallback() {
      this._initSwiper = this._initSwiper.bind(this);
      this._handleResize = this._handleResize.bind(this);
      this._initSwiper();
      window.addEventListener('resize', this._handleResize);
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._handleResize);
      this._destroySwiper();
    }

    _destroySwiper() {
      var sliderEl = this.querySelector('.nw-organic-standards__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
        this._swiperInstance = null;
      }
    }

    _handleResize() {
      if (window.innerWidth < 750) {
        if (!this._swiperInstance) {
          this._initSwiper();
        }
      } else {
        if (this._swiperInstance) {
          this._destroySwiper();
        }
      }
    }

    _initSwiper() {
      if (window.innerWidth >= 750) return;
      var sliderEl = this.querySelector('.nw-organic-standards__swiper');
      if (!sliderEl) return;

      var self = this;
      var run = function () {
        if (window.innerWidth >= 750) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        self._swiperInstance = new Swiper(sliderEl, {
          slidesPerView: 'auto',
          spaceBetween: 12,
          grabCursor: true,
          freeMode: false,
          watchOverflow: true
        });
      };

      if (typeof window.nwWhenSwiperReady === 'function') {
        window.nwWhenSwiperReady(run);
      } else if (typeof Swiper !== 'undefined') {
        run();
      } else {
        var tries = 0;
        var interval = setInterval(function () {
          tries++;
          if (typeof Swiper !== 'undefined' || typeof window.nwWhenSwiperReady === 'function' || tries > 40) {
            clearInterval(interval);
            if (typeof window.nwWhenSwiperReady === 'function') {
              window.nwWhenSwiperReady(run);
            } else if (typeof Swiper !== 'undefined') {
              run();
            }
          }
        }, 50);
      }
    }
  }

  customElements.define('nw-organic-standards', NwOrganicStandards);
}
