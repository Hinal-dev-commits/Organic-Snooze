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

        var trackEl = this.querySelector('.nw-steps__track');

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
          },
          on: {
            setTranslate: (swiper, translate) => {
              if (trackEl && window.innerWidth < 750) {
                trackEl.style.transform = `translate3d(${translate}px, 0px, 0px)`;
              }
            },
            setTransition: (swiper, duration) => {
              if (trackEl && window.innerWidth < 750) {
                trackEl.style.transitionDuration = `${duration}ms`;
              }
            }
          }
        };

        this.swiperInstance = new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-steps', NwSteps);
}
