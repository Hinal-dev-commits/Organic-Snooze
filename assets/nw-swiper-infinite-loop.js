(function () {
  function getSpaceBetween(swiperOrOptions, sliderEl) {
    if (swiperOrOptions && swiperOrOptions.params && typeof swiperOrOptions.params.spaceBetween === 'number') {
      return swiperOrOptions.params.spaceBetween;
    }
    if (sliderEl && sliderEl.swiper && typeof sliderEl.swiper.params.spaceBetween === 'number') {
      return sliderEl.swiper.params.spaceBetween;
    }
    return 20;
  }

  function computeLoopBuffer(sliderEl, slideCount, spaceBetween) {
    var minBuffer = Math.max(slideCount * 2, 8);
    if (!sliderEl || slideCount <= 1) return minBuffer;

    var sliderWidth = sliderEl.clientWidth;
    var slideEl = sliderEl.querySelector('.swiper-slide:not(.swiper-slide-duplicate)');
    if (!sliderWidth || !slideEl) return minBuffer;

    var slideWidth = slideEl.getBoundingClientRect().width;
    if (!slideWidth) return minBuffer;

    var gap = typeof spaceBetween === 'number' ? spaceBetween : 20;
    var visible = Math.max(1, Math.ceil(sliderWidth / (slideWidth + gap)));
    return Math.max(minBuffer, visible + slideCount + 2, slideCount * 2);
  }

  function applyForwardLoop(swiperOptions, sliderEl, slideCount, wantInfinite, spaceBetween) {
    swiperOptions.loop = false;
    swiperOptions.rewind = false;

    if (!wantInfinite || slideCount <= 1) {
      return false;
    }

    var buffer = computeLoopBuffer(sliderEl, slideCount, spaceBetween);
    swiperOptions.loop = true;
    swiperOptions.loopedSlides = slideCount;
    swiperOptions.loopAdditionalSlides = buffer;
    swiperOptions.loopPreventsSliding = false;
    return true;
  }

  function refreshLoop(swiper, sliderEl, slideCount, spaceBetween) {
    if (!swiper || swiper.destroyed || !swiper.params || !swiper.params.loop) return;

    var gap = getSpaceBetween(swiper, sliderEl);
    if (typeof spaceBetween === 'number') gap = spaceBetween;

    var buffer = computeLoopBuffer(sliderEl, slideCount, gap);
    var needsRebuild =
      swiper.params.loopedSlides !== slideCount || swiper.params.loopAdditionalSlides !== buffer;

    if (needsRebuild) {
      swiper.params.loopedSlides = slideCount;
      swiper.params.loopAdditionalSlides = buffer;
      if (typeof swiper.loopDestroy === 'function') swiper.loopDestroy();
      if (typeof swiper.loopCreate === 'function') swiper.loopCreate();
    }

    swiper.update();
  }

  function finalizeLoopSlider(swiper, sliderEl, slideCount, spaceBetween, after) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (!swiper || swiper.destroyed) return;

        if (swiper.params.loop) {
          refreshLoop(swiper, sliderEl, slideCount, spaceBetween);
          swiper.slideToLoop(0, 0, false);
        } else {
          swiper.update();
          swiper.slideTo(0, 0, false);
        }

        if (typeof after === 'function') after();
      });
    });
  }

  function goNext(swiper) {
    if (!swiper || swiper.destroyed) return;
    swiper.slideNext();
  }

  function goPrev(swiper) {
    if (!swiper || swiper.destroyed) return;
    swiper.slidePrev();
  }

  window.nwSwiperInfiniteLoop = {
    computeLoopBuffer: computeLoopBuffer,
    applyForwardLoop: applyForwardLoop,
    refreshLoop: refreshLoop,
    finalizeLoopSlider: finalizeLoopSlider,
    goNext: goNext,
    goPrev: goPrev,
    getSpaceBetween: getSpaceBetween
  };
})();
