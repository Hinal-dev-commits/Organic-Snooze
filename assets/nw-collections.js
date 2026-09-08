if (!customElements.get('nw-collections')) {
  class NwCollections extends HTMLElement {
    connectedCallback() {
      this._mode = this.dataset.activeTabMode || 'page';
      this._bindTabs();

      const initialTab = this.dataset.initialTab;
      if (initialTab !== undefined && initialTab !== '') {
        this._setActiveTab(initialTab);
      }
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
      this._tablist = this.querySelector('[role="tablist"]');
      this._onTabClick = (event) => {
        const tabBtn = event.target.closest('[data-nw-collection-tab]');
        if (!tabBtn || !this.contains(tabBtn)) return;
        event.preventDefault();

        if (this._mode === 'page') {
          const collectionUrl = tabBtn.getAttribute('data-collection-url');
          if (collectionUrl) {
            window.location.assign(collectionUrl);
            return;
          }
        }

        const tabIndex = tabBtn.getAttribute('data-nw-collection-tab');
        this._setActiveTab(tabIndex);
      };
      this.addEventListener('click', this._onTabClick);

      if (this._tablist) {
        this._onTabKeydown = (event) => {
          const tabs = Array.from(this.querySelectorAll('[data-nw-collection-tab]'));
          const activeIndex = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
          if (activeIndex === -1) return;

          let nextIndex = activeIndex;
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
          const nextTab = tabs[nextIndex];
          const nextTabIndex = nextTab.getAttribute('data-nw-collection-tab');
          this._setActiveTab(nextTabIndex, { focus: true });
        };
        this._tablist.addEventListener('keydown', this._onTabKeydown);
      }
    }

    _setActiveTab(index, options) {
      const tabs = this.querySelectorAll('[data-nw-collection-tab]');
      const panels = this.querySelectorAll('[data-nw-collection-panel]');
      const actionBtn = this.querySelector('[data-nw-collection-action-btn]');
      let activeTab = null;

      tabs.forEach((tab) => {
        const isActive = tab.getAttribute('data-nw-collection-tab') === String(index);
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
        if (isActive) activeTab = tab;
      });

      panels.forEach((panel) => {
        const isActive = panel.getAttribute('data-nw-collection-panel') === String(index);
        panel.hidden = !isActive;
      });

      if (actionBtn && activeTab) {
        const collectionUrl = activeTab.getAttribute('data-collection-url');
        if (collectionUrl) {
          actionBtn.setAttribute('href', collectionUrl);
        }
      }

      if (options && options.focus && activeTab) {
        activeTab.focus();
      }
    }
  }

  customElements.define('nw-collections', NwCollections);
}
