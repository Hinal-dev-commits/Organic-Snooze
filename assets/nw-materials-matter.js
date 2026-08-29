if (!customElements.get('nw-materials-matter')) {
  class NwMaterialsMatter extends HTMLElement {
    connectedCallback() {
      this._swiper = null;
      this._mobileQuery = window.matchMedia('(max-width: 749px)');

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

    _toggleSwiper() {
      if (this.dataset.mobileSlider !== 'true') return;

      if (this._mobileQuery.matches) {
        this._initSwiper();
      } else {
        this._destroySwiper();
      }
    }

    _initSwiper() {
      if (this._swiper) return;

      var sliderEl = this.querySelector('.nw-materials-matter__swiper');
      if (!sliderEl) return;

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

      this.classList.add('is-mobile-swiper');
      this._swiper = new Swiper(sliderEl, options);
    }

    _destroySwiper() {
      this.classList.remove('is-mobile-swiper');

      if (!this._swiper) return;

      this._swiper.destroy(true, true);
      this._swiper = null;
    }
  }

  customElements.define('nw-materials-matter', NwMaterialsMatter);
}
