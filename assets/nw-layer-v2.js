if (!customElements.get('nw-layer-v2')) {
  class NwLayerV2 extends HTMLElement {
    connectedCallback() {
      this._initSlider();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('.nw-layer-v2__swiper');
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

    _setActiveHotspot(index) {
      this.querySelectorAll('.nw-layer-v2__hotspot').forEach(function (hotspot, i) {
        hotspot.classList.toggle('is-active', i === index);
      });
    }

    _initSlider() {
      this._whenSwiperReady(() => {
        var sliderEl = this.querySelector('.nw-layer-v2__swiper');
        if (!sliderEl) return;
        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        var hotspots = this.querySelectorAll('.nw-layer-v2__hotspot');
        var isAutoplay = this.dataset.autoplay === 'true';
        var speedVal = parseInt(this.dataset.autoplaySpeed, 10) || 5;
        var showArrows = this.dataset.showArrows === 'true';
        var showDots = this.dataset.showDots === 'true';
        var prevBtn = this.querySelector('.nw-swiper-btn--prev');
        var nextBtn = this.querySelector('.nw-swiper-btn--next');
        var paginationEl = this.querySelector('.nw-swiper-pagination');

        var swiperConfig = {
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

        if (isAutoplay) {
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
          hotspot.addEventListener('click', () => {
            var targetIndex = parseInt(hotspot.getAttribute('data-hotspot-index'), 10);
            if (!Number.isNaN(targetIndex) && this.swiperInstance) {
              this.swiperInstance.slideTo(targetIndex);
            }
          });
        });

        if (window.Shopify && Shopify.designMode) {
          document.addEventListener('shopify:block:select', (e) => {
            if (!e.target || !this.contains(e.target)) return;

            var slideIndex = e.target.getAttribute('data-slide-index');
            if (slideIndex !== null && this.swiperInstance) {
              this.swiperInstance.slideTo(parseInt(slideIndex, 10));
            }
          });
        }
      });
    }
  }

  customElements.define('nw-layer-v2', NwLayerV2);
}
