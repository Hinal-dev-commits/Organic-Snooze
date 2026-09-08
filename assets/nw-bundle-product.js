if (!customElements.get('nw-bundle-product')) {
  class NwBundleProductAccordion {
    constructor(el) {
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.accordion__content');
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;

      if (!this.summary || !this.content) return;

      this.updateAriaExpanded(this.el.open);
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(e) {
      e.preventDefault();

      if (window.nwPrefersReducedMotion && window.nwPrefersReducedMotion()) {
        this.el.open = !this.el.open;
        this.updateAriaExpanded(this.el.open);
        return;
      }

      this.el.style.overflow = 'hidden';

      if (this.isClosing || !this.el.open) {
        this.open();
      } else if (this.isExpanding || this.el.open) {
        this.shrink();
      }
    }

    shrink() {
      this.isClosing = true;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight}px`;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 400, easing: 'ease-out' }
      );

      this.animation.onfinish = () => this.onAnimationFinish(false);
      this.animation.oncancel = () => {
        this.isClosing = false;
      };
    }

    open() {
      this.el.style.height = `${this.el.offsetHeight}px`;
      this.el.open = true;
      window.requestAnimationFrame(() => this.expand());
    }

    expand() {
      this.isExpanding = true;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 400, easing: 'ease-out' }
      );

      this.animation.onfinish = () => this.onAnimationFinish(true);
      this.animation.oncancel = () => {
        this.isExpanding = false;
      };
    }

    onAnimationFinish(open) {
      this.el.open = open;
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.el.style.height = '';
      this.el.style.overflow = '';
      this.updateAriaExpanded(open);
    }

    updateAriaExpanded(isExpanded) {
      this.summary.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }
  }

  class NwBundleProduct extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this.querySelectorAll('.accordion.smooth details, details.accordion.smooth').forEach((el) => {
        if (el._nwBundleAccordion) return;
        el._nwBundleAccordion = new NwBundleProductAccordion(el);
      });
    }

    disconnectedCallback() {
      this.querySelectorAll('.accordion.smooth details, details.accordion.smooth').forEach((el) => {
        el._nwBundleAccordion = null;
      });

      this._initialized = false;
    }
  }

  customElements.define('nw-bundle-product', NwBundleProduct);
}
