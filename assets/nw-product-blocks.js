class NwProductReviews extends HTMLElement {
  connectedCallback() {
    if (this.dataset.bound === 'true') return;
    this.dataset.bound = 'true';
    this._initSwiper();
  }

  disconnectedCallback() {
    const sliderEl = this.querySelector('.nw-product-reviews__swiper');
    if (sliderEl?.swiper) sliderEl.swiper.destroy(true, true);
  }

  _initSwiper() {
    window.nwWhenSwiperReady(() => {
      const sliderEl = this.querySelector('.nw-product-reviews__swiper');
      if (!sliderEl) return;
      if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

      const showPagination = this.dataset.showPagination === 'true';
      const paginationId = this.dataset.paginationId;

      const options = {
        slidesPerView: 2.2,
        spaceBetween: 12,
        grabCursor: true,
        watchOverflow: true,
        breakpoints: {
          750: {
            spaceBetween: 16
          }
        }
      };

      if (showPagination && paginationId) {
        options.pagination = {
          el: `#${paginationId}`,
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active'
        };
      }

      // eslint-disable-next-line no-undef
      new Swiper(sliderEl, options);
    });
  }
}

class NwProductVideos extends HTMLElement {
  connectedCallback() {
    if (this.dataset.bound === 'true') return;
    this.dataset.bound = 'true';
    this._initSwiper();
    this._bindVideoPlay();
  }

  disconnectedCallback() {
    const sliderEl = this.querySelector('.nw-product-videos__swiper');
    if (sliderEl?.swiper) sliderEl.swiper.destroy(true, true);
  }

  _initSwiper() {
    window.nwWhenSwiperReady(() => {
      const sliderEl = this.querySelector('.nw-product-videos__swiper');
      if (!sliderEl) return;
      if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

      const showPagination = this.dataset.showPagination === 'true';
      const paginationId = this.dataset.paginationId;

      const options = {
        slidesPerView: 2,
        spaceBetween: 12,
        grabCursor: true,
        watchOverflow: true,
        breakpoints: {
          750: {
            spaceBetween: 16
          }
        }
      };

      if (showPagination && paginationId) {
        options.pagination = {
          el: `#${paginationId}`,
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active'
        };
      }

      // eslint-disable-next-line no-undef
      new Swiper(sliderEl, options);
    });
  }

  _bindVideoPlay() {
    this.querySelectorAll('[data-nw-product-video-media]').forEach((media) => {
      const playBtn = media.querySelector('[data-nw-product-video-play]');
      const video = media.querySelector('video');
      const poster = media.querySelector('.nw-product-videos__poster');
      if (!playBtn || !video) return;

      playBtn.addEventListener('click', () => {
        poster?.classList.add('is-hidden');
        playBtn.classList.add('is-hidden');
        video.play();
      });

      video.addEventListener('pause', () => {
        if (video.currentTime > 0 && !video.ended) return;
        poster?.classList.remove('is-hidden');
        playBtn.classList.remove('is-hidden');
      });

      video.addEventListener('ended', () => {
        poster?.classList.remove('is-hidden');
        playBtn.classList.remove('is-hidden');
      });
    });
  }
}

if (!customElements.get('nw-product-reviews')) {
  customElements.define('nw-product-reviews', NwProductReviews);
}

if (!customElements.get('nw-product-videos')) {
  customElements.define('nw-product-videos', NwProductVideos);
}
