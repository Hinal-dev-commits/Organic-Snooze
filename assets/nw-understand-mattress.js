if (!customElements.get('nw-understand-mattress')) {
  class NwUnderstandMattressAccordion {
    constructor(el, accordionGroup) {
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.nw-understand-mattress__answer, .accordion__content');
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.accordionGroup = accordionGroup;

      if (!this.summary) return;

      this.updateAriaExpanded(this.el.open);
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(e) {
      e.preventDefault();
      this.el.style.overflow = 'hidden';
      if (this.accordionGroup && typeof this.accordionGroup.closeAllExcept === 'function') {
        this.accordionGroup.closeAllExcept(this);
      }

      if (this.isClosing || !this.el.open) {
        this.open();
      } else if (this.isExpanding || this.el.open) {
        this.shrink();
      }
    }

    shrink() {
      this.isClosing = true;
      const computedStyle = window.getComputedStyle(this.el);
      const totalPadding = (parseFloat(computedStyle.paddingTop) || 0) + (parseFloat(computedStyle.paddingBottom) || 0);
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + totalPadding}px`;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 350, easing: 'ease-out' }
      );

      this.animation.onfinish = () => this.onAnimationFinish(false);
      this.animation.oncancel = () => {
        this.isClosing = false;
      };
    }

    open() {
      this.el.style.height = `${this.el.offsetHeight}px`;
      this.el.open = true;
      if (this.accordionGroup) {
        this.accordionGroup.currentAccordion = this;
      }
      window.requestAnimationFrame(() => this.expand());
    }

    expand() {
      this.isExpanding = true;
      const computedStyle = window.getComputedStyle(this.el);
      const totalPadding = (parseFloat(computedStyle.paddingTop) || 0) + (parseFloat(computedStyle.paddingBottom) || 0);
      const contentMarginTop = this.content ? parseFloat(window.getComputedStyle(this.content).marginTop) || 0 : 0;
      const contentHeight = this.content ? this.content.scrollHeight + contentMarginTop : 0;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + totalPadding + contentHeight}px`;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 350, easing: 'ease-out' }
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

      if (!open && this.accordionGroup) {
        this.accordionGroup.currentAccordion = null;
      }
    }

    updateAriaExpanded(isExpanded) {
      this.summary.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }

    close() {
      if (this.el.open) this.shrink();
    }
  }

  class NwUnderstandMattress extends HTMLElement {
    connectedCallback() {
      this._initAccordions();
    }

    _initAccordions() {
      this.currentAccordion = null;
      this.accordions = [];

      this.querySelectorAll('details.nw-understand-mattress__item').forEach((el) => {
        this.accordions.push(new NwUnderstandMattressAccordion(el, this));
      });
    }

    closeAllExcept(currentAccordion) {
      this.accordions.forEach((accordion) => {
        if (accordion !== currentAccordion) accordion.close();
      });
    }
  }

  customElements.define('nw-understand-mattress', NwUnderstandMattress);
}
