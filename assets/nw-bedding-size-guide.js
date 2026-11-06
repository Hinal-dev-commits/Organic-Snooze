(function () {
  const MODAL_SELECTOR = 'modal-dialog.nw-bedding-size-guide';
  const SIZE_SLUGS = {
    twin: 'twin',
    'twin xl': 'twin-xl',
    full: 'full',
    queen: 'queen',
    king: 'king',
    'cal king': 'cal-king',
    'california king': 'cal-king',
    'california  king': 'cal-king',
  };

  function normalizeSizeLabel(label) {
    return (label || '').trim().toLowerCase();
  }

  function slugFromVariantLabel(label) {
    const normalized = normalizeSizeLabel(label);
    if (SIZE_SLUGS[normalized]) return SIZE_SLUGS[normalized];
    if (normalized.includes('cal') && normalized.includes('king')) return 'cal-king';
    if (normalized.includes('twin') && normalized.includes('xl')) return 'twin-xl';
    return null;
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 749px)').matches;
  }

  /** Keep the active tab fully inside the horizontal tab strip on mobile. */
  function scrollActiveTabIntoView(tabsContainer, activeTab) {
    if (!tabsContainer || !activeTab || !isMobileViewport()) return;

    const tabs = tabsContainer.querySelectorAll('[data-bedding-size-tab]');
    const tabIndex = Array.prototype.indexOf.call(tabs, activeTab);
    const edgeInset = 4;
    const maxScroll = Math.max(0, tabsContainer.scrollWidth - tabsContainer.clientWidth);
    const containerRect = tabsContainer.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const leftGap = tabRect.left - (containerRect.left + edgeInset);
    const rightGap = containerRect.right - edgeInset - tabRect.right;

    let targetScroll = tabsContainer.scrollLeft;

    if (leftGap < 0) {
      targetScroll += leftGap;
    } else if (rightGap < 0) {
      targetScroll -= rightGap;
    } else if (tabIndex === 0 && tabsContainer.scrollLeft > 0) {
      targetScroll = 0;
    } else if (tabIndex === tabs.length - 1 && tabsContainer.scrollLeft < maxScroll) {
      targetScroll = maxScroll;
    } else {
      return;
    }

    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

    if (Math.abs(targetScroll - tabsContainer.scrollLeft) < 1) return;

    tabsContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }

  const SET_SLIDER_SPACE = 12;
  const visualDimensionObservers = new WeakMap();

  const VISUAL_SCALE = {
    flat: { refIn: 92, refPx: 78 },
    fitted: { refIn: 60, refPx: 63 },
    sham: { refIn: 32, pairPx: 120.8, shamPx: 108.8 },
  };

  function parseFirstInches(value) {
    const match = (value || '').match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  }

  function parseSecondInches(value) {
    const parts = (value || '').split(/\s*[×x]\s*/);
    if (parts.length < 2) return null;
    return parseFirstInches(parts[1]);
  }

  function scaleVisualBody(body) {
    if (!body) return;

    const dimText = body.dataset.beddingDimensions || '';
    const kind = body.dataset.beddingVisualKind;
    const firstIn = parseFirstInches(dimText);
    const secondIn = parseSecondInches(dimText);

    if (kind === 'flat' && firstIn) {
      const px = Math.round(VISUAL_SCALE.flat.refPx * (firstIn / VISUAL_SCALE.flat.refIn));
      body.style.width = `${px}px`;
      return;
    }

    if (kind === 'fitted' && firstIn) {
      const px = Math.round(VISUAL_SCALE.fitted.refPx * (firstIn / VISUAL_SCALE.fitted.refIn));
      body.style.width = `${px}px`;
      return;
    }

    if (kind === 'sham' && secondIn) {
      const pairPx = Math.round(VISUAL_SCALE.sham.pairPx * (secondIn / VISUAL_SCALE.sham.refIn));
      const shamPx = Math.round(VISUAL_SCALE.sham.shamPx * (secondIn / VISUAL_SCALE.sham.refIn));
      body.style.width = `${pairPx}px`;
      body.querySelectorAll('.nw-bedding-size-guide__sham').forEach((sham) => {
        sham.style.width = `${shamPx}px`;
      });
    }
  }

  function scaleSetItemVisuals(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.nw-bedding-size-guide__visual-body').forEach(scaleVisualBody);
  }

  function bindVisualDimensionSync(modal) {
    if (!modal) return;

    if (visualDimensionObservers.has(modal)) {
      scaleSetItemVisuals(modal);
      return;
    }

    const observer = new ResizeObserver(() => {
      scaleSetItemVisuals(modal);
    });

    modal.querySelectorAll('.nw-bedding-size-guide__set-item, .nw-bedding-size-guide__visual-body').forEach((node) => {
      observer.observe(node);
    });

    visualDimensionObservers.set(modal, observer);
    scaleSetItemVisuals(modal);
  }

  function destroySetSliderInWrapper(wrapper) {
    if (!wrapper) return;
    const sliderEl = wrapper.querySelector('[data-bedding-set-swiper]');
    if (sliderEl && sliderEl.swiper) {
      sliderEl.swiper.destroy(true, true);
    }
    delete wrapper.dataset.beddingSetSliderInit;
  }

  function bindSetSliderResize(modal) {
    if (modal.dataset.nwBeddingSetSliderResizeBound === 'true') return;
    modal.dataset.nwBeddingSetSliderResizeBound = 'true';

    window.matchMedia('(max-width: 749px)').addEventListener('change', () => {
      modal.querySelectorAll('[data-bedding-set-slider]').forEach((wrapper) => {
        destroySetSliderInWrapper(wrapper);
      });
      initSetSliderInPanel(modal.querySelector('[data-bedding-size-panel].is-active'));
    });
  }

  function initSetSliderInPanel(panel) {
    if (!panel) return;

    const wrapper = panel.querySelector('[data-bedding-set-slider]');
    if (!wrapper) return;

    if (!isMobileViewport()) {
      destroySetSliderInWrapper(wrapper);
      return;
    }

    const mountSwiper = () => {
      const sliderEl = wrapper.querySelector('[data-bedding-set-swiper]');
      const paginationEl = wrapper.querySelector('[data-bedding-set-pagination]');
      if (!sliderEl || !paginationEl || typeof Swiper === 'undefined') return;

      const slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
      if (slideCount < 1) return;

      if (sliderEl.swiper) {
        sliderEl.swiper.params.spaceBetween = SET_SLIDER_SPACE;
        sliderEl.swiper.update();
        sliderEl.swiper.slideTo(0, 0);
        const panel = wrapper.closest('[data-bedding-size-panel]');
        if (panel) scaleSetItemVisuals(panel);
        return;
      }

      if (wrapper.dataset.beddingSetSliderInit === 'true') return;

      const panel = wrapper.closest('[data-bedding-size-panel]');
      const swiper = new Swiper(sliderEl, {
        slidesPerView: 1,
        spaceBetween: SET_SLIDER_SPACE,
        speed: 500,
        grabCursor: true,
        watchOverflow: true,
        autoHeight: true,
        pagination: {
          el: paginationEl,
          clickable: true,
        },
      });

      swiper.on('slideChange', () => {
        if (panel) scaleSetItemVisuals(panel);
      });

      wrapper.dataset.beddingSetSliderInit = 'true';
      if (panel) scaleSetItemVisuals(panel);
    };

    const queueInit = () => {
      if (typeof window.nwWhenSwiperReady === 'function') {
        window.nwWhenSwiperReady(mountSwiper);
      } else {
        mountSwiper();
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(queueInit);
    });
  }

  function activateTab(modal, slug) {
    if (!modal || !slug) return;

    const tabs = modal.querySelectorAll('[data-bedding-size-tab]');
    const panels = modal.querySelectorAll('[data-bedding-size-panel]');
    let matched = false;

    tabs.forEach((tab) => {
      const isActive = tab.dataset.beddingSizeTab === slug;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive) matched = true;
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.beddingSizePanel === slug;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    if (!matched && tabs.length) {
      const fallback = tabs[0].dataset.beddingSizeTab;
      if (fallback) activateTab(modal, fallback);
      return;
    }

    initSetSliderInPanel(modal.querySelector('[data-bedding-size-panel].is-active'));
    bindVisualDimensionSync(modal);

    const tabsContainer = modal.querySelector('.nw-bedding-size-guide__tabs');
    const activeTab = modal.querySelector('[data-bedding-size-tab].is-active');
    if (!tabsContainer || !activeTab) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollActiveTabIntoView(tabsContainer, activeTab);
      });
    });
  }

  function tabSlugForVariantValue(modal, variantValue) {
    const normalized = normalizeSizeLabel(variantValue);
    if (!normalized) return null;

    const tabs = modal.querySelectorAll('[data-bedding-size-tab]');
    for (const tab of tabs) {
      const tabValue = tab.dataset.beddingSizeValue;
      if (tabValue && normalizeSizeLabel(tabValue) === normalized) {
        return tab.dataset.beddingSizeTab;
      }
    }

    return slugFromVariantLabel(variantValue);
  }

  function syncFromVariantPicker(modal) {
    const sectionRoot = modal.closest('.shopify-section') || document;
    const fieldset = sectionRoot.querySelector('[data-bedding-size-option]');
    if (!fieldset) return;

    const checked = fieldset.querySelector('input[type="radio"]:checked');
    const firstTab = modal.querySelector('[data-bedding-size-tab]');
    const slug = checked
      ? tabSlugForVariantValue(modal, checked.value) || slugFromVariantLabel(checked.value)
      : null;
    activateTab(modal, slug || (firstTab && firstTab.dataset.beddingSizeTab));
  }

  function initModal(modal) {
    if (modal.dataset.nwBeddingGuideInit === 'true') return;
    modal.dataset.nwBeddingGuideInit = 'true';

    const sectionRoot = modal.closest('.shopify-section') || document;
    const beddingFieldset = sectionRoot.querySelector('[data-bedding-size-option]');
    if (beddingFieldset && !beddingFieldset.dataset.nwBeddingGuideSyncBound) {
      beddingFieldset.dataset.nwBeddingGuideSyncBound = 'true';
      beddingFieldset.addEventListener('change', () => {
        if (modal.hasAttribute('open')) {
          syncFromVariantPicker(modal);
        }
      });
    }

    modal.querySelectorAll('[data-bedding-size-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        activateTab(modal, tab.dataset.beddingSizeTab);
      });
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activateTab(modal, tab.dataset.beddingSizeTab);
      });
    });

    bindSetSliderResize(modal);
    bindVisualDimensionSync(modal);

    const initial = modal.querySelector('[data-bedding-size-tab].is-active') || modal.querySelector('[data-bedding-size-tab]');
    if (initial) {
      activateTab(modal, initial.dataset.beddingSizeTab);
    }
  }

  function handleOpenerClick(event) {
    const button = event.target.closest('modal-opener[data-modal] button');
    if (!button) return;

    const opener = button.closest('modal-opener[data-modal]');
    if (!opener) return;

    const modalSelector = opener.getAttribute('data-modal');
    if (!modalSelector || !modalSelector.includes('NwBeddingSizePopupModal')) return;

    const modal = document.querySelector(modalSelector);
    if (!modal) return;

    initModal(modal);
    syncFromVariantPicker(modal);
    requestAnimationFrame(() => {
      scaleSetItemVisuals(modal);
    });
  }

  document.addEventListener('click', handleOpenerClick, true);

  document.querySelectorAll(MODAL_SELECTOR).forEach((modal) => {
    initModal(modal);
  });
})();
