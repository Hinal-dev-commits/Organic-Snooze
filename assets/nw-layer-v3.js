if (!customElements.get('nw-layer-v3')) {
  class NwLayerV3 extends HTMLElement {
    connectedCallback() {
      this.activeIndex = parseInt(this.dataset.defaultLayer, 10) || 0;
      this._bindInteractions();
      this._setActiveLayer(this.activeIndex);
    }

    _bindInteractions() {
      this.querySelectorAll('[data-hotspot-index]').forEach((hotspot) => {
        hotspot.addEventListener('click', () => {
          var index = parseInt(hotspot.getAttribute('data-hotspot-index'), 10);
          if (!Number.isNaN(index)) {
            this._setActiveLayer(index);
          }
        });
      });

      if (window.Shopify && Shopify.designMode) {
        document.addEventListener('shopify:block:select', (e) => {
          if (!e.target || !this.contains(e.target)) return;

          var slideIndex = e.target.getAttribute('data-slide-index');
          if (slideIndex !== null) {
            this._setActiveLayer(parseInt(slideIndex, 10));
          }
        });
      }
    }

    _setActiveLayer(index) {
      if (Number.isNaN(index)) return;

      var panels = this.querySelectorAll('[data-layer-panel]');
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
