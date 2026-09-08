if (!customElements.get('nw-layer-v2')) {
  class NwLayerV2 extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this._hotspotHandlers = [];
      this._initSlider();
    }

    disconnectedCallback() {
      if (this._onBlockSelect) {
        document.removeEventListener('shopify:block:select', this._onBlockSelect);
        this._onBlockSelect = null;
      }

      if (this._hotspotHandlers) {
        this._hotspotHandlers.forEach(({ el, fn }) => {
          el.removeEventListener('click', fn);
        });
        this._hotspotHandlers = null;
      }

      const sliderEl = this.querySelector('.nw-layer-v2__swiper');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }

      this.swiperInstance = null;
      this._initialized = false;
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

    _setActiveHotspot(index) {
      this.querySelectorAll('.nw-layer-v2__hotspot').forEach((hotspot, i) => {
        hotspot.classList.toggle('is-active', i === index);
      });
    }

    _initSlider() {
      this._whenSwiperReady(() => {
        const sliderEl = this.querySelector('.nw-layer-v2__swiper');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        const hotspots = this.querySelectorAll('.nw-layer-v2__hotspot');
        const isAutoplay = this.dataset.autoplay === 'true';
        const speedVal = parseInt(this.dataset.autoplaySpeed, 10) || 5;
        const showArrows = this.dataset.showArrows === 'true';
        const showDots = this.dataset.showDots === 'true';
        const prevBtn = this.querySelector('.nw-swiper-btn--prev');
        const nextBtn = this.querySelector('.nw-swiper-btn--next');
        const paginationEl = this.querySelector('.nw-swiper-pagination');

        const swiperConfig = {
          slidesPerView: 1,
          spaceBetween: 20,
          speed: 400,
          grabCursor: true,
          watchOverflow: true,
          rewind: true,
          on: {
            init: (swiper) => {
              this._setActiveHotspot(swiper.activeIndex || 0);
            },
            slideChange: (swiper) => {
              this._setActiveHotspot(swiper.activeIndex || 0);
            }
          }
        };

        if (window.nwAutoplayEnabled(isAutoplay)) {
          swiperConfig.autoplay = {
            delay: speedVal * 1000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          };
        }

        if (showArrows && prevBtn && nextBtn) {
          swiperConfig.navigation = {
            nextEl: nextBtn,
            prevEl: prevBtn
          };
        }

        if (showDots && paginationEl) {
          swiperConfig.pagination = {
            el: paginationEl,
            clickable: true,
            type: 'bullets'
          };
        }

        this.swiperInstance = new Swiper(sliderEl, swiperConfig);

        hotspots.forEach((hotspot) => {
          const fn = () => {
            const targetIndex = parseInt(hotspot.getAttribute('data-hotspot-index'), 10);
            if (!Number.isNaN(targetIndex) && this.swiperInstance) {
              this.swiperInstance.slideTo(targetIndex);
            }
          };

          hotspot.addEventListener('click', fn);
          this._hotspotHandlers.push({ el: hotspot, fn });
        });

        if (window.Shopify && Shopify.designMode) {
          this._onBlockSelect = (e) => {
            if (!e.target || !this.contains(e.target)) return;

            const slideIndex = e.target.getAttribute('data-slide-index');
            if (slideIndex !== null && this.swiperInstance) {
              this.swiperInstance.slideTo(parseInt(slideIndex, 10));
            }
          };

          document.addEventListener('shopify:block:select', this._onBlockSelect);
        }
      });
    }
  }

  customElements.define('nw-layer-v2', NwLayerV2);
}
