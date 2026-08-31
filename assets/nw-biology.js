if (!customElements.get('nw-biology')) {
  class NwBiology extends HTMLElement {
    connectedCallback() {
      this.swiperInstance = null;
      this.blockCount = parseInt(this.dataset.blockCount, 10) || 0;
      this._initSwiper();
      this._bindEditorEvents();
    }

    disconnectedCallback() {
      this._unbindEditorEvents();

      var sliderEl = this.querySelector('.nw-biology__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }

      this.swiperInstance = null;
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _updateSlidesOffset() {
      if (!this.swiperInstance) return;

      var sliderEl = this.swiperInstance.el;
      var slideEl = sliderEl.querySelector('.swiper-slide');
      if (!slideEl) return;

      var containerWidth = sliderEl.clientWidth;
      var slideWidth = slideEl.getBoundingClientRect().width;
      var offsetAfter = Math.max(0, Math.round(containerWidth - slideWidth));

      if (this.swiperInstance.params.slidesOffsetAfter === offsetAfter) return;

      var activeIndex = this.swiperInstance.activeIndex;

      this.swiperInstance.params.slidesOffsetAfter = offsetAfter;
      this.swiperInstance.update();
      this.swiperInstance.slideTo(activeIndex, 0);

      if (this.swiperInstance.navigation) {
        this.swiperInstance.navigation.update();
      }

      this._updatePagination();
    }

    _updatePagination() {
      if (!this.swiperInstance || this.blockCount <= 1) return;

      var paginationEl = this.querySelector('[data-nw-biology-pagination]');
      if (!paginationEl) return;

      var bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');
      var activeIndex = this.swiperInstance.activeIndex;

      bullets.forEach(function (bullet, index) {
        bullet.classList.toggle('swiper-pagination-bullet-active', index === activeIndex);
      });
    }

    _bindPagination() {
      if (!this.swiperInstance) return;

      var paginationEl = this.querySelector('[data-nw-biology-pagination]');
      if (!paginationEl) return;

      var self = this;

      paginationEl.querySelectorAll('.swiper-pagination-bullet').forEach(function (bullet, index) {
        if (bullet.dataset.nwBiologyPaginationBound === 'true') return;

        bullet.dataset.nwBiologyPaginationBound = 'true';

        bullet.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();

          if (self.swiperInstance) {
            self.swiperInstance.slideTo(index, 600);
          }
        });
      });

      this._updatePagination();
    }

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-biology__swiper');
        if (!sliderEl || this.blockCount <= 1) return;

        if (sliderEl.swiper) {
          sliderEl.swiper.destroy(true, true);
        }

        var showArrows = this.dataset.showArrows === 'true';
        var options = {
          slidesPerView: '1.1',
          slidesPerGroup: 1,
          spaceBetween: 12,
          speed: 600,
          grabCursor: true,
          watchOverflow: true,
          observer: true,
          observeParents: true,
          resizeObserver: true,
          roundLengths: true,
          breakpoints: {
            750: {
              slidesPerView: '1.05',
            },
            1024: {
              slidesPerView: '1.05',
            },
            1399: {
              slidesPerView: '1.95',
            }
          }
        };

        if (showArrows) {
          options.navigation = {
            nextEl: this.querySelector('.nw-biology__nav .nw-swiper-btn--next'),
            prevEl: this.querySelector('.nw-biology__nav .nw-swiper-btn--prev'),
            disabledClass: 'swiper-button-disabled'
          };
        }

        this.swiperInstance = new Swiper(sliderEl, options);
        this.swiperInstance.on('slideChange', () => this._updatePagination());
        this.swiperInstance.on('slideChangeTransitionEnd', () => this._updatePagination());
        this.swiperInstance.on('resize', () => this._updateSlidesOffset());
        this._updateSlidesOffset();
        this._bindPagination();

        if (showArrows && this.swiperInstance.navigation) {
          this.swiperInstance.navigation.update();
        }

        window.requestAnimationFrame(() => {
          if (!this.swiperInstance) return;
          this._updateSlidesOffset();
        });
      });
    }

    _onSectionSelect = () => {
      var sliderEl = this.querySelector('.nw-biology__swiper');
      if (!sliderEl || !sliderEl.swiper) return;

      sliderEl.swiper.update();
      this._updateSlidesOffset();

      if (this.dataset.showArrows === 'true' && sliderEl.swiper.navigation) {
        sliderEl.swiper.navigation.update();
      }

      this._updatePagination();
    };

    _onBlockSelect = (event) => {
      var sliderEl = this.querySelector('.nw-biology__swiper');
      if (!sliderEl || !sliderEl.swiper) return;

      var slideIndex = event.target && event.target.getAttribute('data-slide-index');
      if (slideIndex === null || slideIndex === undefined) return;

      var index = parseInt(slideIndex, 10);
      if (isNaN(index)) return;

      sliderEl.swiper.slideTo(index, 400);
      sliderEl.swiper.update();
      this._updateSlidesOffset();

      if (this.dataset.showArrows === 'true' && sliderEl.swiper.navigation) {
        sliderEl.swiper.navigation.update();
      }

      this._updatePagination();
    };

    _bindEditorEvents() {
      if (!Shopify || !Shopify.designMode) return;

      document.addEventListener('shopify:section:select', this._onSectionSelect);
      document.addEventListener('shopify:block:select', this._onBlockSelect);
    }

    _unbindEditorEvents() {
      document.removeEventListener('shopify:section:select', this._onSectionSelect);
      document.removeEventListener('shopify:block:select', this._onBlockSelect);
    }
  }

  customElements.define('nw-biology', NwBiology);
}
