(function () {
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

  function initViewer(viewer) {
    if (viewer.dataset.nwMediaInit === 'true') return;
    viewer.dataset.nwMediaInit = 'true';

    const slides = getSlides(viewer);
    if (slides.length < 2) return;

    const syncDots = () => updateDots(viewer, getCurrentSlideIndex(viewer, getSlides(viewer)));

    const onScroll =
      typeof debounce === 'function' ? debounce(syncDots, 100) : syncDots;

    viewer.querySelectorAll('.nw-swiper-btn--prev').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        navigateByDirection(viewer, getSlides(viewer), 'previous');
      });
    });

    viewer.querySelectorAll('.nw-swiper-btn--next').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        navigateByDirection(viewer, getSlides(viewer), 'next');
      });
    });

    viewer.querySelectorAll('.nw-swiper-pagination .swiper-pagination-bullet').forEach((dot) => {
      dot.addEventListener('click', () => {
        goToIndex(viewer, getSlides(viewer), parseInt(dot.dataset.index, 10));
      });

      dot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goToIndex(viewer, getSlides(viewer), parseInt(dot.dataset.index, 10));
        }
      });
    });

    const slider = viewer.querySelector('[id^="Slider-Gallery"]');
    if (slider) {
      slider.addEventListener('scroll', onScroll);
    }

    viewer.addEventListener('slideChanged', (event) => {
      const currentElement = event.detail?.currentElement;
      if (!currentElement) return;
      updateDots(viewer, getSlides(viewer).indexOf(currentElement));
    });

    const mediaGallery = viewer.closest('media-gallery');
    const thumbnails = mediaGallery?.querySelector('[id^="GalleryThumbnails"]');
    if (thumbnails) {
      thumbnails.querySelectorAll('[data-target]').forEach((thumb) => {
        thumb.querySelector('button')?.addEventListener('click', () => {
          window.setTimeout(syncDots, 50);
        });
      });
    }

    const observer = new MutationObserver(syncDots);

    getSlides(viewer).forEach((slide) => {
      observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
    });

    syncDots();
  }

  function initAll() {
    document.querySelectorAll('.nw-product-media--custom-controls').forEach(initViewer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', initAll);
})();
