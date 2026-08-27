class NwProductReviews extends HTMLElement {
  connectedCallback() {
    if (this.dataset.bound === 'true') return;
    this.dataset.bound = 'true';
    this._resizeObserver = null;
    this._initSwiper();
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    const sliderEl = this.querySelector('.nw-product-reviews__swiper');
    if (sliderEl?.swiper) sliderEl.swiper.destroy(true, true);
  }

  _getSpaceBetween() {
    return window.matchMedia('(min-width: 750px)').matches ? 16 : 16;
  }

  _updateSlideBounds(swiper, sliderEl) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length || !swiper) return;

    const containerWidth = sliderEl.clientWidth;
    if (!containerWidth) return;

    swiper.params.slidesOffsetBefore = 0;
    swiper.params.slidesOffsetAfter = 0;
    swiper.params.spaceBetween = this._getSpaceBetween();
    swiper.update();
  }

  _getVisibleSlideCount(sliderEl) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length) return 1;

    const containerWidth = sliderEl.clientWidth;
    const slideWidth = slides[0].getBoundingClientRect().width;
    const spaceBetween = this._getSpaceBetween();

    return Math.max(
      1,
      Math.min(slides.length, Math.floor((containerWidth + spaceBetween) / (slideWidth + spaceBetween)))
    );
  }

  _getPageCount(sliderEl) {
    const slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
    if (slideCount <= 1) return 1;

    const visibleCount = this._getVisibleSlideCount(sliderEl);
    return Math.max(1, slideCount - visibleCount + 1);
  }

  _getMaxScroll(sliderEl) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length) return 0;

    const containerWidth = sliderEl.clientWidth;
    const lastSlide = slides[slides.length - 1];
    const totalWidth = lastSlide.offsetLeft + lastSlide.offsetWidth;

    return Math.max(0, totalWidth - containerWidth);
  }

  _getPageScrollTarget(sliderEl, pageIndex) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    const pageCount = this._getPageCount(sliderEl);
    const maxScroll = this._getMaxScroll(sliderEl);

    if (pageCount <= 1) return 0;
    if (pageIndex >= pageCount - 1) return maxScroll;

    const slide = slides[pageIndex];
    return slide ? Math.min(slide.offsetLeft, maxScroll) : 0;
  }

  _getActivePage(swiper, sliderEl) {
    const pageCount = this._getPageCount(sliderEl);
    if (pageCount <= 1) return 0;

    const maxScroll = this._getMaxScroll(sliderEl);
    const currentScroll = Math.abs(swiper.translate);

    if (maxScroll > 0 && currentScroll >= maxScroll - 4) {
      return pageCount - 1;
    }

    let activePage = 0;
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const target = this._getPageScrollTarget(sliderEl, pageIndex);
      if (currentScroll >= target - 6) {
        activePage = pageIndex;
      }
    }

    return activePage;
  }

  _goToPage(swiper, sliderEl, pageIndex) {
    const pageCount = this._getPageCount(sliderEl);
    if (pageIndex < 0 || pageIndex >= pageCount) return;

    const target = this._getPageScrollTarget(sliderEl, pageIndex);
    swiper.setTransition(500);
    swiper.setTranslate(-target);

    const slides = sliderEl.querySelectorAll('.swiper-slide');
    const slideIndex = pageIndex >= slides.length ? slides.length - 1 : pageIndex;
    swiper.updateActiveIndex(slideIndex);
    swiper.updateSlidesClasses();
    this._updatePagination(sliderEl, pageIndex);
  }

  _buildPagination(swiper, sliderEl) {
    if (this.dataset.showPagination !== 'true') return;

    const paginationEl = this.querySelector('[data-nw-product-reviews-pagination]');
    if (!paginationEl) return;

    const pageCount = this._getPageCount(sliderEl);
    paginationEl.innerHTML = '';

    if (pageCount <= 1) {
      paginationEl.hidden = true;
      return;
    }

    paginationEl.hidden = false;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const bullet = document.createElement('span');
      bullet.className = `swiper-pagination-bullet${pageIndex === 0 ? ' swiper-pagination-bullet-active' : ''}`;
      bullet.dataset.pageIndex = String(pageIndex);
      bullet.setAttribute('role', 'button');
      bullet.setAttribute('tabindex', '0');
      bullet.setAttribute('aria-label', `Go to review page ${pageIndex + 1}`);
      paginationEl.appendChild(bullet);
    }

    this._bindPagination(swiper, sliderEl);
    this._updatePagination(sliderEl, this._getActivePage(swiper, sliderEl));
  }

  _updatePagination(sliderEl, activePage = 0) {
    const paginationEl = this.querySelector('[data-nw-product-reviews-pagination]');
    if (!paginationEl) return;

    paginationEl.querySelectorAll('[data-page-index]').forEach((bullet) => {
      const pageIndex = parseInt(bullet.dataset.pageIndex, 10);
      bullet.classList.toggle('swiper-pagination-bullet-active', pageIndex === activePage);
    });
  }

  _bindPagination(swiper, sliderEl) {
    const paginationEl = this.querySelector('[data-nw-product-reviews-pagination]');
    if (!paginationEl) return;

    paginationEl.querySelectorAll('[data-page-index]').forEach((bullet) => {
      bullet.replaceWith(bullet.cloneNode(true));
    });

    paginationEl.querySelectorAll('[data-page-index]').forEach((bullet) => {
      bullet.addEventListener('click', (event) => {
        event.preventDefault();
        const pageIndex = parseInt(bullet.dataset.pageIndex, 10);
        if (Number.isNaN(pageIndex)) return;
        this._goToPage(swiper, sliderEl, pageIndex);
      });
    });
  }

  _syncPaginationFromTranslate(swiper, sliderEl) {
    this._updatePagination(sliderEl, this._getActivePage(swiper, sliderEl));
  }

  _snapToNearestPage(swiper, sliderEl) {
    const pageCount = this._getPageCount(sliderEl);
    if (pageCount <= 1) return;

    const currentScroll = Math.abs(swiper.translate);
    let nearestPage = 0;
    let nearestDistance = Infinity;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const target = this._getPageScrollTarget(sliderEl, pageIndex);
      const distance = Math.abs(currentScroll - target);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = pageIndex;
      }
    }

    const target = this._getPageScrollTarget(sliderEl, nearestPage);
    if (Math.abs(currentScroll - target) > 2) {
      swiper.setTransition(300);
      swiper.setTranslate(-target);
      swiper.updateSlidesClasses();
    }

    this._updatePagination(sliderEl, nearestPage);
  }

  _initSwiper() {
    window.nwWhenSwiperReady(() => {
      const sliderEl = this.querySelector('.nw-product-reviews__swiper');
      if (!sliderEl) return;
      if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

      const options = {
        slidesPerView: 'auto',
        spaceBetween: this._getSpaceBetween(),
        slidesPerGroup: 1,
        grabCursor: true,
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

      // eslint-disable-next-line no-undef
      const swiper = new Swiper(sliderEl, options);
      const applyBounds = () => {
        this._updateSlideBounds(swiper, sliderEl);
        this._buildPagination(swiper, sliderEl);
      };

      applyBounds();
      window.requestAnimationFrame(applyBounds);
      window.setTimeout(applyBounds, 150);

      swiper.on('resize', applyBounds);
      swiper.on('slideChange', () => this._syncPaginationFromTranslate(swiper, sliderEl));
      swiper.on('transitionEnd', () => {
        this._snapToNearestPage(swiper, sliderEl);
      });
      swiper.on('touchEnd', () => {
        window.requestAnimationFrame(() => {
          this._snapToNearestPage(swiper, sliderEl);
        });
      });

      this._syncPaginationFromTranslate(swiper, sliderEl);

      const sliderWrap = this.querySelector('.nw-product-reviews__slider-wrap');
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(applyBounds);
        this._resizeObserver.observe(sliderEl);
        if (sliderWrap) this._resizeObserver.observe(sliderWrap);
      }
    });
  }
}

