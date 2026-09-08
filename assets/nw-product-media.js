if (!customElements.get('nw-product-media')) {
  function usesThumbnailNavigation(viewer) {
    return (
      window.matchMedia('(min-width: 750px)').matches &&
      !!viewer.closest('media-gallery')?.querySelector('[id^="GalleryThumbnails"]')
    );
  }

  function getSlides(viewer) {
    return Array.from(viewer.querySelectorAll('.product__media-item'));
  }

  function getCurrentSlideIndex(viewer, slides) {
    if (usesThumbnailNavigation(viewer)) {
      const activeSlide = viewer.querySelector('.product__media-item.is-active');
      if (activeSlide) {
        return slides.indexOf(activeSlide);
      }
    }

    const slider = viewer.querySelector('[id^="Slider-Gallery"]');
    if (!slider || slides.length < 2) return 0;

    let closestIndex = 0;
    let closestDistance = Infinity;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - slider.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function updateDots(viewer, index) {
    viewer.querySelectorAll('.nw-swiper-pagination .swiper-pagination-bullet').forEach((dot, dotIndex) => {
      dot.classList.toggle('swiper-pagination-bullet-active', dotIndex === index);
    });
  }

  function goToIndex(viewer, slides, index) {
    const slide = slides[index];
    if (!slide) return;

    const mediaGallery = viewer.closest('media-gallery');
    const mediaId = slide.dataset.mediaId;
    const thumbnailButton = mediaGallery?.querySelector(`[data-target="${mediaId}"] button`);

    if (usesThumbnailNavigation(viewer) && thumbnailButton) {
      thumbnailButton.click();
      return;
    }

    const slider = viewer.querySelector('[id^="Slider-Gallery"]');
    if (slider) {
      slider.scrollTo({ left: slide.offsetLeft });
    }
  }

  function navigateByDirection(viewer, slides, direction) {
    if (usesThumbnailNavigation(viewer)) {
      const currentIndex = getCurrentSlideIndex(viewer, slides);
      const nextIndex =
        direction === 'next'
          ? (currentIndex + 1) % slides.length
          : (currentIndex - 1 + slides.length) % slides.length;

      goToIndex(viewer, slides, nextIndex);
      return;
    }

    const navButton = viewer.querySelector(`button[name="${direction === 'next' ? 'next' : 'previous'}"]`);
    navButton?.click();
  }

  function initDrag(viewer, getSlidesRef, navigateRef, cleanup) {
    const dragSurface = viewer.querySelector('.nw-product-media__viewport');
    if (!dragSurface) return;

    const slides = getSlidesRef();
    if (slides.length < 2) return;

    const supportsPointerDrag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsPointerDrag) return;

    dragSurface.classList.add('nw-product-media__viewport--draggable');

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let isHorizontal = null;
    let didDrag = false;
    const threshold = 40;

    const isInteractiveTarget = (target) =>
      !!target.closest(
        'button, a, input, label, .deferred-media__poster, .nw-swiper-pagination, .nw-swiper-btn, .product__media-toggle'
      );

    const onPointerStart = (clientX, clientY) => {
      startX = clientX;
      startY = clientY;
      isDragging = true;
      isHorizontal = null;
      didDrag = false;
    };

    const onPointerEnd = (clientX, clientY) => {
      if (!isDragging) return;
      isDragging = false;
      dragSurface.classList.remove('is-dragging');

      if (isHorizontal !== true) return;

      const deltaX = clientX - startX;
      if (Math.abs(deltaX) < threshold) return;

      didDrag = true;
      navigateRef(deltaX < 0 ? 'next' : 'previous');
    };

    const onPointerDown = (event) => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) return;
      dragSurface.setPointerCapture(event.pointerId);
      onPointerStart(event.clientX, event.clientY);
    };

    const onPointerMove = (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (isHorizontal === null && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
        isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      }

      if (isHorizontal) {
        event.preventDefault();
        dragSurface.classList.add('is-dragging');
      }
    };

    const onPointerUp = (event) => {
      onPointerEnd(event.clientX, event.clientY);
      if (dragSurface.hasPointerCapture(event.pointerId)) {
        dragSurface.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerCancel = () => {
      isDragging = false;
      isHorizontal = null;
      dragSurface.classList.remove('is-dragging');
    };

    const onClickCapture = (event) => {
      if (!didDrag) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      didDrag = false;
    };

    dragSurface.addEventListener('pointerdown', onPointerDown);
    dragSurface.addEventListener('pointermove', onPointerMove);
    dragSurface.addEventListener('pointerup', onPointerUp);
    dragSurface.addEventListener('pointercancel', onPointerCancel);
    dragSurface.addEventListener('click', onClickCapture, true);

    cleanup.push(() => {
      dragSurface.removeEventListener('pointerdown', onPointerDown);
      dragSurface.removeEventListener('pointermove', onPointerMove);
      dragSurface.removeEventListener('pointerup', onPointerUp);
      dragSurface.removeEventListener('pointercancel', onPointerCancel);
      dragSurface.removeEventListener('click', onClickCapture, true);
      dragSurface.classList.remove('nw-product-media__viewport--draggable', 'is-dragging');
    });
  }

  function initViewer(viewer) {
    if (viewer.dataset.nwMediaInit === 'true') return;

    const slides = getSlides(viewer);
    if (slides.length < 2) return;

    viewer.dataset.nwMediaInit = 'true';
    const cleanup = [];

    viewer._nwMediaCleanup = () => {
      cleanup.forEach((fn) => fn());
      viewer._nwMediaCleanup = null;
      viewer.dataset.nwMediaInit = 'false';
    };

    const getSlidesForViewer = () => getSlides(viewer);
    const navigateForViewer = (direction) => navigateByDirection(viewer, getSlidesForViewer(), direction);

    initDrag(viewer, getSlidesForViewer, navigateForViewer, cleanup);

    const syncDots = () => updateDots(viewer, getCurrentSlideIndex(viewer, getSlides(viewer)));

    const onScroll =
      typeof debounce === 'function' ? debounce(syncDots, 100) : syncDots;

    viewer.querySelectorAll('.nw-swiper-btn--prev').forEach((button) => {
      const handler = (event) => {
        event.preventDefault();
        navigateByDirection(viewer, getSlides(viewer), 'previous');
      };
      button.addEventListener('click', handler);
      cleanup.push(() => button.removeEventListener('click', handler));
    });

    viewer.querySelectorAll('.nw-swiper-btn--next').forEach((button) => {
      const handler = (event) => {
        event.preventDefault();
        navigateByDirection(viewer, getSlides(viewer), 'next');
      };
      button.addEventListener('click', handler);
      cleanup.push(() => button.removeEventListener('click', handler));
    });

    viewer.querySelectorAll('.nw-swiper-pagination .swiper-pagination-bullet').forEach((dot) => {
      const onClick = () => {
        goToIndex(viewer, getSlides(viewer), parseInt(dot.dataset.index, 10));
      };

      const onKeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goToIndex(viewer, getSlides(viewer), parseInt(dot.dataset.index, 10));
        }
      };

      dot.addEventListener('click', onClick);
      dot.addEventListener('keydown', onKeydown);
      cleanup.push(() => {
        dot.removeEventListener('click', onClick);
        dot.removeEventListener('keydown', onKeydown);
      });
    });

    const slider = viewer.querySelector('[id^="Slider-Gallery"]');
    if (slider) {
      slider.addEventListener('scroll', onScroll);
      cleanup.push(() => slider.removeEventListener('scroll', onScroll));
    }

    const onSlideChanged = (event) => {
      const currentElement = event.detail?.currentElement;
      if (!currentElement) return;
      updateDots(viewer, getSlides(viewer).indexOf(currentElement));
    };

    viewer.addEventListener('slideChanged', onSlideChanged);
    cleanup.push(() => viewer.removeEventListener('slideChanged', onSlideChanged));

    const mediaGallery = viewer.closest('media-gallery');
    const thumbnails = mediaGallery?.querySelector('[id^="GalleryThumbnails"]');
    if (thumbnails) {
      thumbnails.querySelectorAll('[data-target]').forEach((thumb) => {
        const button = thumb.querySelector('button');
        if (!button) return;

        const handler = () => {
          window.setTimeout(syncDots, 50);
        };

        button.addEventListener('click', handler);
        cleanup.push(() => button.removeEventListener('click', handler));
      });
    }

    const observer = new MutationObserver(syncDots);

    getSlides(viewer).forEach((slide) => {
      observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
    });

    cleanup.push(() => observer.disconnect());
    syncDots();
  }

  class NwProductMedia extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      const viewer = this.closest('[id^="GalleryViewer"]');
      if (viewer) {
        initViewer(viewer);
      }
    }

    disconnectedCallback() {
      const viewer = this.closest('[id^="GalleryViewer"]');
      if (viewer && typeof viewer._nwMediaCleanup === 'function') {
        viewer._nwMediaCleanup();
      }

      this._initialized = false;
    }
  }

  customElements.define('nw-product-media', NwProductMedia);
}
