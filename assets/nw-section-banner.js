if (!customElements.get('nw-section-banner')) {
  class NwSectionBanner extends HTMLElement {
    connectedCallback() {
      this._layout = this.querySelector('.nw-section-banner__layout');
      this._panel = this.querySelector('.nw-section-banner__panel');
      this._mobileMq = window.matchMedia('(max-width: 749px)');

      this._onResize = this._syncLayout.bind(this);
      this._onBreakpointChange = this._syncLayout.bind(this);

      this._syncLayout();
      window.addEventListener('resize', this._onResize, { passive: true });
      this._mobileMq.addEventListener('change', this._onBreakpointChange);

      const resizeTarget = this._panel || this._layout;
      if (typeof ResizeObserver !== 'undefined' && resizeTarget) {
        this._resizeObserver = new ResizeObserver(this._onResize);
        this._resizeObserver.observe(resizeTarget);
      }

      if (window.Shopify && Shopify.designMode) {
        this._onSectionLoad = (event) => {
          if (event.target.contains(this)) {
            this._syncLayout();
          }
        };
        document.addEventListener('shopify:section:load', this._onSectionLoad);
      }
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);

      if (this._mobileMq) {
        this._mobileMq.removeEventListener('change', this._onBreakpointChange);
      }

      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }

      if (this._onSectionLoad) {
        document.removeEventListener('shopify:section:load', this._onSectionLoad);
      }
    }

    _syncLayout() {
      this._syncMobileContentHeight();
    }

    _syncMobileContentHeight() {
      if (!this._layout) return;

      if (window.matchMedia('(min-width: 750px)').matches) {
        this.style.removeProperty('--nw-section-banner-content');
        return;
      }

      if (
        this._layout.classList.contains('nw-section-banner__layout--top') ||
        this.classList.contains('nw-section-banner--mobile-top')
      ) {
        this.style.removeProperty('--nw-section-banner-content');
        return;
      }

      const height = Math.max(this._layout.offsetHeight + 120, 520);
      this.style.setProperty('--nw-section-banner-content', `${height}px`);
    }
  }

  customElements.define('nw-section-banner', NwSectionBanner);
}
