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

    _allSlidesFit(sliderEl) {
      if (!sliderEl || this.originalCount <= 1) return true;

      var slides = sliderEl.querySelectorAll(
        '.swiper-wrapper > .swiper-slide:not([data-nw-testimonial-clone])'
      );
      if (!slides.length) return true;

      var sliderWidth = sliderEl.clientWidth;
      if (!sliderWidth) return false;

      var spaceBetween = window.innerWidth >= 750 ? 20 : 12;
      var totalWidth = 0;

      slides.forEach(function (slide, index) {
        totalWidth += slide.getBoundingClientRect().width;
        if (index < slides.length - 1) totalWidth += spaceBetween;
      });

      return totalWidth <= sliderWidth + 2;
    }

    _updateOverflowState() {
      var sliderEl = this.querySelector('.nw-testimonials__swiper');
      if (!sliderEl) return;

      var allFit = this._allSlidesFit(sliderEl);
      this.classList.toggle('nw-testimonials--all-visible', allFit);

      var paginationEl = this.querySelector('[data-nw-testimonial-pagination]');
      if (paginationEl) {
        if (allFit) {
          paginationEl.hidden = true;
          paginationEl.setAttribute('aria-hidden', 'true');
        } else {
          this._buildPagination();
        }
      }

      var prevBtn = this.querySelector('.nw-swiper-btn--prev');
      var nextBtn = this.querySelector('.nw-swiper-btn--next');
      if (prevBtn) prevBtn.hidden = allFit;
      if (nextBtn) nextBtn.hidden = allFit;

      if (!this.swiperInstance) return;

      this.swiperInstance.allowTouchMove = !allFit;
      this.swiperInstance.params.simulateTouch = !allFit;

      if (allFit) {
        var wrapper = sliderEl.querySelector('.swiper-wrapper');
        if (wrapper) this._removeClones(wrapper);
        this.swiperInstance.slideTo(0, 0);
      }

      this.swiperInstance.update();
    }

    _getSpaceBetween() {
      return window.innerWidth >= 750 ? 20 : 12;
    }

    _getOriginalSlides(sliderEl) {
      return sliderEl.querySelectorAll(
        '.swiper-wrapper > .swiper-slide:not([data-nw-testimonial-clone])'
      );
    }

    _getVisibleSlideCount(sliderEl) {
      var slides = this._getOriginalSlides(sliderEl);
      if (!slides.length) return 1;

      var containerWidth = sliderEl.clientWidth;
      if (!containerWidth) return 1;

      var slideWidth = slides[0].getBoundingClientRect().width;
      var spaceBetween = this._getSpaceBetween();

      return Math.max(
        1,
        Math.min(slides.length, Math.floor((containerWidth + spaceBetween) / (slideWidth + spaceBetween)))
      );
    }

    _getPageCount(sliderEl) {
      var slideCount = this._getOriginalSlides(sliderEl).length;
      if (slideCount <= 1) return 1;

      var visibleCount = this._getVisibleSlideCount(sliderEl);
      return Math.max(1, slideCount - visibleCount + 1);
    }

    _getActivePage() {
      if (!this.swiperInstance) return 0;

      var sliderEl = this.querySelector('.nw-testimonials__swiper');
      if (!sliderEl) return 0;

      var pageCount = this._getPageCount(sliderEl);
      if (pageCount <= 1) return 0;

      var realIndex = this._getRealSlideIndex(this.swiperInstance.activeIndex);
      return Math.min(realIndex, pageCount - 1);
    }

    _goToPage(pageIndex) {
      if (!this.swiperInstance) return;

      var sliderEl = this.querySelector('.nw-testimonials__swiper');
      if (!sliderEl) return;

      var pageCount = this._getPageCount(sliderEl);
      if (pageIndex < 0 || pageIndex >= pageCount) return;

      var targetIndex = pageIndex;
      var enableInfinite = this.dataset.loop === 'true' && this.originalCount > 1;

      if (enableInfinite && !this.classList.contains('nw-testimonials--all-visible')) {
        var meta = this._getSlideMeta(sliderEl);
        targetIndex = meta.startIndex + pageIndex;
      }

      this.swiperInstance.slideTo(targetIndex, 500);
      this._updatePagination(pageIndex);
    }

    _buildPagination() {
      if (this.dataset.showPagination !== 'true') return;

      var paginationEl = this.querySelector('[data-nw-testimonial-pagination]');
      var sliderEl = this.querySelector('.nw-testimonials__swiper');
      if (!paginationEl || !sliderEl) return;

      if (this.classList.contains('nw-testimonials--all-visible')) {
        paginationEl.hidden = true;
        paginationEl.setAttribute('aria-hidden', 'true');
        return;
      }

      var pageCount = this._getPageCount(sliderEl);
      paginationEl.innerHTML = '';

      if (pageCount <= 1) {
        paginationEl.hidden = true;
        paginationEl.setAttribute('aria-hidden', 'true');
        return;
      }

      paginationEl.hidden = false;
      paginationEl.setAttribute('aria-hidden', 'false');

      for (var pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        var bullet = document.createElement('span');
        bullet.className =
          'swiper-pagination-bullet' + (pageIndex === 0 ? ' swiper-pagination-bullet-active' : '');
        bullet.dataset.pageIndex = String(pageIndex);
        bullet.setAttribute('role', 'button');
        bullet.setAttribute('tabindex', '0');
        bullet.setAttribute('aria-label', 'Go to testimonial page ' + (pageIndex + 1));
        paginationEl.appendChild(bullet);
      }

      this._bindPagination();
      this._updatePagination(this._getActivePage());
    }

    _updatePagination(activePage) {
      var paginationEl = this.querySelector('[data-nw-testimonial-pagination]');
      if (!paginationEl) return;

      paginationEl.querySelectorAll('[data-page-index]').forEach(function (bullet) {
        var pageIndex = parseInt(bullet.dataset.pageIndex, 10);
        bullet.classList.toggle('swiper-pagination-bullet-active', pageIndex === activePage);
      });
    }

    _updateCustomPagination() {
      this._updatePagination(this._getActivePage());
    }

    _bindPagination() {
      if (!this.swiperInstance) return;

      var paginationEl = this.querySelector('[data-nw-testimonial-pagination]');
      if (!paginationEl) return;

      paginationEl.querySelectorAll('[data-page-index]').forEach(function (bullet) {
        bullet.replaceWith(bullet.cloneNode(true));
      });

      paginationEl.querySelectorAll('[data-page-index]').forEach((bullet) => {
        bullet.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();

          var pageIndex = parseInt(bullet.dataset.pageIndex, 10);
          if (Number.isNaN(pageIndex)) return;

          this._goToPage(pageIndex);
        });
      });

      this._updatePagination(this._getActivePage());
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

      var isFullWidth = this.dataset.fullWidth === 'true';
      var setsPerSide = isFullWidth
        ? Math.max(3, Math.ceil((visibleSlides * 2) / count) + 1)
        : Math.max(2, Math.ceil(visibleSlides / count));

      var prependSets = setsPerSide;
      var appendSets = setsPerSide;
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
        var offset = (activeIndex - meta.startIndex) % meta.copyCount;
        swiper.slideTo(meta.startIndex + offset, 0);
      } else if (activeIndex < meta.startIndex) {
        var offset = (((activeIndex - meta.startIndex) % meta.copyCount) + meta.copyCount) % meta.copyCount;
        swiper.slideTo(meta.startIndex + offset, 0);
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

        if (this._allSlidesFit(sliderEl)) {
          enableInfinite = false;
          var fitWrapper = sliderEl.querySelector('.swiper-wrapper');
          if (fitWrapper) this._removeClones(fitWrapper);
          slideMeta = { startIndex: 0, copyCount: this.originalCount, middleEnd: this.originalCount };
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
            var wasAllVisible = this.classList.contains('nw-testimonials--all-visible');
            this._updateOverflowState();

            if (this.classList.contains('nw-testimonials--all-visible')) {
              return;
            }

            if (wasAllVisible && !this.classList.contains('nw-testimonials--all-visible')) {
              slideMeta = this._ensureEnoughSlides(sliderEl);
              this.swiperInstance.slideTo(slideMeta.startIndex, 0);
            } else if (!wasAllVisible) {
              var savedIndex = this._getRealSlideIndex(this.swiperInstance.activeIndex);
              var refreshedMeta = this._ensureEnoughSlides(sliderEl);

              this.swiperInstance.update();
              this.swiperInstance.slideTo(refreshedMeta.startIndex + savedIndex, 0);
            }

            this._updateCustomPagination();
            this._buildPagination();

            if (showArrows && this.swiperInstance.navigation) {
              this.swiperInstance.navigation.update();
            }
          });

          this._updateCustomPagination();
          this._buildPagination();
        } else {
          this._buildPagination();

          this.swiperInstance.on('slideChange', () => {
            this._updateCustomPagination();
          });

          this.swiperInstance.on('resize', () => {
            this._updateOverflowState();
            this._buildPagination();
          });
        }

        if (showArrows && this.swiperInstance.navigation) {
          this.swiperInstance.navigation.update();
        }

        window.requestAnimationFrame(() => {
          if (!this.swiperInstance) return;
          this.swiperInstance.update();
          this._updateOverflowState();
          this._buildPagination();
          if (enableInfinite && !this.classList.contains('nw-testimonials--all-visible')) {
            this.swiperInstance.slideTo(slideMeta.startIndex + this._getActivePage(), 0);
            this._fixInfinitePosition(this.swiperInstance);
            this._updateCustomPagination();
          }
          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }
        });

        window.setTimeout(() => {
          if (!this.swiperInstance) return;
          this._updateOverflowState();
          this._buildPagination();
          if (enableInfinite && !this.classList.contains('nw-testimonials--all-visible')) {
            slideMeta = this._ensureEnoughSlides(sliderEl);
            this.swiperInstance.update();
            this.swiperInstance.slideTo(slideMeta.startIndex + this._getActivePage(), 0);
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
