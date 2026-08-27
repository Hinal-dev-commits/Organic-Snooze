if (!customElements.get('nw-return-policy')) {
  class NwReturnPolicyAccordion {
    constructor(el, container) {
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.nw-return-policy__content');
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.container = container;

      if (!this.summary) return;

      this.updateAriaExpanded(this.el.open);
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(e) {
      e.preventDefault();
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
        { duration: 300, easing: 'ease-out' }
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
      const contentHeight = this.content ? this.content.scrollHeight : 0;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + contentHeight}px`;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 300, easing: 'ease-out' }
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

    close() {
      if (this.el.open) this.shrink();
    }
  }

  class NwReturnPolicy extends HTMLElement {
    connectedCallback() {
      this._initAccordions();
    }

    _initAccordions() {
      this.accordions = [];
      this.querySelectorAll('.nw-return-policy__item').forEach((el) => {
        this.accordions.push(new NwReturnPolicyAccordion(el, this));
      });
    }
  }

  customElements.define('nw-return-policy', NwReturnPolicy);
}
