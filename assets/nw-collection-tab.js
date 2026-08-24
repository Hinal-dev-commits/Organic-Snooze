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
    }

    _whenSwiperReady(callback) {
      if (typeof Swiper !== 'undefined') {
        callback();
      } else {
        window.setTimeout(() => this._whenSwiperReady(callback), 50);
      }
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

    _setActiveTab(index) {
      var tabs = this.querySelectorAll('[data-nw-tab]');
      var panels = this.querySelectorAll('[data-nw-panel]');
      var shopAllBtn = this.querySelector('.nw-collection-tab__shop-all-btn');
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
      var countdownEl = this.querySelector('.nw-collection-tab__promo[data-countdown-date]');
      if (!countdownEl) return;

      var targetDateStr = countdownEl.getAttribute('data-countdown-date');
      var hideOnEnd = countdownEl.getAttribute('data-hide-on-end') === 'true';
      var daysEl = countdownEl.querySelector('.nw-collection-tab-countdown-days');
      var hoursEl = countdownEl.querySelector('.nw-collection-tab-countdown-hours');
      var minsEl = countdownEl.querySelector('.nw-collection-tab-countdown-mins');

      function padZero(num) {
        return num < 10 ? '0' + num : num;
      }

      if (!targetDateStr || targetDateStr.trim() === '') return;

      var targetDate = new Date(targetDateStr.replace(/-/g, '/')).getTime();

      var updateTimer = () => {
        var now = new Date().getTime();
        var diff = targetDate - now;
        if (isNaN(targetDate)) return;
        if (diff <= 0) {
          if (hideOnEnd) {
            countdownEl.style.display = 'none';
          } else {
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minsEl) minsEl.textContent = '00';
          }
          if (this._countdownInterval) {
            clearInterval(this._countdownInterval);
            this._countdownInterval = null;
          }
          return;
        }
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (daysEl) daysEl.textContent = padZero(days);
        if (hoursEl) hoursEl.textContent = padZero(hours);
        if (minsEl) minsEl.textContent = padZero(mins);
      };

      updateTimer();
      this._countdownInterval = setInterval(updateTimer, 1000);
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
