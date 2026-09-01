if (!customElements.get('nw-article-products')) {
  class NwArticleProducts extends HTMLElement {
    connectedCallback() {
      this._handleResize = this._checkAndInitSwiper.bind(this);
      window.addEventListener('resize', this._handleResize);
      this._checkAndInitSwiper();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._handleResize);
      this._destroySwiper();
    }

    _destroySwiper() {
      if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      }

      var wrapper = this.querySelector('.nw-article-products__grid');
      if (wrapper) {
        wrapper.removeAttribute('style');
      }

      var slides = this.querySelectorAll('.nw-article-product-card');
      slides.forEach(function (slide) {
        slide.removeAttribute('style');
      });

      var pagination = this.querySelector('.nw-article-products__pagination');
      if (pagination) {
        pagination.classList.remove('is-visible');
        pagination.innerHTML = '';
      }
    }

    _checkAndInitSwiper() {
      var sliderEl = this.querySelector('.nw-article-products__swiper');
      if (!sliderEl) return;

      if (window.innerWidth >= 750) {
        this._destroySwiper();
        return;
      }

      var slides = sliderEl.querySelectorAll('.swiper-slide');
      var paginationEl = this.querySelector('.nw-article-products__pagination');

      if (slides.length <= 1) {
        this._destroySwiper();
        return;
      }

      if (this.swiperInstance) {
        this.swiperInstance.update();
        return;
      }

      window.nwWhenSwiperReady(() => {
        if (window.innerWidth >= 750) return;

        var slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
        if (slideCount <= 1) return;

        if (paginationEl) {
          paginationEl.classList.add('is-visible');
          paginationEl.innerHTML = '';
        }

        var options = {
          slidesPerView: 'auto',
          spaceBetween: 10,
          grabCursor: true,
          watchOverflow: false
        };

        if (paginationEl) {
          options.pagination = {
            el: paginationEl,
            clickable: true,
            type: 'bullets',
            dynamicBullets: false
          };
        }

        this.swiperInstance = new Swiper(sliderEl, options);
      });
    }
  }

  customElements.define('nw-article-products', NwArticleProducts);
}
