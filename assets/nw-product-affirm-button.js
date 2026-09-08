class NwProductAffirm extends HTMLElement {
  connectedCallback() {
    if (this.dataset.bound === 'true') return;
    this.dataset.bound = 'true';

    this.affirmEl = this.querySelector('.affirm-as-low-as');
    if (!this.affirmEl) return;

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
        this.onVariantChange(event);
      });
    }
  }

  disconnectedCallback() {
    this.variantChangeUnsubscriber?.();
  }

  onVariantChange(event) {
    const { sectionId, variant } = event.data || {};
    if (!variant?.price || sectionId !== this.dataset.sectionId) return;

    this.affirmEl.setAttribute('data-amount', variant.price);

    if (typeof affirm !== 'undefined' && affirm.ui?.refresh) {
      affirm.ui.refresh();
    }
  }
}

if (!customElements.get('nw-product-affirm')) {
  customElements.define('nw-product-affirm', NwProductAffirm);
}
