class NwProductAffirmButton extends HTMLElement {
  connectedCallback() {
    if (this.dataset.bound === 'true') return;
    this.dataset.bound = 'true';
    this.addEventListener('click', this.onClick.bind(this));
  }

  onClick(event) {
    const terms = this.querySelector('shopify-payment-terms, .shopify-payment-terms');
    if (!terms) return;

    const link =
      terms.querySelector('a') ||
      terms.shadowRoot?.querySelector('a') ||
      terms.querySelector('[role="button"]') ||
      terms.shadowRoot?.querySelector('[role="button"]');

    if (!link) return;

    if (event.target === link || link.contains(event.target)) return;

    event.preventDefault();
    link.click();
  }
}

if (!customElements.get('nw-product-affirm-button')) {
  customElements.define('nw-product-affirm-button', NwProductAffirmButton);
}
