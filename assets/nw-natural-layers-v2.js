if (!customElements.get('nw-natural-layers-v2')) {
  class NwNaturalLayersV2 extends HTMLElement {
    connectedCallback() {
      this._swiper = null;
      this._mobileQuery = window.matchMedia('(max-width: 749px)');
      this._desktopSlider = this.dataset.enableSlider === 'true';
      this._mobileSlider = this.dataset.enableSliderMobile === 'true';

      if (this._desktopSlider) {
        this._whenSwiperReady(() => this._initDesktopSwiper());
        return;
      }

      if (this._mobileSlider) {
        this._onMobileChange = () => this._toggleMobileSwiper();
        this._mobileQuery.addEventListener('change', this._onMobileChange);
        this._whenSwiperReady(() => this._toggleMobileSwiper());
      }
    }

    disconnectedCallback() {
      this._destroySwiper();

      if (this._mobileQuery && this._onMobileChange) {
        this._mobileQuery.removeEventListener('change', this._onMobileChange);
      }
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

    _getSliderEl() {
      return this.querySelector('.nw-natural-layers-v2__swiper');
    }

    _initDesktopSwiper() {
      this._destroySwiper();

      var sliderEl = this._getSliderEl();
      if (!sliderEl) return;

      var showArrows = this.dataset.showArrows === 'true';
      var showDots = this.dataset.showDots === 'true';
      var paginationEl = this.querySelector('.nw-swiper-pagination:not(.nw-natural-layers-v2__pagination-mobile)');

      var options = {
        slidesPerView: 'auto',
        spaceBetween: 20,
        grabCursor: true,
        watchOverflow: true,
        centerInsufficientSlides: true,
        breakpoints: {
          0: {
            slidesPerView: 'auto',
            spaceBetween: 12,
            slidesOffsetBefore: 16,
            slidesOffsetAfter: 16
          },
          750: {
            slidesPerView: 'auto',
            spaceBetween: 16,
            slidesOffsetBefore: 0,
            slidesOffsetAfter: 0
          },
          990: {
            slidesPerView: 'auto',
            spaceBetween: 20,
            slidesOffsetBefore: 0,
            slidesOffsetAfter: 0
          }
        }
      };

      if (showArrows) {
        options.navigation = {
          nextEl: this.querySelector('.nw-swiper-btn--next'),
          prevEl: this.querySelector('.nw-swiper-btn--prev')
        };
      }

      if (showDots && paginationEl) {
        options.pagination = {
          el: paginationEl,
          clickable: true
        };
      }

      this.classList.add('is-slider-active');
      this._swiper = new Swiper(sliderEl, options);
    }

    _toggleMobileSwiper() {
      if (this._mobileQuery.matches) {
        this._initMobileSwiper();
      } else {
        this._destroySwiper();
      }
    }

    _initMobileSwiper() {
      if (this._swiper) return;

      var sliderEl = this._getSliderEl();
      if (!sliderEl) return;

      var showArrows = this.dataset.showArrowsMobile === 'true';
      var showDots = this.dataset.showDotsMobile === 'true';
      var paginationEl = this.querySelector('.nw-natural-layers-v2__pagination-mobile');
      var arrowsWrap = this.querySelector('.nw-natural-layers-v2__arrows-mobile');

      var options = {
        slidesPerView: 1.5,
        spaceBetween: 16,
        grabCursor: true,
        watchOverflow: true,
        slidesOffsetBefore: 16,
        slidesOffsetAfter: 16
      };

      if (showArrows && arrowsWrap) {
        options.navigation = {
          nextEl: arrowsWrap.querySelector('.nw-swiper-btn--next'),
          prevEl: arrowsWrap.querySelector('.nw-swiper-btn--prev')
        };
      }

      if (showDots && paginationEl) {
        options.pagination = {
          el: paginationEl,
          clickable: true
        };
      }

      this.classList.add('is-mobile-swiper', 'is-slider-active');
      this._swiper = new Swiper(sliderEl, options);
    }

    _destroySwiper() {
      this.classList.remove('is-mobile-swiper', 'is-slider-active');

      var sliderEl = this._getSliderEl();
      if (this._swiper) {
        this._swiper.destroy(true, true);
        this._swiper = null;
      } else if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }
  }

  customElements.define('nw-natural-layers-v2', NwNaturalLayersV2);
}
