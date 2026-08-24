if (!customElements.get('nw-collection-v2')) {
  class NwCollectionV2 extends HTMLElement {
    connectedCallback() {
      this._bindTabs();
      this._initCountdown();
      this._boot();
    }

    disconnectedCallback() {
      if (this._countdownInterval) {
        clearInterval(this._countdownInterval);
        this._countdownInterval = null;
      }
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _initPanelSwiper(panel) {
      if (!panel || panel.hidden) return;
      var swiperEl = panel.querySelector('.nw-collection-v2__swiper');
      if (!swiperEl || swiperEl.dataset.initialized === 'true') return;

      var panelIndex = panel.getAttribute('data-nw-panel');
      var paginationEl = this.querySelector('[data-nw-panel-pagination="' + panelIndex + '"]');
      var showArrows = this.dataset.showArrows === 'true';
      var showPagination = this.dataset.showPagination === 'true';

      var options = {
        slidesPerView: 'auto',
        spaceBetween: 16,
        watchOverflow: true,
        breakpoints: {
          750: {
            spaceBetween: 16
          }
        }
      };

      if (showArrows) {
        options.navigation = {
          nextEl: panel.querySelector('.nw-swiper-btn--next'),
          prevEl: panel.querySelector('.nw-swiper-btn--prev')
        };
      }

      if (showPagination && paginationEl) {
        options.pagination = {
          el: paginationEl,
          clickable: true
        };
      }

      new Swiper(swiperEl, options);
      swiperEl.dataset.initialized = 'true';
    }

    _setActiveTab(index) {
      var tabs = this.querySelectorAll('[data-nw-tab]');
      var panels = this.querySelectorAll('[data-nw-panel]');
      var shopAllBtn = this.querySelector('.nw-collection-v2__shop-all-btn');
      var activeTab = null;

      tabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-nw-tab') === String(index);
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) activeTab = tab;
      });

      panels.forEach((panel) => {
        var isActive = panel.getAttribute('data-nw-panel') === String(index);
        panel.hidden = !isActive;
        if (isActive) this._initPanelSwiper(panel);
      });

      if (shopAllBtn && activeTab) {
        var collectionUrl = activeTab.getAttribute('data-collection-url');
        if (collectionUrl) shopAllBtn.setAttribute('href', collectionUrl);
      }
    }

    _bindTabs() {
      this.querySelectorAll('[data-nw-tab]').forEach((tab) => {
        tab.addEventListener('click', () => {
          this._setActiveTab(tab.getAttribute('data-nw-tab'));
        });
      });
    }

    _initCountdown() {
      var countdownEl = this.querySelector('.nw-collection-v2__promo[data-countdown-date]');
      if (!countdownEl || typeof window.nwStartCountdown !== 'function') return;
      this._countdownInterval = window.nwStartCountdown(countdownEl, {
        days: '.nw-colv2-countdown-days',
        hours: '.nw-colv2-countdown-hours',
        mins: '.nw-colv2-countdown-mins'
      });
    }

    _boot() {
      this._whenSwiperReady(() => {
        var firstPanel = this.querySelector('[data-nw-panel]:not([hidden])');
        this._initPanelSwiper(firstPanel);
      });
    }
  }

  customElements.define('nw-collection-v2', NwCollectionV2);
}
