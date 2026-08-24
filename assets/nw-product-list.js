if (!customElements.get('nw-product-list')) {
  class NwProductList extends HTMLElement {
    connectedCallback() {
      this.swiperInstance = null;
      this.originalCount = 0;
      var sliderEl = this.querySelector('.nw-product-list__swiper');
      if (sliderEl) {
        this.originalCount = sliderEl.querySelectorAll('.swiper-wrapper > .swiper-slide:not([data-nw-pl-clone])').length;
      }
      this._initSwiper();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-product-list__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
      this.swiperInstance = null;
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _getRealSlideIndex(activeIndex) {
      return ((activeIndex % this.originalCount) + this.originalCount) % this.originalCount;
    }

    _updateCustomPagination() {
      if (!this.swiperInstance || this.originalCount <= 1) return;

      var paginationEl = this.querySelector('[data-nw-pl-pagination]');
      if (!paginationEl) return;

      var bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');
      if (!bullets.length) return;

      var currentIndex = this._getRealSlideIndex(this.swiperInstance.activeIndex);

      bullets.forEach(function (bullet, index) {
        bullet.classList.toggle('swiper-pagination-bullet-active', index === currentIndex);
      });
    }

    _bindPagination() {
      if (!this.swiperInstance) return;

      var paginationEl = this.querySelector('[data-nw-pl-pagination]');
      if (!paginationEl) return;

      var bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');

      bullets.forEach((bullet, index) => {
        if (bullet.dataset.nwPlPaginationBound === 'true') return;

        bullet.dataset.nwPlPaginationBound = 'true';

        bullet.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!this.swiperInstance) return;

          var sliderEl = this.querySelector('.nw-product-list__swiper');
          var meta = sliderEl ? this._getSlideMeta(sliderEl) : { startIndex: 0 };

          this.swiperInstance.slideTo(meta.startIndex + index, 600);
        });
      });

      this._updateCustomPagination();
    }

    _cloneSlide(slide) {
      var clone = slide.cloneNode(true);

      clone.removeAttribute('data-shopify-editor-block');
      clone.removeAttribute('data-shopify-editor-block-index');
      clone.removeAttribute('data-slide-index');
      clone.setAttribute('data-nw-pl-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');

      return clone;
    }

    _removeClones(wrapper) {
      wrapper
        .querySelectorAll(':scope > .swiper-slide[data-nw-pl-clone]')
        .forEach(function (slide) {
          slide.remove();
        });
    }

    _getSlideMeta(sliderEl) {
      return {
        startIndex: parseInt(sliderEl.dataset.nwPlStartIndex, 10) || 0,
        copyCount: parseInt(sliderEl.dataset.nwPlCopyCount, 10) || this.originalCount,
        middleEnd: parseInt(sliderEl.dataset.nwPlMiddleEnd, 10) || this.originalCount
      };
    }

    _ensureEnoughSlides(sliderEl) {
      var wrapper = sliderEl.querySelector('.swiper-wrapper');
      if (!wrapper) {
        return { startIndex: 0, copyCount: this.originalCount, middleEnd: this.originalCount };
      }

      this._removeClones(wrapper);

      var originalSlides = Array.from(
        wrapper.querySelectorAll(':scope > .swiper-slide:not([data-nw-pl-clone])')
      );

      var count = originalSlides.length;

      if (count <= 1) {
        sliderEl.dataset.nwPlStartIndex = '0';
        sliderEl.dataset.nwPlCopyCount = String(count);
        sliderEl.dataset.nwPlMiddleEnd = String(count);
        return { startIndex: 0, copyCount: count, middleEnd: count };
      }

      var sliderWidth = sliderEl.clientWidth;
      var slideWidth = originalSlides[0].getBoundingClientRect().width;

      if (!sliderWidth || !slideWidth || slideWidth <= 0) {
        sliderEl.dataset.nwPlStartIndex = String(count);
        sliderEl.dataset.nwPlCopyCount = String(count);
        sliderEl.dataset.nwPlMiddleEnd = String(count * 2);
        return { startIndex: count, copyCount: count, middleEnd: count * 2 };
      }

      var spaceBetween = window.innerWidth >= 750 ? 20 : 12;
      var visibleSlides = Math.ceil(sliderWidth / (slideWidth + spaceBetween));
      var setsNeeded = Math.max(
        3,
        Math.ceil((visibleSlides * 2 + count) / count) + 1
      );

      var extraSets = setsNeeded - 1;
      var prependSets = Math.ceil(extraSets / 2);
      var appendSets = extraSets - prependSets;
      var p;
      var a;
      var fragment;

      for (p = 0; p < prependSets; p++) {
        fragment = document.createDocumentFragment();

        originalSlides.forEach((slide) => {
          fragment.appendChild(this._cloneSlide(slide));
        });

        wrapper.insertBefore(fragment, wrapper.firstChild);
      }

      for (a = 0; a < appendSets; a++) {
        originalSlides.forEach((slide) => {
          wrapper.appendChild(this._cloneSlide(slide));
        });
      }

      var startIndex = count * prependSets;
      var middleEnd = count * (prependSets + 1);

      sliderEl.dataset.nwPlStartIndex = String(startIndex);
      sliderEl.dataset.nwPlCopyCount = String(count);
      sliderEl.dataset.nwPlMiddleEnd = String(middleEnd);

      return {
        startIndex: startIndex,
        copyCount: count,
        middleEnd: middleEnd
      };
    }

    _fixInfinitePosition(swiper) {
      if (!swiper || this.originalCount <= 1) return;

      var sliderEl = swiper.el;
      var meta = this._getSlideMeta(sliderEl);
      var activeIndex = swiper.activeIndex;

      if (activeIndex >= meta.middleEnd) {
        swiper.slideTo(activeIndex - meta.copyCount, 0);
      } else if (activeIndex < meta.startIndex) {
        swiper.slideTo(activeIndex + meta.copyCount, 0);
      }
    }

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-product-list__swiper');
        if (!sliderEl) return;

        if (sliderEl.swiper) {
          sliderEl.swiper.destroy(true, true);
        }

        this.swiperInstance = null;

        var enableInfinite = this.originalCount > 1;
        var slideMeta = { startIndex: 0, copyCount: this.originalCount, middleEnd: this.originalCount };
        var showArrows = this.dataset.showArrows === 'true';

        if (enableInfinite) {
          slideMeta = this._ensureEnoughSlides(sliderEl);
        }

        var swiperOptions = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          centeredSlides: false,
          centeredSlidesBounds: false,
          loop: false,
          initialSlide: slideMeta.startIndex,
          speed: 600,
          grabCursor: true,
          simulateTouch: true,
          allowTouchMove: true,
          watchSlidesProgress: true,
          watchOverflow: false,
          observer: true,
          observeParents: true,
          resizeObserver: true,
          breakpoints: {
            750: {
              centeredSlides: true,
              spaceBetween: 20
            }
          }
        };

        if (showArrows) {
          swiperOptions.navigation = {
            nextEl: this.querySelector('.nw-swiper-btn--next'),
            prevEl: this.querySelector('.nw-swiper-btn--prev'),
            disabledClass: 'swiper-button-disabled'
          };
        }

        this.swiperInstance = new Swiper(sliderEl, swiperOptions);

        this.swiperInstance.on('slideChange', () => this._updateCustomPagination());
        this.swiperInstance.on('slideChangeTransitionEnd', () => {
          this._fixInfinitePosition(this.swiperInstance);
          this._updateCustomPagination();
        });
        this.swiperInstance.on('transitionEnd', () => this._updateCustomPagination());

        this.swiperInstance.on('resize', () => {
          var savedIndex = this._getRealSlideIndex(this.swiperInstance.activeIndex);
          var refreshedMeta = slideMeta;

          if (enableInfinite) {
            refreshedMeta = this._ensureEnoughSlides(sliderEl);
          }

          this.swiperInstance.update();
          this.swiperInstance.slideTo(refreshedMeta.startIndex + savedIndex, 0);
          this._updateCustomPagination();

          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }
        });

        this._updateCustomPagination();
        this._bindPagination();

        if (showArrows && this.swiperInstance.navigation) {
          this.swiperInstance.navigation.update();
        }

        window.requestAnimationFrame(() => {
          if (!this.swiperInstance) return;

          this.swiperInstance.update();
          this.swiperInstance.slideTo(slideMeta.startIndex + this._getRealSlideIndex(this.swiperInstance.activeIndex), 0);
          this._fixInfinitePosition(this.swiperInstance);
          this._updateCustomPagination();

          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }
        });

        window.setTimeout(() => {
          if (!this.swiperInstance) return;

          if (enableInfinite) {
            slideMeta = this._ensureEnoughSlides(sliderEl);
          }

          this.swiperInstance.update();
          this.swiperInstance.slideTo(slideMeta.startIndex + this._getRealSlideIndex(this.swiperInstance.activeIndex), 0);
          this._fixInfinitePosition(this.swiperInstance);
          this._updateCustomPagination();

          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }
        }, 150);
      });
    }
  }

  customElements.define('nw-product-list', NwProductList);
}
