if (!customElements.get('nw-steps')) {
  class NwSteps extends HTMLElement {
    connectedCallback() {
      this._handleResize = this._checkAndInitSwiper.bind(this);
      window.addEventListener('resize', this._handleResize);
      this._checkAndInitSwiper();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._handleResize);
      if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      }
    }

    _checkAndInitSwiper() {
      var trackEl = this.querySelector('.nw-steps__track');
      var sliderEl = this.querySelector('.nw-steps__swiper');
      if (!sliderEl) return;

      if (window.innerWidth >= 750) {
        if (this.swiperInstance) {
          this.swiperInstance.destroy(true, true);
          this.swiperInstance = null;
        }
        if (trackEl) {
          trackEl.style.transform = '';
          trackEl.style.transitionDuration = '';
        }
        return;
      }

      if (this.swiperInstance) return;

      window.nwWhenSwiperReady(() => {
        if (window.innerWidth >= 750) return;
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
