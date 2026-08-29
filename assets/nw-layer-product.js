(function () {
  function initLayerProduct(sectionEl) {
    if (!sectionEl) return;

    var sliderEl = sectionEl.querySelector('.nw-layer-product__swiper');
    if (!sliderEl) return;
    if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

    var hotspots = sectionEl.querySelectorAll('.nw-layer-product__hotspot');

    function setActiveIndex(index) {
      hotspots.forEach(function (pin, i) {
        pin.classList.toggle('is-active', i === index);
      });
    }

    var isAutoplay = sectionEl.getAttribute('data-autoplay') === 'true';
    var speedVal = parseInt(sectionEl.getAttribute('data-autoplay-speed'), 10) || 5;

    var prevBtn = sectionEl.querySelector('.nw-swiper-btn--prev');
    var nextBtn = sectionEl.querySelector('.nw-swiper-btn--next');
    var paginationEl = sectionEl.querySelector('.nw-swiper-pagination');

    var swiperConfig = {
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 400,
      grabCursor: true,
      watchOverflow: true,
      rewind: true,
      on: {
        init: function () {
          setActiveIndex(this.realIndex || 0);
        },
        slideChange: function () {
          setActiveIndex(this.realIndex || 0);
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

    if (prevBtn && nextBtn) {
      swiperConfig.navigation = {
        nextEl: nextBtn,
        prevEl: prevBtn
      };
    }

    if (paginationEl) {
      swiperConfig.pagination = {
        el: paginationEl,
        clickable: true,
        type: 'bullets'
      };
    }

    var swiperInstance = new Swiper(sliderEl, swiperConfig);

    hotspots.forEach(function (hotspot) {
      hotspot.addEventListener('click', function () {
        var targetIndex = parseInt(this.getAttribute('data-hotspot-index'), 10);
        if (!isNaN(targetIndex) && swiperInstance) {
          swiperInstance.slideTo(targetIndex);
        }
      });
    });

    if (window.Shopify && Shopify.designMode) {
      document.addEventListener('shopify:block:select', function (e) {
        if (e.target && e.target.closest('#' + sectionEl.id)) {
          var slideIndex = e.target.getAttribute('data-slide-index');
          if (slideIndex !== null && swiperInstance) {
            swiperInstance.slideTo(parseInt(slideIndex, 10));
          }
        }
      });
    }
  }

  function whenSwiperReady(callback) {
    window.nwWhenSwiperReady(callback);
  }

  function bootAll() {
    whenSwiperReady(function () {
      document.querySelectorAll('.nw-layer-product').forEach(initLayerProduct);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }

  window.addEventListener('load', bootAll);

  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (e) {
      var section = e.target.classList.contains('nw-layer-product') ? e.target : e.target.querySelector('.nw-layer-product');
      if (section) {
        whenSwiperReady(function () {
          initLayerProduct(section);
        });
      }
    });
  }
})();
