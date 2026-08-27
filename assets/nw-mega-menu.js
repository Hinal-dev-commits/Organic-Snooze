if (!customElements.get('nw-mega-menu-slider')) {
  class NwMegaMenuSlider extends HTMLElement {
    connectedCallback() {
      this._initSlider();
    }

    disconnectedCallback() {
      var sliderEl = this.querySelector('[data-nw-mega-slider]');
      if (sliderEl && sliderEl.swiper) {
        sliderEl.swiper.destroy(true, true);
      }
    }

    _initSlider() {
      if (typeof window.nwWhenSwiperReady !== 'function') return;

      window.nwWhenSwiperReady(() => {
        var sliderEl = this.querySelector('[data-nw-mega-slider]');
        if (!sliderEl || sliderEl.dataset.initialized === 'true') return;

        var controls = this.querySelector('[data-nw-mega-slider-controls]');
        var paginationEl = this.querySelector('[data-nw-mega-pagination]');
        var slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
        var needsControls = slideCount > 3.8;

        if (controls) {
          controls.hidden = !needsControls;
        }

        var options = {
          slidesPerView: 3.8,
          spaceBetween: 16,
          speed: 550,
          grabCursor: true,
          watchOverflow: true,
          observer: true,
          observeParents: true,
          breakpoints: {
            1200: {
              spaceBetween: 20
            },
            1400: {
              spaceBetween: 24
            }
          }
        };

        if (needsControls) {
          options.navigation = {
            nextEl: this.querySelector('.nw-swiper-btn--next'),
            prevEl: this.querySelector('.nw-swiper-btn--prev')
          };

          if (paginationEl) {
            options.pagination = {
              el: paginationEl,
              clickable: true
            };
          }
        }

        var swiper = new Swiper(sliderEl, options);
        sliderEl.dataset.initialized = 'true';
        this.swiperInstance = swiper;

        var updateControls = () => {
          if (!controls) return;
          controls.hidden = swiper.isLocked;
        };

        updateControls();
        swiper.on('resize', updateControls);
        swiper.on('breakpoint', updateControls);
        swiper.on('slidesLengthChange', updateControls);
      });
    }
  }

  customElements.define('nw-mega-menu-slider', NwMegaMenuSlider);
}

