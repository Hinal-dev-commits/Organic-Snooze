(function () {
  function whenSwiperReady(callback) {
    if (typeof Swiper !== 'undefined') {
      callback();
    } else {
      window.setTimeout(function () {
        whenSwiperReady(callback);
      }, 50);
    }
  }

  function initInsightsSlider(root) {
    if (!root || root.dataset.nwInsightsInit === 'true') return;
    root.dataset.nwInsightsInit = 'true';

    whenSwiperReady(function () {
      var sliderEl = root.querySelector('[data-nw-insights-slider]');
      if (!sliderEl) return;
      if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

      var slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
      var enableAutoplay = root.dataset.enableAutoplay === 'true';
      var autoplayDelay = parseInt(root.dataset.autoplayDelay, 10) || 4000;
      var showDots = root.dataset.showDots === 'true';
      var showArrows = root.dataset.showArrows === 'true';

      var swiperOptions = {
        slidesPerView: 1,
        spaceBetween: 16,
        loop: slideCount > 1,
        speed: 500,
        grabCursor: true,
        autoHeight: true
      };

      if (enableAutoplay) {
        swiperOptions.autoplay = {
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        };
      }

      if (showDots) {
        swiperOptions.pagination = {
          el: root.querySelector('[data-nw-insights-pagination]'),
          clickable: true
        };
      }

      if (showArrows && slideCount > 1) {
        swiperOptions.navigation = {
          nextEl: root.querySelector('.nw-swiper-btn--next'),
          prevEl: root.querySelector('.nw-swiper-btn--prev')
        };
      }

      new Swiper(sliderEl, swiperOptions);
    });
  }

  function boot() {
    document
      .querySelectorAll('.nw-human-biologist__insights, .nw-natural-layers__insights')
      .forEach(initInsightsSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (e) {
    e.target
      .querySelectorAll('.nw-human-biologist__insights, .nw-natural-layers__insights')
      .forEach(function (root) {
        delete root.dataset.nwInsightsInit;
        initInsightsSlider(root);
      });
  });

  document.addEventListener('shopify:section:select', function () {
    document.querySelectorAll('[data-nw-insights-slider]').forEach(function (sliderEl) {
      if (sliderEl.swiper) sliderEl.swiper.update();
    });
  });
})();
