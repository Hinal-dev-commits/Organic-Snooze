if (!customElements.get('nw-trusted-people')) {
  class NwTrustedPeople extends HTMLElement {
    connectedCallback() {
      this.swiperInstance = null;
      this.originalCount = parseInt(this.dataset.blockCount, 10) || 0;
      this._initToggles();
      this._initSwiper();
      this._bindEditorEvents();
    }

    disconnectedCallback() {
      this._unbindEditorEvents();
      var sliderEl = this.querySelector('.nw-trusted-people__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
      this.swiperInstance = null;
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _setCardsExpanded(slideIndex, isExpanded) {
      var cards;

      if (slideIndex !== null && slideIndex !== '') {
        cards = this.querySelectorAll(
          '.swiper-slide[data-slide-index="' + slideIndex + '"] [data-nw-tp-card]'
        );
      } else {
        cards = [];
      }

      if (!cards.length) return;

      cards.forEach(function (card) {
        card.classList.toggle('is-expanded', isExpanded);

        var toggle = card.querySelector('[data-nw-tp-toggle]');
        if (toggle) {
          toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        }
      });

      if (this.swiperInstance) {
        this.swiperInstance.update();
      }
    }

    _initToggles() {
      if (this.dataset.nwTpToggleBound === 'true') return;

      this.dataset.nwTpToggleBound = 'true';

      this.addEventListener('click', (event) => {
        var btn = event.target.closest('[data-nw-tp-toggle]');

        if (!btn || !this.contains(btn)) return;

        event.preventDefault();
        event.stopPropagation();

        var card = btn.closest('[data-nw-tp-card]');
        var slide = btn.closest('.swiper-slide');

        if (!card || !slide) return;

        var isActive = slide.classList.contains('swiper-slide-active');
        var isFullyVisible = slide.classList.contains('swiper-slide-fully-visible');

        if (!isActive && !isFullyVisible) return;

        var isExpanded = !card.classList.contains('is-expanded');
        var slideIndex = slide.getAttribute('data-slide-index');

        if (slideIndex !== null && slideIndex !== '') {
          this._setCardsExpanded(slideIndex, isExpanded);
          return;
        }

        card.classList.toggle('is-expanded', isExpanded);
        btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

        if (this.swiperInstance) {
          this.swiperInstance.update();
        }
      });
    }

    _updateCustomPagination() {
      if (!this.swiperInstance || this.originalCount <= 1) return;

      var paginationEl = this.querySelector('[data-nw-tp-pagination]');
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

      var paginationEl = this.querySelector('[data-nw-tp-pagination]');
      if (!paginationEl) return;

      var bullets = paginationEl.querySelectorAll('.swiper-pagination-bullet');

      bullets.forEach((bullet, index) => {
        if (bullet.dataset.nwTpPaginationBound === 'true') return;

        bullet.dataset.nwTpPaginationBound = 'true';

        bullet.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();

          if (!this.swiperInstance) return;

          var sliderEl = this.querySelector('.nw-trusted-people__swiper');
          var meta = sliderEl ? this._getSlideMeta(sliderEl) : { startIndex: 0 };

          this.swiperInstance.slideTo(meta.startIndex + index, 600);
        });
      });

      this._updateCustomPagination();
    }

    _cloneSlide(slide) {
      var clone = slide.cloneNode(true);
      var sourceCard = slide.querySelector('[data-nw-tp-card]');
      var sourceExpanded = !!(sourceCard && sourceCard.classList.contains('is-expanded'));

      clone.removeAttribute('data-shopify-editor-block');
      clone.removeAttribute('data-shopify-editor-block-index');
      clone.setAttribute('data-nw-tp-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');

      var card = clone.querySelector('[data-nw-tp-card]');
      if (card) {
        card.classList.toggle('is-expanded', sourceExpanded);
      }

      clone.querySelectorAll('[data-nw-tp-toggle]').forEach(function (btn) {
        btn.setAttribute('aria-expanded', sourceExpanded ? 'true' : 'false');
      });

      clone.querySelectorAll('[data-nw-tp-expand]').forEach(function (expand) {
        expand.removeAttribute('hidden');
      });

      return clone;
    }

    _removeClones(wrapper) {
      wrapper
        .querySelectorAll(':scope > .swiper-slide[data-nw-tp-clone]')
        .forEach(function (slide) {
          slide.remove();
        });
    }

    _getSlideMeta(sliderEl) {
      return {
        startIndex: parseInt(sliderEl.dataset.nwTpStartIndex, 10) || 0,
        copyCount: parseInt(sliderEl.dataset.nwTpCopyCount, 10) || this.originalCount,
        middleEnd: parseInt(sliderEl.dataset.nwTpMiddleEnd, 10) || this.originalCount
      };
    }

    _ensureEnoughSlides(sliderEl) {
      var wrapper = sliderEl.querySelector('.swiper-wrapper');
      if (!wrapper) {
        return { startIndex: 0, copyCount: this.originalCount, middleEnd: this.originalCount };
      }

      this._removeClones(wrapper);

      var originalSlides = Array.from(
        wrapper.querySelectorAll(':scope > .swiper-slide:not([data-nw-tp-clone])')
      );

      var count = originalSlides.length;

      if (count <= 1) {
        sliderEl.dataset.nwTpStartIndex = '0';
        sliderEl.dataset.nwTpCopyCount = String(count);
        sliderEl.dataset.nwTpMiddleEnd = String(count);
        return { startIndex: 0, copyCount: count, middleEnd: count };
      }

      var sliderWidth = sliderEl.clientWidth;
      var slideWidth = originalSlides[0].getBoundingClientRect().width;

      if (!sliderWidth || !slideWidth || slideWidth <= 0) {
        sliderEl.dataset.nwTpStartIndex = String(count);
        sliderEl.dataset.nwTpCopyCount = String(count);
        sliderEl.dataset.nwTpMiddleEnd = String(count * 2);
        return { startIndex: count, copyCount: count, middleEnd: count * 2 };
      }

      var spaceBetween = window.innerWidth >= 750 ? 16 : 12;
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

      sliderEl.dataset.nwTpStartIndex = String(startIndex);
      sliderEl.dataset.nwTpCopyCount = String(count);
      sliderEl.dataset.nwTpMiddleEnd = String(middleEnd);

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

    _getRealSlideIndex(activeIndex) {
      return ((activeIndex % this.originalCount) + this.originalCount) % this.originalCount;
    }

    _initSwiper() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-trusted-people__swiper');
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
          centeredSlides: true,
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
              spaceBetween: 16
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

          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }

          this._updateCustomPagination();
        });

        window.setTimeout(() => {
          if (!this.swiperInstance) return;

          if (enableInfinite) {
            slideMeta = this._ensureEnoughSlides(sliderEl);
          }

          this.swiperInstance.update();
          this.swiperInstance.slideTo(slideMeta.startIndex + this._getRealSlideIndex(this.swiperInstance.activeIndex), 0);
          this._fixInfinitePosition(this.swiperInstance);

          if (showArrows && this.swiperInstance.navigation) {
            this.swiperInstance.navigation.update();
          }

          this._updateCustomPagination();
        }, 150);
      });
    }

    _onSectionSelect = () => {
      var sliderEl = this.querySelector('.nw-trusted-people__swiper');
      if (!sliderEl || !sliderEl.swiper) return;

      sliderEl.swiper.update();

      if (this.dataset.showArrows === 'true' && sliderEl.swiper.navigation) {
        sliderEl.swiper.navigation.update();
      }

      this._updateCustomPagination();
    };

    _onBlockSelect = (event) => {
      var sliderEl = this.querySelector('.nw-trusted-people__swiper');
      if (!sliderEl || !sliderEl.swiper) return;

      if (event.target && event.target.getAttribute('data-nw-tp-clone') === 'true') return;

      var slideIndex = event.target && event.target.getAttribute('data-slide-index');
      if (slideIndex === null || slideIndex === undefined) return;

      var index = parseInt(slideIndex, 10);
      if (isNaN(index)) return;

      if (sliderEl.swiper.params.loop) {
        sliderEl.swiper.slideToLoop(index, 400);
      } else {
        var meta = this._getSlideMeta(sliderEl);
        sliderEl.swiper.slideTo(meta.startIndex + index, 400);
      }

      sliderEl.swiper.update();

      if (this.dataset.showArrows === 'true' && sliderEl.swiper.navigation) {
        sliderEl.swiper.navigation.update();
      }

      this._updateCustomPagination();
    };

    _onBlockDeselect = () => {
      var sliderEl = this.querySelector('.nw-trusted-people__swiper');
      if (!sliderEl || !sliderEl.swiper) return;

      sliderEl.swiper.update();

      if (this.dataset.showArrows === 'true' && sliderEl.swiper.navigation) {
        sliderEl.swiper.navigation.update();
      }
    };

    _bindEditorEvents() {
      if (!Shopify || !Shopify.designMode) return;
      document.addEventListener('shopify:section:select', this._onSectionSelect);
      document.addEventListener('shopify:block:select', this._onBlockSelect);
      document.addEventListener('shopify:block:deselect', this._onBlockDeselect);
    }

    _unbindEditorEvents() {
      document.removeEventListener('shopify:section:select', this._onSectionSelect);
      document.removeEventListener('shopify:block:select', this._onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this._onBlockDeselect);
    }
  }

  customElements.define('nw-trusted-people', NwTrustedPeople);
}
