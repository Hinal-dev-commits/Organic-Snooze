if (!customElements.get('nw-product-bundle-tabs')) {
  customElements.define(
    'nw-product-bundle-tabs',
    class NwProductBundleTabs extends HTMLElement {
      connectedCallback() {
        if (this.dataset.bound === 'true') return;
        this.dataset.bound = 'true';

        this.tabs = Array.from(this.querySelectorAll('[data-bundle-tab]'));
        this.panels = Array.from(this.querySelectorAll('[data-bundle-panel]'));

        this.tabs.forEach((tab) => {
          tab.addEventListener('click', () => this.activate(tab.dataset.bundleTab));
          tab.addEventListener('keydown', (event) => this.onKeydown(event, tab));
        });
      }

      activate(tabId) {
        this.tabs.forEach((tab) => {
          const isActive = tab.dataset.bundleTab === tabId;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
          tab.tabIndex = isActive ? 0 : -1;
        });

        this.panels.forEach((panel, index) => {
          const isActive = String(index) === String(tabId);
          panel.classList.toggle('is-active', isActive);
          panel.hidden = !isActive;
        });
      }

      onKeydown(event, tab) {
        const currentIndex = this.tabs.indexOf(tab);
        if (currentIndex === -1) return;

        let nextIndex = null;

        if (event.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % this.tabs.length;
        } else if (event.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = this.tabs.length - 1;
        }

        if (nextIndex === null) return;

        event.preventDefault();
        const nextTab = this.tabs[nextIndex];
        nextTab.focus();
        this.activate(nextTab.dataset.bundleTab);
      }
    }
  );
}