class NwProductVideos extends HTMLElement {
  connectedCallback() {
    if (this.dataset.bound === 'true') return;
    this.dataset.bound = 'true';
    this._resizeObserver = null;
    this._initSwiper();
    this._bindVideoPlay();
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    const sliderEl = this.querySelector('.nw-product-videos__swiper');
    if (sliderEl?.swiper) sliderEl.swiper.destroy(true, true);
  }

  _updateSlideBounds(swiper, sliderEl) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length || !swiper) return;

    const containerWidth = sliderEl.clientWidth;
    if (!containerWidth) return;

    swiper.params.slidesOffsetBefore = 0;
    swiper.params.slidesOffsetAfter = 0;
    swiper.update();
  }

  _getSpaceBetween() {
    return 16;
  }

  _getVisibleSlideCount(sliderEl) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length) return 1;

    const containerWidth = sliderEl.clientWidth;
    const slideWidth = slides[0].getBoundingClientRect().width;
    const spaceBetween = this._getSpaceBetween();

    return Math.max(
      1,
      Math.min(slides.length, Math.floor((containerWidth + spaceBetween) / (slideWidth + spaceBetween)))
    );
  }

  _getPageCount(sliderEl) {
    const slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
    if (slideCount <= 1) return 1;

    const visibleCount = this._getVisibleSlideCount(sliderEl);
    return Math.max(1, slideCount - visibleCount + 1);
  }

  _getMaxScroll(sliderEl) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length) return 0;

    const containerWidth = sliderEl.clientWidth;
    const lastSlide = slides[slides.length - 1];
    const totalWidth = lastSlide.offsetLeft + lastSlide.offsetWidth;

    return Math.max(0, totalWidth - containerWidth);
  }

  _getPageScrollTarget(sliderEl, pageIndex) {
    const slides = sliderEl.querySelectorAll('.swiper-slide');
    const pageCount = this._getPageCount(sliderEl);
    const maxScroll = this._getMaxScroll(sliderEl);

    if (pageCount <= 1) return 0;
    if (pageIndex >= pageCount - 1) return maxScroll;

    const slide = slides[pageIndex];
    return slide ? Math.min(slide.offsetLeft, maxScroll) : 0;
  }

  _getActivePage(swiper, sliderEl) {
    const pageCount = this._getPageCount(sliderEl);
    if (pageCount <= 1) return 0;

    const maxScroll = this._getMaxScroll(sliderEl);
    const currentScroll = Math.abs(swiper.translate);

    if (maxScroll > 0 && currentScroll >= maxScroll - 4) {
      return pageCount - 1;
    }

    let activePage = 0;
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const target = this._getPageScrollTarget(sliderEl, pageIndex);
      if (currentScroll >= target - 6) {
        activePage = pageIndex;
      }
    }

    return activePage;
  }

  _goToPage(swiper, sliderEl, pageIndex) {
    const pageCount = this._getPageCount(sliderEl);
    if (pageIndex < 0 || pageIndex >= pageCount) return;

    const target = this._getPageScrollTarget(sliderEl, pageIndex);
    swiper.setTransition(500);
    swiper.setTranslate(-target);

    const slides = sliderEl.querySelectorAll('.swiper-slide');
    const slideIndex = pageIndex >= slides.length ? slides.length - 1 : pageIndex;
    swiper.updateActiveIndex(slideIndex);
    swiper.updateSlidesClasses();
    this._updatePagination(swiper, sliderEl, pageIndex);
  }

  _buildPagination(swiper, sliderEl) {
    const paginationEl = this.querySelector('[data-nw-product-videos-pagination]');
    if (!paginationEl) return;

    const pageCount = this._getPageCount(sliderEl);
    paginationEl.innerHTML = '';

    if (pageCount <= 1) {
      paginationEl.hidden = true;
      return;
    }

    paginationEl.hidden = false;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const bullet = document.createElement('span');
      bullet.className = `swiper-pagination-bullet${pageIndex === 0 ? ' swiper-pagination-bullet-active' : ''}`;
      bullet.dataset.pageIndex = String(pageIndex);
      bullet.setAttribute('role', 'button');
      bullet.setAttribute('tabindex', '0');
      bullet.setAttribute('aria-label', `Go to video page ${pageIndex + 1}`);
      paginationEl.appendChild(bullet);
    }

    this._bindPagination(swiper, sliderEl);
    this._updatePagination(swiper, sliderEl, this._getActivePage(swiper, sliderEl));
  }

  _updatePagination(swiper, sliderEl, activePage = this._getActivePage(swiper, sliderEl)) {
    const paginationEl = this.querySelector('[data-nw-product-videos-pagination]');
    if (!paginationEl) return;

    paginationEl.querySelectorAll('[data-page-index]').forEach((bullet) => {
      const pageIndex = parseInt(bullet.dataset.pageIndex, 10);
      bullet.classList.toggle('swiper-pagination-bullet-active', pageIndex === activePage);
    });
  }

  _bindPagination(swiper, sliderEl) {
    const paginationEl = this.querySelector('[data-nw-product-videos-pagination]');
    if (!paginationEl) return;

    paginationEl.querySelectorAll('[data-page-index]').forEach((bullet) => {
      bullet.replaceWith(bullet.cloneNode(true));
    });

    paginationEl.querySelectorAll('[data-page-index]').forEach((bullet) => {
      bullet.addEventListener('click', (event) => {
        event.preventDefault();
        const pageIndex = parseInt(bullet.dataset.pageIndex, 10);
        if (Number.isNaN(pageIndex)) return;
        this._goToPage(swiper, sliderEl, pageIndex);
      });
    });
  }

  _syncPaginationFromTranslate(swiper, sliderEl) {
    this._updatePagination(swiper, sliderEl);
  }

  _snapToNearestPage(swiper, sliderEl) {
    const pageCount = this._getPageCount(sliderEl);
    if (pageCount <= 1) return;

    const currentScroll = Math.abs(swiper.translate);
    let nearestPage = 0;
    let nearestDistance = Infinity;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const target = this._getPageScrollTarget(sliderEl, pageIndex);
      const distance = Math.abs(currentScroll - target);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = pageIndex;
      }
    }

    const target = this._getPageScrollTarget(sliderEl, nearestPage);
    if (Math.abs(currentScroll - target) > 2) {
      swiper.setTransition(300);
      swiper.setTranslate(-target);
      swiper.updateSlidesClasses();
    }

    this._updatePagination(swiper, sliderEl, nearestPage);
  }

  _pauseOtherVideos(currentVideo) {
    this.querySelectorAll('video').forEach((video) => {
      if (video === currentVideo) return;
      video.pause();
      video.closest('.nw-product-videos__card')?.classList.remove('is-playing');
    });
  }

  _initSwiper() {
    window.nwWhenSwiperReady(() => {
      const sliderEl = this.querySelector('.nw-product-videos__swiper');
      if (!sliderEl) return;
      if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

      const options = {
        slidesPerView: 'auto',
        spaceBetween: 8,
        slidesPerGroup: 1,
        grabCursor: true,
        watchSlidesProgress: true,
        watchOverflow: false,
        observer: true,
        observeParents: true,
        resizeObserver: true,
        breakpoints: {
          750: {
            spaceBetween: 12
          }
        }
      };

      // eslint-disable-next-line no-undef
      const swiper = new Swiper(sliderEl, options);
      const applyBounds = () => {
        this._updateSlideBounds(swiper, sliderEl);
        this._buildPagination(swiper, sliderEl);
      };

      applyBounds();
      window.requestAnimationFrame(applyBounds);
      window.setTimeout(applyBounds, 150);

      swiper.on('resize', applyBounds);
      swiper.on('slideChange', () => this._syncPaginationFromTranslate(swiper, sliderEl));
      swiper.on('transitionEnd', () => {
        this._snapToNearestPage(swiper, sliderEl);
      });
      swiper.on('touchEnd', () => {
        window.requestAnimationFrame(() => {
          this._snapToNearestPage(swiper, sliderEl);
        });
      });

      this._syncPaginationFromTranslate(swiper, sliderEl);

      const sliderWrap = this.querySelector('.nw-product-videos__slider-wrap');
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(applyBounds);
        this._resizeObserver.observe(sliderEl);
        if (sliderWrap) this._resizeObserver.observe(sliderWrap);
      }
    });
  }

  _bindVideoPlay() {
    this.querySelectorAll('[data-nw-product-video-media]').forEach((media) => {
      const playBtn = media.querySelector('[data-nw-product-video-play]');
      const video = media.querySelector('video');
      const card = media.closest('.nw-product-videos__card');
      if (!playBtn || !video || !card) return;

      playBtn.addEventListener('click', () => {
        this._pauseOtherVideos(video);
        card.classList.add('is-playing');
        video.play();
      });

      video.addEventListener('pause', () => {
        if (video.currentTime > 0 && !video.ended) return;
        card.classList.remove('is-playing');
      });

      video.addEventListener('ended', () => {
        card.classList.remove('is-playing');
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
