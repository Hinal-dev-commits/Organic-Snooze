if (!customElements.get('nw-insights-slider')) {
  class NwInsightsSlider extends HTMLElement {
    connectedCallback() {
      this._initSlider();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('[data-nw-insights-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _initSlider() {
      if (typeof window.nwWhenSwiperReady !== 'function') return;

      window.nwWhenSwiperReady(() => {
        var sliderEl = this.querySelector('[data-nw-insights-slider]');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
        var enableAutoplay = this.dataset.enableAutoplay === 'true';
        var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 4000;
        var showDots = this.dataset.showDots === 'true';
        var showArrows = this.dataset.showArrows === 'true';

        var swiperOptions = {
          slidesPerView: 1,
          spaceBetween: 16,
          loop: slideCount > 1,
          speed: 500,
          grabCursor: true,
          autoHeight: true
        };

        if (window.nwAutoplayEnabled(enableAutoplay)) {
          swiperOptions.autoplay = {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          };
        }

        if (showDots) {
          swiperOptions.pagination = {
            el: this.querySelector('[data-nw-insights-pagination]'),
            clickable: true
          };
        }

        if (showArrows && slideCount > 1) {
          swiperOptions.navigation = {
            nextEl: this.querySelector('.nw-swiper-btn--next'),
            prevEl: this.querySelector('.nw-swiper-btn--prev')
          };
        }

        new Swiper(sliderEl, swiperOptions);
      });
    }
  }

  customElements.define('nw-insights-slider', NwInsightsSlider);
}
