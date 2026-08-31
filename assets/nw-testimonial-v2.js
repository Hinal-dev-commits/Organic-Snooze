if (!customElements.get('nw-testimonial-v2')) {
  class NwTestimonialV2 extends HTMLElement {
    connectedCallback() {
      this._bindTabs();
    }

    disconnectedCallback() {
      if (this._onTabClick) {
        this.removeEventListener('click', this._onTabClick);
      }

      if (this._tablist && this._onTabKeydown) {
        this._tablist.removeEventListener('keydown', this._onTabKeydown);
      }
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

    _setActiveTab(index, options) {
      var tabs = this.querySelectorAll('[data-nw-tv2-tab]');
      var panels = this.querySelectorAll('[data-nw-tv2-panel]');
      var activeTab = null;

      tabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-nw-tv2-tab') === String(index);
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
        if (isActive) activeTab = tab;
      });

      panels.forEach(function (panel) {
        var isActive = panel.getAttribute('data-nw-tv2-panel') === String(index);
        panel.hidden = !isActive;
      });

      if (options && options.focus && activeTab) {
        activeTab.focus();
      }
    }
  }

  customElements.define('nw-testimonial-v2', NwTestimonialV2);
}
