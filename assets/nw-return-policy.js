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

      // Measure closed height
      this.el.open = false;
      const endHeight = `${this.el.offsetHeight}px`;
      this.el.open = true;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 280, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      );

      if (this.content) {
        this.content.animate(
          { opacity: [1, 0] },
          { duration: 180, easing: 'ease' }
        );
      }

      this.animation.onfinish = () => this.onAnimationFinish(false);
      this.animation.oncancel = () => {
        this.isClosing = false;
      };
    }

    open() {
      const startHeight = `${this.el.offsetHeight}px`;
      this.el.open = true;
      const endHeight = `${this.el.offsetHeight}px`;

      this.isExpanding = true;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 280, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      );

      if (this.content) {
        this.content.animate(
          { opacity: [0, 1] },
          { duration: 280, easing: 'ease' }
        );
      }

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

  class NwReturnPolicy extends HTMLElement {
    connectedCallback() {
      this._initAccordions();
    }

    _initAccordions() {
      const isMobile = window.matchMedia('(max-width: 749px)').matches;
      this.querySelectorAll('.nw-return-policy__item').forEach((el) => {
        if (isMobile) {
          el.removeAttribute('open');
          const summary = el.querySelector('summary');
          if (summary) summary.setAttribute('aria-expanded', 'false');
        }
        new NwReturnPolicyAccordion(el, this);
      });
    }
  }

  customElements.define('nw-return-policy', NwReturnPolicy);
}
