if (!customElements.get('nw-natural-layers-v2')) {
  class NwNaturalLayersV2 extends HTMLElement {
    connectedCallback() {
      this._initSwiper();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-natural-layers-v2__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _whenSwiperReady(callback) {
      if (typeof window.nwWhenSwiperReady === 'function') {
        window.nwWhenSwiperReady(callback);
      } else if (typeof Swiper !== 'undefined') {
        callback();
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (typeof window.nwWhenSwiperReady === 'function') {
            window.nwWhenSwiperReady(callback);
          } else if (typeof Swiper !== 'undefined') {
            callback();
          }
        });
      }
    }

    _initSwiper() {
      if (this.dataset.enableSlider !== 'true') return;

      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-natural-layers-v2__swiper');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var showArrows = this.dataset.showArrows === 'true';
        var showDots = this.dataset.showDots === 'true';
        var paginationEl = this.querySelector('.nw-swiper-pagination');

        var options = {
          slidesPerView: 'auto',
          spaceBetween: 20,
          grabCursor: true,
          watchOverflow: true,
          breakpoints: {
            0: {
              slidesPerView: 'auto',
              spaceBetween: 12
            },
            750: {
              slidesPerView: 'auto',
              spaceBetween: 16
            },
            990: {
              slidesPerView: 'auto',
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

        if (showDots && paginationEl) {
          options.pagination = {
            el: paginationEl,
            clickable: true
          };
        }

        new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-natural-layers-v2', NwNaturalLayersV2);
}
