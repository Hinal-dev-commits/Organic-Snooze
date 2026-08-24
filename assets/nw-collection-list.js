if (!customElements.get('nw-collection-list')) {
  class NwCollectionList extends HTMLElement {
    connectedCallback() {
      this._initSlider();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('[data-nw-collection-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _initSlider() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('[data-nw-collection-slider]');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
        if (slideCount === 0) return;

        var enableAutoplay = this.dataset.enableAutoplay === 'true';
        var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 4000;
        var showArrows = this.dataset.showArrows === 'true';
        var showDots = this.dataset.showDots === 'true';

        var swiperOptions = {
          slidesPerView: 'auto',
          spaceBetween: 16,
          loop: slideCount > 1,
          loopedSlides: slideCount,
          grabCursor: true,
          observer: true,
          observeParents: true,
          observeSlideChildren: true,
          breakpoints: {
            0: {
              slidesPerView: 'auto',
              spaceBetween: 12,
              centeredSlides: true
            },
            750: {
              slidesPerView: 'auto',
              spaceBetween: 16,
              centeredSlides: true
            }
          }
        };

        if (enableAutoplay) {
          swiperOptions.autoplay = {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          };
        }

        if (showArrows) {
          swiperOptions.navigation = {
            nextEl: this.querySelector('.nw-swiper-btn--next'),
            prevEl: this.querySelector('.nw-swiper-btn--prev')
          };
        }

        if (showDots) {
          swiperOptions.pagination = {
            el: this.querySelector('[data-nw-collection-pagination]'),
            clickable: true
          };
        }

        new Swiper(sliderEl, swiperOptions);
      });
    }
  }

  customElements.define('nw-collection-list', NwCollectionList);
}
