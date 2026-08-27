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

    _getSlideCount() {
      return parseInt(this.dataset.slideCount, 10) || 1;
    }

    _updateCustomPagination(swiper) {
      var totalSlides = this._getSlideCount();
      if (totalSlides <= 1) return;

      var currentRealIndex = swiper.realIndex % totalSlides;
      var bullets = this.querySelectorAll('[data-nw-collection-pagination] .swiper-pagination-bullet');
      bullets.forEach(function (bullet, idx) {
        bullet.classList.toggle('swiper-pagination-bullet-active', idx === currentRealIndex);
      });
    }

    _bindCustomPagination(sliderEl) {
      var paginationEl = this.querySelector('[data-nw-collection-pagination]');
      if (!paginationEl || paginationEl._bound) return;

      paginationEl._bound = true;
      paginationEl.addEventListener('click', (e) => {
        var bullet = e.target.closest('.swiper-pagination-bullet');
        if (!bullet || !sliderEl.swiper) return;

        var targetIndex = parseInt(bullet.getAttribute('data-bullet-index'), 10);
        if (isNaN(targetIndex)) return;

        if (sliderEl.swiper.params.loop) {
          sliderEl.swiper.slideToLoop(targetIndex, 600);
        } else {
          sliderEl.swiper.slideTo(targetIndex, 600);
        }
      });
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
          centeredSlides: true,
          loop: slideCount > 1,
          speed: 600,
          grabCursor: true,
          simulateTouch: true,
          allowTouchMove: true,
          watchSlidesProgress: true,
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

        var swiperInstance = new Swiper(sliderEl, swiperOptions);

        if (showDots && this._getSlideCount() > 1) {
          swiperInstance.on('slideChange', () => {
            this._updateCustomPagination(swiperInstance);
          });
          swiperInstance.on('init', () => {
            this._updateCustomPagination(swiperInstance);
          });
          this._updateCustomPagination(swiperInstance);
          this._bindCustomPagination(sliderEl);
        }
      });
    }
  }

  customElements.define('nw-collection-list', NwCollectionList);
}
