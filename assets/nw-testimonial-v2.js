if (!customElements.get('nw-testimonial-v2')) {
  class NwTestimonialV2 extends HTMLElement {
    connectedCallback() {
      this._swipers = {};
      this._onResize = this._handleResize.bind(this);
      window.addEventListener('resize', this._onResize);
      this._bindTabs();
      window.nwWhenSwiperReady(() => this._initSwipers());
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      this._destroySwipers();

      if (this._onTabClick) {
        this.removeEventListener('click', this._onTabClick);
      }

      if (this._tablist && this._onTabKeydown) {
        this._tablist.removeEventListener('keydown', this._onTabKeydown);
      }
    }

    _getSlidesDesktop() {
      var count = parseInt(this.dataset.slidesDesktop, 10);
      if (Number.isNaN(count) || count < 1) return 3;
      return Math.min(count, 3);
    }

    _bindTabs() {
      this._tablist = this.querySelector('[data-nw-tv2-tablist]');
      this._onTabClick = (event) => {
        var tabBtn = event.target.closest('[data-nw-tv2-tab]');
        if (!tabBtn || !this.contains(tabBtn)) return;
        event.preventDefault();
        this._setActiveTab(tabBtn.getAttribute('data-nw-tv2-tab'));
      };

      this.addEventListener('click', this._onTabClick);

      if (this._tablist) {
        this._onTabKeydown = (event) => {
          var tabs = Array.from(this.querySelectorAll('[data-nw-tv2-tab]'));
          var activeIndex = tabs.findIndex(function (tab) {
            return tab.getAttribute('aria-selected') === 'true';
          });
          if (activeIndex === -1) return;

          var nextIndex = activeIndex;
          if (event.key === 'ArrowRight') {
            nextIndex = (activeIndex + 1) % tabs.length;
          } else if (event.key === 'ArrowLeft') {
            nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
          } else if (event.key === 'Home') {
            nextIndex = 0;
          } else if (event.key === 'End') {
            nextIndex = tabs.length - 1;
          } else {
            return;
          }

          event.preventDefault();
          this._setActiveTab(tabs[nextIndex].getAttribute('data-nw-tv2-tab'), { focus: true });
        };

        this._tablist.addEventListener('keydown', this._onTabKeydown);
      }
    }

    _handleResize() {
      var self = this;
      Object.keys(this._swipers).forEach(function (key) {
        var swiper = self._swipers[key];
        if (!swiper) return;
        swiper.update();
        if (swiper.navigation) {
          swiper.navigation.update();
        }
      });
    }

    _initSwipers() {
      var self = this;
      this._destroySwipers();

      this.querySelectorAll('[data-nw-tv2-swiper]').forEach(function (sliderEl) {
        var panel = sliderEl.closest('[data-nw-tv2-panel]');
        if (!panel) return;

        var panelIndex = panel.getAttribute('data-nw-tv2-panel');
        var wrap = sliderEl.closest('.nw-testimonial-v2__panel-slider-wrap');
        var showArrows = self.dataset.showSliderArrows === 'true';
        var showPagination = self.dataset.showSliderPagination === 'true';
        var slidesDesktop = self._getSlidesDesktop();
        var prevBtn = wrap ? wrap.querySelector('.nw-swiper-btn--prev') : null;
        var nextBtn = wrap ? wrap.querySelector('.nw-swiper-btn--next') : null;
        var paginationEl = wrap ? wrap.querySelector('.nw-swiper-pagination') : null;

        var options = {
          slidesPerView: 1.1,
          spaceBetween: 12,
          watchOverflow: true,
          grabCursor: true,
          speed: 500,
          breakpoints: {
            750: {
              slidesPerView: Math.min(2, slidesDesktop),
              spaceBetween: 16
            },
            990: {
              slidesPerView: slidesDesktop,
              spaceBetween: 16
            }
          }
        };

        if (showArrows && prevBtn && nextBtn) {
          options.navigation = {
            prevEl: prevBtn,
            nextEl: nextBtn,
            disabledClass: 'swiper-button-disabled'
          };
        }

        if (showPagination && paginationEl) {
          options.pagination = {
            el: paginationEl,
            clickable: true
          };
        }

        self._swipers[panelIndex] = new Swiper(sliderEl, options);

        if (self._swipers[panelIndex].navigation) {
          self._swipers[panelIndex].navigation.update();
        }
      });
    }

    _destroySwipers() {
      var self = this;
      Object.keys(this._swipers).forEach(function (key) {
        if (self._swipers[key]) {
          self._swipers[key].destroy(true, true);
        }
      });
      this._swipers = {};
    }

    _setActiveTab(index, options) {
      var tabs = this.querySelectorAll('[data-nw-tv2-tab]');
      var panels = this.querySelectorAll('[data-nw-tv2-panel]');
      var activeTab = null;
      var self = this;

      tabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-nw-tv2-tab') === String(index);
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
        if (isActive) activeTab = tab;
      });

      panels.forEach(function (panel) {
        var isActive = panel.getAttribute('data-nw-tv2-panel') === String(index);
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      if (this._swipers[index]) {
        requestAnimationFrame(function () {
          if (!self._swipers[index]) return;
          self._swipers[index].update();
          if (self._swipers[index].navigation) {
            self._swipers[index].navigation.update();
          }
        });
      }

      if (options && options.focus && activeTab) {
        activeTab.focus();
      }
    }
  }

  customElements.define('nw-testimonial-v2', NwTestimonialV2);
}
