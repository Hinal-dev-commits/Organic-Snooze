if (!customElements.get('nw-testimonials')) {
  class NwTestimonials extends HTMLElement {
    connectedCallback() {
      this.swiperInstance = null;
      this.originalCount = 0;
      var sliderEl = this.querySelector('.nw-testimonials__swiper');
      if (sliderEl) {
        this.originalCount = sliderEl.querySelectorAll('.swiper-wrapper > .swiper-slide:not([data-nw-testimonial-clone])').length;
      }
      this._initSwiper();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-testimonials__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
      this.swiperInstance = null;
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

    _getRealSlideIndex(activeIndex) {
      if (!this.originalCount || this.originalCount <= 0) return 0;
      return ((activeIndex % this.originalCount) + this.originalCount) % this.originalCount;
    }

    _updateCustomPagination() {
      if (!this.swiperInstance || this.originalCount <= 1) return;

      var paginationEl = this.querySelector('[data-nw-testimonial-pagination]');
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

      var paginationEl = this.querySelector('[data-nw-testimonial-pagination]');
      if (!paginationEl) return;

      var bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');

      bullets.forEach((bullet, index) => {
        if (bullet.dataset.nwPaginationBound === 'true') return;

        bullet.dataset.nwPaginationBound = 'true';

        bullet.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!this.swiperInstance) return;

          var sliderEl = this.querySelector('.nw-testimonials__swiper');
          var meta = sliderEl ? this._getSlideMeta(sliderEl) : { startIndex: 0 };

          this.swiperInstance.slideTo(meta.startIndex + index, 500);
        });
      });

      this._updateCustomPagination();
    }

    _cloneSlide(slide) {
      var clone = slide.cloneNode(true);
      clone.removeAttribute('data-shopify-editor-block');
      clone.removeAttribute('data-shopify-editor-block-index');
      clone.removeAttribute('data-slide-index');
      clone.setAttribute('data-nw-testimonial-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      return clone;
    }

    _removeClones(wrapper) {
      wrapper
        .querySelectorAll(':scope > .swiper-slide[data-nw-testimonial-clone]')
        .forEach(function (slide) {
          slide.remove();
        });
    }

    _getSlideMeta(sliderEl) {
      return {
        startIndex: parseInt(sliderEl.dataset.nwStartIndex, 10) || 0,
        copyCount: parseInt(sliderEl.dataset.nwCopyCount, 10) || this.originalCount,
        middleEnd: parseInt(sliderEl.dataset.nwMiddleEnd, 10) || this.originalCount
      };
    }

    _ensureEnoughSlides(sliderEl) {
      var wrapper = sliderEl.querySelector('.swiper-wrapper');
      if (!wrapper) {
        return { startIndex: 0, copyCount: this.originalCount, middleEnd: this.originalCount };
      }

      this._removeClones(wrapper);

      var originalSlides = Array.from(
        wrapper.querySelectorAll(':scope > .swiper-slide:not([data-nw-testimonial-clone])')
      );

      var count = originalSlides.length;

      if (count <= 1) {
        sliderEl.dataset.nwStartIndex = '0';
        sliderEl.dataset.nwCopyCount = String(count);
        sliderEl.dataset.nwMiddleEnd = String(count);
        return { startIndex: 0, copyCount: count, middleEnd: count };
      }

      var sliderWidth = sliderEl.clientWidth || window.innerWidth;
      var slideWidth = (originalSlides[0] && originalSlides[0].getBoundingClientRect().width) || 305;
      var spaceBetween = window.innerWidth >= 750 ? 20 : 12;
      var visibleSlides = Math.ceil(sliderWidth / (slideWidth + spaceBetween)) || 4;

      var setsNeeded = Math.max(3, Math.ceil((visibleSlides * 2 + count) / count) + 1);
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

      sliderEl.dataset.nwStartIndex = String(startIndex);
      sliderEl.dataset.nwCopyCount = String(count);
      sliderEl.dataset.nwMiddleEnd = String(middleEnd);

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
        var sliderEl = this.querySelector('.nw-testimonials__swiper');
        if (!sliderEl) return;

        if (sliderEl.swiper) {
          sliderEl.swiper.destroy(true, true);
        }

        this.swiperInstance = null;

        var showArrows = this.dataset.showArrows === 'true';
        var showPagination = this.dataset.showPagination === 'true';
        var isFullWidth = this.dataset.fullWidth === 'true';
        var enableLoop = this.dataset.loop === 'true';

        var enableInfinite = enableLoop && this.originalCount > 1;
        var slideMeta = { startIndex: 0, copyCount: this.originalCount, middleEnd: this.originalCount };

        if (enableInfinite) {
          slideMeta = this._ensureEnoughSlides(sliderEl);
        } else {
          var wrapper = sliderEl.querySelector('.swiper-wrapper');
          if (wrapper) this._removeClones(wrapper);
        }

        var prevBtn = this.querySelector('.nw-swiper-btn--prev');
        var nextBtn = this.querySelector('.nw-swiper-btn--next');
        var paginationEl = this.querySelector('.nw-swiper-pagination');

        var swiperOptions = {
          slidesPerView: 'auto',
          spaceBetween: 12,
          centeredSlides: isFullWidth,
          centeredSlidesBounds: !isFullWidth,
          loop: false,
          initialSlide: slideMeta.startIndex,
          speed: 500,
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
              centeredSlides: isFullWidth,
              centeredSlidesBounds: !isFullWidth,
              spaceBetween: 20
            }
          }
        };

        if (showArrows && prevBtn && nextBtn) {
          swiperOptions.navigation = {
            prevEl: prevBtn,
            nextEl: nextBtn,
            disabledClass: 'swiper-button-disabled'
          };
        }

        this.swiperInstance = new Swiper(sliderEl, swiperOptions);

        if (enableInfinite) {
          this.swiperInstance.on('slideChange', () => this._updateCustomPagination());
          this.swiperInstance.on('slideChangeTransitionEnd', () => {
            this._fixInfinitePosition(this.swiperInstance);
            this._updateCustomPagination();
          });
          this.swiperInstance.on('transitionEnd', () => this._updateCustomPagination());

          this.swiperInstance.on('resize', () => {
            var savedIndex = this._getRealSlideIndex(this.swiperInstance.activeIndex);
            var refreshedMeta = this._ensureEnoughSlides(sliderEl);

            this.swiperInstance.update();
            this.swiperInstance.slideTo(refreshedMeta.startIndex + savedIndex, 0);
            this._updateCustomPagination();

            if (showArrows && this.swiperInstance.navigation) {
              this.swiperInstance.navigation.update();
            }
          });

          this._updateCustomPagination();
          this._bindPagination();
        } else {
          if (showPagination && paginationEl) {
            var bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');
            bullets.forEach((bullet, index) => {
              bullet.addEventListener('click', () => {
                this.swiperInstance.slideTo(index, 500);
              });
            });
            this.swiperInstance.on('slideChange', () => {
              var currentIndex = this.swiperInstance.activeIndex;
              bullets.forEach((bullet, index) => {
                bullet.classList.toggle('swiper-pagination-bullet-active', index === currentIndex);
              });
            });
          }
        }

        if (showArrows && this.swiperInstance.navigation) {
          this.swiperInstance.navigation.update();
        }

        window.requestAnimationFrame(() => {
          if (!this.swiperInstance) return;
          this.swiperInstance.update();
          if (enableInfinite) {
            this.swiperInstance.slideTo(slideMeta.startIndex + this._getRealSlideIndex(this.swiperInstance.activeIndex), 0);
            this._fixInfinitePosition(this.swiperInstance);
            this._updateCustomPagination();
          }
          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }
        });

        window.setTimeout(() => {
          if (!this.swiperInstance) return;
          if (enableInfinite) {
            slideMeta = this._ensureEnoughSlides(sliderEl);
            this.swiperInstance.update();
            this.swiperInstance.slideTo(slideMeta.startIndex + this._getRealSlideIndex(this.swiperInstance.activeIndex), 0);
            this._fixInfinitePosition(this.swiperInstance);
            this._updateCustomPagination();
          } else {
            this.swiperInstance.update();
          }
          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }
        }, 150);
      });
    }
  }

  customElements.define('nw-testimonials', NwTestimonials);
}
