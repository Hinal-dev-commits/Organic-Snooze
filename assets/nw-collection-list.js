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
      this.swiperInstance = null;
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _getSlideCount() {
      return parseInt(this.dataset.slideCount, 10) || 1;
    }

    _getSpaceBetween() {
      return window.innerWidth >= 750 ? 16 : 12;
    }

    _allSlidesFit(sliderEl) {
      var slideCount = this._getSlideCount();
      if (slideCount <= 1) return true;

      var sliderWidth = sliderEl.clientWidth;
      if (!sliderWidth) return false;

      var firstSlide = sliderEl.querySelector('.swiper-slide');
      if (!firstSlide) return true;

      var spaceBetween = this._getSpaceBetween();
      var slideWidth = firstSlide.getBoundingClientRect().width;
      var totalWidth = slideCount * slideWidth + (slideCount - 1) * spaceBetween;

      return totalWidth <= sliderWidth + 2;
    }

    _updateOverflowState(swiper) {
      var sliderEl = this.querySelector('[data-nw-collection-slider]');
      if (!sliderEl) return;

      var allFit = this._allSlidesFit(sliderEl);
      this.classList.toggle('nw-collection-list--all-visible', allFit);

      var paginationEl = this.querySelector('[data-nw-collection-pagination]');
      if (paginationEl) {
        paginationEl.hidden = allFit;
        paginationEl.setAttribute('aria-hidden', allFit ? 'true' : 'false');
      }

      var prevBtn = this.querySelector('.nw-swiper-btn--prev');
      var nextBtn = this.querySelector('.nw-swiper-btn--next');
      if (prevBtn) prevBtn.hidden = allFit;
      if (nextBtn) nextBtn.hidden = allFit;

      if (!swiper) return;

      swiper.allowTouchMove = !allFit;
      swiper.params.simulateTouch = !allFit;

      if (allFit) {
        if (swiper.autoplay && swiper.autoplay.running) {
          swiper.autoplay.stop();
        }

        if (swiper.params.loop) {
          swiper.slideToLoop(0, 0);
        } else {
          swiper.slideTo(0, 0);
        }
      } else if (
        window.nwAutoplayEnabled &&
        window.nwAutoplayEnabled(this.dataset.enableAutoplay === 'true') &&
        swiper.autoplay &&
        !swiper.autoplay.running
      ) {
        swiper.autoplay.start();
      }

      swiper.update();
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
        var noLoop = this.dataset.noLoop === 'true';
        var originalSlideCount = this._getSlideCount();
        var centerSlides = !noLoop;

        var swiperOptions = {
          slidesPerView: 'auto',
          spaceBetween: 16,
          centeredSlides: true,
          loop: !noLoop && slideCount > 1,
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
              centeredSlides: centerSlides
            }
          }
        };

        if (window.nwAutoplayEnabled(enableAutoplay)) {
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
        this.swiperInstance = swiperInstance;

        if (showDots && originalSlideCount > 1) {
          swiperInstance.on('slideChange', () => {
            this._updateCustomPagination(swiperInstance);
          });
          swiperInstance.on('init', () => {
            this._updateCustomPagination(swiperInstance);
          });
          this._updateCustomPagination(swiperInstance);
          this._bindCustomPagination(sliderEl);
        }

        var syncOverflowState = () => {
          this._updateOverflowState(swiperInstance);
        };

        swiperInstance.on('resize', syncOverflowState);
        swiperInstance.on('init', syncOverflowState);

        window.requestAnimationFrame(syncOverflowState);
        window.setTimeout(syncOverflowState, 150);
      });
    }
  }

  customElements.define('nw-collection-list', NwCollectionList);
}
