if (!customElements.get('nw-blog-banner')) {
  class NwBlogBanner extends HTMLElement {
    connectedCallback() {
      this._media = this.querySelector('.nw-blog-banner__media');
      this._layout = this.querySelector('.nw-blog-banner__layout');
      this._mobileMq = window.matchMedia('(max-width: 749px)');

      this._onResize = this._syncSectionHeight.bind(this);
      this._onBreakpointChange = this._syncSectionHeight.bind(this);

      this._syncSectionHeight();
      window.addEventListener('resize', this._onResize, { passive: true });
      this._mobileMq.addEventListener('change', this._onBreakpointChange);

      if (typeof ResizeObserver !== 'undefined' && this._layout) {
        this._resizeObserver = new ResizeObserver(this._onResize);
        this._resizeObserver.observe(this._layout);
      }

      if (window.Shopify && Shopify.designMode) {
        this._onSectionLoad = (event) => {
          if (event.target.contains(this)) {
            this._syncSectionHeight();
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

    _syncSectionHeight() {
      if (!this._media || !this._layout) return;

      if (!this._mobileMq.matches) {
        this.style.removeProperty('min-height');
        this._layout.style.removeProperty('top');
        return;
      }

      var mediaHeight = this._media.offsetHeight || 0;
      var layoutHeight = this._layout.offsetHeight || 0;
      var layoutTop = parseInt(getComputedStyle(this._layout).paddingTop, 10) || 0;
      var paddingBottom = parseInt(getComputedStyle(this).paddingBottom, 10) || 0;

      this._layout.style.top = mediaHeight + 'px';
      this.style.minHeight = mediaHeight + layoutHeight + layoutTop + paddingBottom + 'px';
    }
  }

  customElements.define('nw-blog-banner', NwBlogBanner);
}