if (!customElements.get('nw-mega-menu-item')) {
  class NwMegaMenuItem extends HTMLElement {
    static DESKTOP_BREAKPOINT = '(min-width: 990px)';

    constructor() {
      super();
      this._closeTimer = null;
      this._openTimer = null;
      this._documentListenersBound = false;
    }

    connectedCallback() {
      this.trigger = this.querySelector('[data-nw-mega-trigger]');
      this.panel = this.querySelector('[data-nw-mega-panel]');
      this.tabs = this.querySelectorAll('[data-nw-mega-tab]');
      this.tabPanels = this.querySelectorAll('[data-nw-mega-tab-panel]');

      this._bindEvents();
      this._initActiveSlider();
    }

    disconnectedCallback() {
      this._clearTimers();
      this._unbindEvents();
    }

    _isDesktop() {
      return window.matchMedia(NwMegaMenuItem.DESKTOP_BREAKPOINT).matches;
    }

    _clearTimers() {
      if (this._closeTimer) {
        window.clearTimeout(this._closeTimer);
        this._closeTimer = null;
      }
      if (this._openTimer) {
        window.clearTimeout(this._openTimer);
        this._openTimer = null;
      }
    }

    _isHovered() {
      return Boolean(this.trigger?.matches(':hover') || this.panel?.matches(':hover'));
    }

    _keepOpen() {
      this._clearTimers();
      if (!this.classList.contains('is-open')) {
        this.open();
      }
    }

    _bindEvents() {
      this._onTriggerMouseEnter = () => this._scheduleOpen();
      this._onZoneMouseLeave = () => this._scheduleCloseHover();
      this._onFocusIn = () => this._keepOpen();
      this._onTabClick = (event) => {
        var tab = event.target.closest('[data-nw-mega-tab]');
        if (!tab || !this.contains(tab)) return;
        event.preventDefault();
        this._keepOpen();
        this._setActiveTab(tab.getAttribute('data-nw-mega-tab'));
      };
      this._onTabKeydown = (event) => this._handleTabKeydown(event);
      this._onTriggerClick = (event) => {
        if (!this._isDesktop() || !this.classList.contains('is-open')) return;
        event.preventDefault();
      };
      this._onPanelPointerDown = () => this._keepOpen();
      this._onDocumentPointerDown = (event) => {
        if (!this.classList.contains('is-open')) return;
        if (this.contains(event.target)) return;
        this.close();
      };
      this._onDocumentKeyDown = (event) => {
        if (!this.classList.contains('is-open')) return;
        if (event.key !== 'Escape') return;
        this.close();
        this.trigger?.focus();
      };

      if (this.trigger) {
        this.trigger.addEventListener('mouseenter', this._onTriggerMouseEnter);
        this.trigger.addEventListener('mouseleave', this._onZoneMouseLeave);
        this.trigger.addEventListener('click', this._onTriggerClick);
      }

      if (this.panel) {
        this.panel.addEventListener('mouseenter', this._onPanelPointerDown);
        this.panel.addEventListener('mouseleave', this._onZoneMouseLeave);
        this.panel.addEventListener('mousedown', this._onPanelPointerDown, true);
        this.panel.addEventListener('click', this._onPanelPointerDown, true);
        this.panel.addEventListener('pointerdown', this._onPanelPointerDown, true);
      }

      this.addEventListener('focusin', this._onFocusIn);
      this.addEventListener('click', this._onTabClick);

      if (this.tabs.length) {
        this._tablist = this.querySelector('[role="tablist"]');
        if (this._tablist) {
          this._tablist.addEventListener('keydown', this._onTabKeydown);
        }
      }
    }

    _bindDocumentListeners() {
      if (this._documentListenersBound) return;
      this._documentListenersBound = true;
      document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
      document.addEventListener('keydown', this._onDocumentKeyDown);
    }

    _unbindDocumentListeners() {
      if (!this._documentListenersBound) return;
      this._documentListenersBound = false;
      document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
      document.removeEventListener('keydown', this._onDocumentKeyDown);
    }

    _unbindEvents() {
      if (this.trigger) {
        this.trigger.removeEventListener('mouseenter', this._onTriggerMouseEnter);
        this.trigger.removeEventListener('mouseleave', this._onZoneMouseLeave);
        this.trigger.removeEventListener('click', this._onTriggerClick);
      }

      if (this.panel) {
        this.panel.removeEventListener('mouseenter', this._onPanelPointerDown);
        this.panel.removeEventListener('mouseleave', this._onZoneMouseLeave);
        this.panel.removeEventListener('mousedown', this._onPanelPointerDown, true);
        this.panel.removeEventListener('click', this._onPanelPointerDown, true);
        this.panel.removeEventListener('pointerdown', this._onPanelPointerDown, true);
      }

      this.removeEventListener('focusin', this._onFocusIn);
      this.removeEventListener('click', this._onTabClick);

      if (this._tablist) {
        this._tablist.removeEventListener('keydown', this._onTabKeydown);
      }

      this._unbindDocumentListeners();
    }

    _scheduleOpen() {
      if (!this._isDesktop()) return;
      this._clearTimers();
      this._openTimer = window.setTimeout(() => this.open(), 80);
    }

    _scheduleCloseHover() {
      if (!this._isDesktop()) return;
      this._clearTimers();
      this._closeTimer = window.setTimeout(() => {
        if (this._isHovered()) return;
        this.close();
      }, 200);
    }

    open() {
      if (!this.panel || !this._isDesktop()) return;

      document.querySelectorAll('header-menu').forEach((menu) => {
        if (typeof menu.close === 'function') menu.close();
      });

      document.querySelectorAll('nw-mega-menu-item.is-open').forEach((item) => {
        if (item !== this) item.close(true);
      });

      this.classList.add('is-open');
      this.panel.hidden = false;

      if (this.trigger) {
        this.trigger.setAttribute('aria-expanded', 'true');
      }

      this._setHeaderMegaOpen(true);
      this._bindDocumentListeners();
      this._initActiveSlider();
    }

    close(skipHeaderUpdate) {
      if (!this.panel) return;

      this._clearTimers();
      this.classList.remove('is-open');
      this.panel.hidden = true;

      if (this.trigger) {
        this.trigger.setAttribute('aria-expanded', 'false');
      }

      this._unbindDocumentListeners();

      if (!skipHeaderUpdate) {
        this._syncHeaderMegaOpenState();
      }
    }

    _setHeaderMegaOpen(enabled) {
      var headerWrapper = document.querySelector('.header-wrapper');
      if (!headerWrapper) return;
      headerWrapper.classList.toggle('nw-header-mega-open', enabled);
    }

    _syncHeaderMegaOpenState() {
      var hasOpenMega = Boolean(document.querySelector('nw-mega-menu-item.is-open'));
      this._setHeaderMegaOpen(hasOpenMega);

      if (!hasOpenMega) {
        document.dispatchEvent(new CustomEvent('nw:mega-menu-close'));
      }
    }

    _setActiveTab(index) {
      this.tabs.forEach((tab) => {
        var isActive = tab.getAttribute('data-nw-mega-tab') === String(index);
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      this.tabPanels.forEach((panel) => {
        var isActive = panel.getAttribute('data-nw-mega-tab-panel') === String(index);
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });

      window.requestAnimationFrame(() => this._initActiveSlider());
    }

    _handleTabKeydown(event) {
      var tabs = Array.from(this.querySelectorAll('[data-nw-mega-tab]'));
      if (!tabs.length) return;

      var current = event.target.closest('[data-nw-mega-tab]');
      if (!current || !this.contains(current)) return;

      var currentIndex = tabs.indexOf(current);
      var nextIndex = -1;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
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
      var nextTab = tabs[nextIndex];
      this._keepOpen();
      this._setActiveTab(nextTab.getAttribute('data-nw-mega-tab'));
      nextTab.focus();
    }

    _initActiveSlider() {
      var activePanel = this.querySelector('.nw-mega-menu__tab-panel.is-active nw-mega-menu-slider');
      if (!activePanel) return;

      if (typeof activePanel._initSlider === 'function') {
        activePanel._initSlider();
      }

      if (activePanel.swiperInstance) {
        activePanel.swiperInstance.update();
      }
    }
  }

  customElements.define('nw-mega-menu-item', NwMegaMenuItem);
}

(function () {
  function closeAllMegaMenus() {
    document.querySelectorAll('nw-mega-menu-item.is-open').forEach(function (item) {
      if (typeof item.close === 'function') {
        item.close();
      }
    });
  }

  document.addEventListener('nw:mega-menu-close', function () {
    if (typeof window.requestAnimationFrame !== 'function') return;
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event('scroll'));
    });
  });

  document.addEventListener(
    'toggle',
    function (event) {
      if (!(event.target instanceof HTMLDetailsElement)) return;
      if (!event.target.closest('header-menu')) return;
      if (!event.target.open) return;
      closeAllMegaMenus();
    },
    true
  );
})();
