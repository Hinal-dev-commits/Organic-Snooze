if (!customElements.get('nw-section-banner')) {
  class NwSectionBanner extends HTMLElement {
    connectedCallback() {
      this._layout = this.querySelector('.nw-section-banner__layout');
      this._pageWidth = this.querySelector('.nw-section-banner__layout .page-width');
      this._aside = this.querySelector('.nw-section-banner__aside');
      this._desktopMq = window.matchMedia('(min-width: 990px)');
      this._tabletMq = window.matchMedia('(min-width: 750px) and (max-width: 989px)');

      this._onResize = this._syncLayout.bind(this);
      this._onBreakpointChange = this._syncLayout.bind(this);

      this._syncLayout();
      window.addEventListener('resize', this._onResize, { passive: true });
      this._desktopMq.addEventListener('change', this._onBreakpointChange);
      this._tabletMq.addEventListener('change', this._onBreakpointChange);

      if (typeof ResizeObserver !== 'undefined' && this._pageWidth) {
        this._resizeObserver = new ResizeObserver(this._onResize);
        this._resizeObserver.observe(this._pageWidth);
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

      if (this._desktopMq) {
        this._desktopMq.removeEventListener('change', this._onBreakpointChange);
      }

      if (this._tabletMq) {
        this._tabletMq.removeEventListener('change', this._onBreakpointChange);
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
      if (!this._aside || !this._layout) return;

      if (!this._tabletMq.matches) {
        this.style.removeProperty('--nw-sb-aside-width');
        return;
      }

      if (this._desktopMq.matches) {
        var baseAside = 720;
        var asideWidth = baseAside;

        if (this._pageWidth) {
          var pageRect = this._pageWidth.getBoundingClientRect();
          var rightGutter = Math.max(0, window.innerWidth - pageRect.right);
          asideWidth = baseAside + rightGutter;
        }

        this.style.setProperty('--nw-sb-aside-width', asideWidth + 'px');
        return;
      }

      var layoutWidth = this._layout.getBoundingClientRect().width || window.innerWidth;
      var tabletAside = Math.max(280, Math.round(layoutWidth * 0.42));
      this.style.setProperty('--nw-sb-aside-width', tabletAside + 'px');
    }
  }

  customElements.define('nw-section-banner', NwSectionBanner);
}
