if (!customElements.get('nw-organic-standards-v2')) {
  class NwOrganicStandardsV2 extends HTMLElement {
    connectedCallback() {
      this._initSwiper = this._initSwiper.bind(this);
      this._initSwiper();
    }

    disconnectedCallback() {
      this._destroySwiper();
    }

    _destroySwiper() {
      var sliderEl = this.querySelector('.nw-organic-standards-v2__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
        this._swiperInstance = null;
      }
    }

    _initSwiper() {
      var sliderEl = this.querySelector('.nw-organic-standards-v2__swiper');
      var paginationEl = this.querySelector('.nw-organic-standards-v2__pagination');
      if (!sliderEl) return;

      var self = this;
      var run = function () {
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        self._swiperInstance = new Swiper(sliderEl, {
          slidesPerView: 'auto',
          spaceBetween: 20,
          grabCursor: true,
          pagination: paginationEl
            ? {
                el: paginationEl,
                clickable: true,
                bulletClass: 'nw-swiper-bullet',
                bulletActiveClass: 'nw-swiper-bullet--active'
              }
            : false,
          breakpoints: {
            0: {
              spaceBetween: 12
            },
            750: {
              spaceBetween: 20
            }
          }
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

  customElements.define('nw-organic-standards-v2', NwOrganicStandardsV2);
}
