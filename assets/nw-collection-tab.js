if (!customElements.get('nw-collection-tab')) {
  class NwCollectionTab extends HTMLElement {
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

      if (this._onTabClick) {
        this.removeEventListener('click', this._onTabClick);
      }

      if (this._tablist && this._onTabKeydown) {
        this._tablist.removeEventListener('keydown', this._onTabKeydown);
      }

      this._tabsBound = false;
      this._tablist = null;
    }

    _whenSwiperReady(callback) {
      window.nwWhenSwiperReady(callback);
    }

    _initPanelSwiper(panel) {
      if (!panel || panel.hidden) return;
      var swiperEl = panel.querySelector('.nw-collection-tab__swiper');
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

    _setActiveTab(index, options) {
      var tabs = this.querySelectorAll('[data-nw-tab]');
      var panels = this.querySelectorAll('[data-nw-panel]');
      var shopAllBtn = this.querySelector('.nw-collection-tab__shop-all-btn');
      var activeTab = null;
      var focusTab = options && options.focus;

      tabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-nw-tab') === String(index);
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
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

      if (focusTab && activeTab) activeTab.focus();
    }

    _handleTabKeydown(event) {
      var tabs = Array.from(this.querySelectorAll('[data-nw-tab]'));
      if (!tabs.length) return;

      var current = event.target.closest('[data-nw-tab]');
      if (!current || !this.contains(current)) return;

      var currentIndex = tabs.indexOf(current);
      var nextIndex = -1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      this._setActiveTab(tabs[nextIndex].getAttribute('data-nw-tab'), { focus: true });
    }

    _bindTabs() {
      if (this._tabsBound) return;
      this._tabsBound = true;

      this._onTabClick = (event) => {
        var tab = event.target.closest('[data-nw-tab]');
        if (!tab || !this.contains(tab)) return;
        this._setActiveTab(tab.getAttribute('data-nw-tab'));
      };

      this._onTabKeydown = (event) => this._handleTabKeydown(event);
      this._tablist = this.querySelector('[role="tablist"]');

      this.addEventListener('click', this._onTabClick);
      if (this._tablist) {
        this._tablist.addEventListener('keydown', this._onTabKeydown);
      }
    }

    _initCountdown() {
      var countdownEl = this.querySelector('.nw-collection-tab__promo[data-countdown-date]');
      if (!countdownEl || typeof window.nwStartCountdown !== 'function') return;
      this._countdownInterval = window.nwStartCountdown(countdownEl, {
        days: '.nw-collection-tab-countdown-days',
        hours: '.nw-collection-tab-countdown-hours',
        mins: '.nw-collection-tab-countdown-mins'
      });
    }

    _boot() {
      this._whenSwiperReady(() => {
        var firstPanel = this.querySelector('[data-nw-panel]:not([hidden])');
        this._initPanelSwiper(firstPanel);
      });
    }
  }

  customElements.define('nw-collection-tab', NwCollectionTab);
}
