if (!customElements.get('nw-materials-matter')) {
  class NwMaterialsMatter extends HTMLElement {
    connectedCallback() {
      this._swiper = null;
      this._mobileQuery = window.matchMedia('(max-width: 749px)');

      this._updateCardLayout();

      if (this.dataset.mobileSlider !== 'true') return;

      this._onMobileChange = () => this._toggleSwiper();
      this._mobileQuery.addEventListener('change', this._onMobileChange);
      this._whenSwiperReady(() => this._toggleSwiper());
    }

    disconnectedCallback() {
      this._destroySwiper();

      if (this._mobileQuery && this._onMobileChange) {
        this._mobileQuery.removeEventListener('change', this._onMobileChange);
      }
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _getCardCount() {
      var count = parseInt(this.dataset.cardCount, 10);
      if (Number.isFinite(count) && count > 0) return count;
      return this.querySelectorAll('.nw-materials-matter__swiper .swiper-slide').length;
    }

    _updateCardLayout() {
      var count = this._getCardCount();
      var shouldCenter = count > 0 && count < 5 && !this.classList.contains('is-mobile-swiper');
      this.classList.toggle('nw-materials-matter--center-cards', shouldCenter);
    }

    _toggleSwiper() {
      if (this.dataset.mobileSlider !== 'true') return;

      if (this._mobileQuery.matches) {
        this._initSwiper();
      } else {
        this._destroySwiper();
      }

      this._updateCardLayout();
    }

    _resetSwiperLayoutStyles() {
      var wrapper = this.querySelector('.nw-materials-matter__grid.swiper-wrapper');
      if (wrapper) {
        wrapper.removeAttribute('style');
      }

      this.querySelectorAll('.nw-materials-matter__swiper .swiper-slide').forEach(function (slide) {
        slide.removeAttribute('style');
      });
    }

    _initSwiper() {
      if (this._swiper) return;

      var sliderEl = this.querySelector('.nw-materials-matter__swiper');
      if (!sliderEl) return;

      var slides = sliderEl.querySelectorAll('.swiper-slide');
      if (slides.length <= 1) {
        this._resetSwiperLayoutStyles();
        this._updateCardLayout();
        return;
      }

      var showPagination = this.dataset.showPagination === 'true';
      var paginationEl = this.querySelector('.nw-materials-matter__pagination');

      var options = {
        slidesPerView: 'auto',
        spaceBetween: 12,
        grabCursor: true,
        watchOverflow: true
      };

      if (showPagination && paginationEl) {
        options.pagination = {
          el: paginationEl,
          clickable: true
        };
      }

      this._swiper = new Swiper(sliderEl, options);

      if (this._swiper.isLocked) {
        this._swiper.destroy(true, true);
        this._swiper = null;
        this._resetSwiperLayoutStyles();
        this._updateCardLayout();
        return;
      }

      this.classList.add('is-mobile-swiper');
      this._updateCardLayout();
    }

    _destroySwiper() {
      this.classList.remove('is-mobile-swiper');

      if (!this._swiper) {
        this._resetSwiperLayoutStyles();
        this._updateCardLayout();
        return;
      }

      this._swiper.destroy(true, true);
      this._swiper = null;
      this._resetSwiperLayoutStyles();
      this._updateCardLayout();
    }
  }

  customElements.define('nw-materials-matter', NwMaterialsMatter);
}
