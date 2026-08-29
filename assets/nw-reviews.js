if (!customElements.get('nw-reviews')) {
  class NwReviews extends HTMLElement {
    connectedCallback() {
      this._videoBound = false;
      this._isSyncing = false;
      this._initSliders();
      this._bindVideoEvents();
    }

    disconnectedCallback() {
      var reviewSlider = this.querySelector('[data-nw-review-slider]');
      if (reviewSlider && reviewSlider.swiper) {
        reviewSlider.swiper.destroy(true, true);
      }
      var insightSlider = this.querySelector('[data-nw-insight-slider]');
      if (insightSlider && insightSlider.swiper) {
        insightSlider.swiper.destroy(true, true);
      }
    }

    _initSliders() {
      if (typeof window.nwWhenSwiperReady !== 'function') return;

      window.nwWhenSwiperReady(() => {
        var reviewSliderEl = this.querySelector('[data-nw-review-slider]');
        var insightSliderEl = this.querySelector('[data-nw-insight-slider]');
        if (!reviewSliderEl) return;

        if (reviewSliderEl.swiper) reviewSliderEl.swiper.destroy(true, true);
        if (insightSliderEl && insightSliderEl.swiper) insightSliderEl.swiper.destroy(true, true);

        var slideCount = reviewSliderEl.querySelectorAll('.swiper-slide').length;
        var enableAutoplay = this.dataset.autoplay === 'true';
        var autoplayDelay = parseInt(this.dataset.autoplayDelay, 10) || 4000;
        var showArrows = this.dataset.showArrows === 'true';
        var showDots = this.dataset.showDots === 'true';

        var reviewSwiperOptions = {
          slidesPerView: 2.2,
          spaceBetween: 20,
          centeredSlides: false,
          loop: false,
          speed: 500,
          grabCursor: true,
          watchSlidesProgress: true,
          slidesOffsetAfter: 20,
          breakpoints: {
            320: {
              slidesPerView: 1.2,
              spaceBetween: 12,
              slidesOffsetBefore: 16,
              slidesOffsetAfter: 16,
              centeredSlides: false
            },
            500: {
              slidesPerView: 1.5,
              spaceBetween: 14,
              slidesOffsetBefore: 16,
              slidesOffsetAfter: 16,
              centeredSlides: false
            },
            750: {
              slidesPerView: 1.8,
              spaceBetween: 16,
              slidesOffsetBefore: 20,
              slidesOffsetAfter: 20,
              centeredSlides: false
            },
            990: {
              slidesPerView: 2.2,
              spaceBetween: 20,
              slidesOffsetBefore: 0,
              slidesOffsetAfter: 20,
              centeredSlides: false
            }
          }
        };

        if (enableAutoplay && slideCount > 1) {
          reviewSwiperOptions.autoplay = {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          };
        }

        if (showDots && slideCount > 1) {
          var paginationEl = this.querySelector('[data-nw-review-pagination]');
          if (paginationEl) {
            reviewSwiperOptions.pagination = {
              el: paginationEl,
              clickable: true
            };
          }
        }

        if (showArrows && slideCount > 1) {
          var nextBtn = this.querySelector('.nw-reviews__slider-wrap .nw-swiper-btn--next');
          var prevBtn = this.querySelector('.nw-reviews__slider-wrap .nw-swiper-btn--prev');
          if (nextBtn && prevBtn) {
            reviewSwiperOptions.navigation = {
              nextEl: nextBtn,
              prevEl: prevBtn
            };
          }
        }

        new Swiper(reviewSliderEl, reviewSwiperOptions);

        if (insightSliderEl) {
          var insightSwiperOptions = {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: false,
            speed: 500,
            grabCursor: true,
            watchSlidesProgress: true,
            pagination: {
              el: this.querySelector('[data-nw-insight-pagination]'),
              clickable: true
            }
          };

          new Swiper(insightSliderEl, insightSwiperOptions);
        }
      });
    }

    _bindVideoEvents() {
      if (this._videoBound) return;
      this._videoBound = true;

      this.addEventListener('click', (e) => {
        var card = e.target.closest('.nw-reviews__card');
        if (!card) return;

        var video = card.querySelector('video');
        if (!video) return;

        if (video.paused) {
          this.querySelectorAll('video').forEach((v) => {
            if (v !== video) {
              v.pause();
              var otherCard = v.closest('.nw-reviews__card');
              if (otherCard) otherCard.classList.remove('is-playing');
            }
          });

          card.classList.add('is-playing');
          video.play().catch(() => {});
        } else {
          video.pause();
          card.classList.remove('is-playing');
        }
      });

      this.addEventListener('pause', (e) => {
        if (e.target && e.target.tagName === 'VIDEO') {
          var card = e.target.closest('.nw-reviews__card');
          if (card) card.classList.remove('is-playing');
        }
      }, true);

      this.addEventListener('ended', (e) => {
        if (e.target && e.target.tagName === 'VIDEO') {
          var card = e.target.closest('.nw-reviews__card');
          if (card) card.classList.remove('is-playing');
        }
      }, true);
    }
  }

  customElements.define('nw-reviews', NwReviews);
}
