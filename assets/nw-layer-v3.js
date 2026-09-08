if (!customElements.get('nw-layer-v3')) {
  class NwLayerV3 extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this.activeIndex = parseInt(this.dataset.defaultLayer, 10) || 0;
      this._hotspotHandlers = [];
      this._bindInteractions();
      this._setActiveLayer(this.activeIndex);
    }

    disconnectedCallback() {
      if (this._onBlockSelect) {
        document.removeEventListener('shopify:block:select', this._onBlockSelect);
        this._onBlockSelect = null;
      }

      if (this._hotspotHandlers) {
        this._hotspotHandlers.forEach(({ el, fn }) => {
          el.removeEventListener('click', fn);
        });
        this._hotspotHandlers = null;
      }

      this._initialized = false;
    }

    _bindInteractions() {
      this.querySelectorAll('[data-hotspot-index]').forEach((hotspot) => {
        const fn = () => {
          const index = parseInt(hotspot.getAttribute('data-hotspot-index'), 10);
          if (!Number.isNaN(index)) {
            this._setActiveLayer(index);
          }
        };

        hotspot.addEventListener('click', fn);
        this._hotspotHandlers.push({ el: hotspot, fn });
      });

      if (window.Shopify && Shopify.designMode) {
        this._onBlockSelect = (e) => {
          if (!e.target || !this.contains(e.target)) return;

          const slideIndex = e.target.getAttribute('data-slide-index');
          if (slideIndex !== null) {
            this._setActiveLayer(parseInt(slideIndex, 10));
          }
        };

        document.addEventListener('shopify:block:select', this._onBlockSelect);
      }
    }

    _setActiveLayer(index) {
      if (Number.isNaN(index)) return;

      const panels = this.querySelectorAll('[data-layer-panel]');
      if (!panels.length || index < 0 || index >= panels.length) return;

      this.activeIndex = index;

      this.querySelectorAll('[data-hotspot-index]').forEach((hotspot, i) => {
        hotspot.classList.toggle('is-active', i === index);
        hotspot.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });

      panels.forEach((panel, i) => {
        panel.classList.toggle('is-active', i === index);
      });
    }
  }

  customElements.define('nw-layer-v3', NwLayerV3);
}
