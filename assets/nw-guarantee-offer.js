if (!customElements.get('nw-guarantee-offer')) {
  class NwGuaranteeOffer extends HTMLElement {
    connectedCallback() {
      this._initSwiper();
    }

    disconnectedCallback() {
      if (this.swiperInstance) {
        this.swiperInstance.destroy(true, true);
        this.swiperInstance = null;
      }
    }

    _initSwiper() {
      window.nwWhenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-guarantee-offer__swiper');
        if (!sliderEl) return;

        var slides = sliderEl.querySelectorAll('.swiper-slide');
        if (slides.length <= 1) return;

        if (this.swiperInstance) {
          this.swiperInstance.destroy(true, true);
          this.swiperInstance = null;
        }

        var paginationEl = this.querySelector('.nw-guarantee-offer__pagination');

        this.swiperInstance = new Swiper(sliderEl, {
          slidesPerView: 1,
          spaceBetween: 0,
          loop: true,
          grabCursor: true,
          pagination: paginationEl ? {
            el: paginationEl,
            clickable: true
          } : false
        });
      });
    }
  }

  customElements.define('nw-guarantee-offer', NwGuaranteeOffer);
}
