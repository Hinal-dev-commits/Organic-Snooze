if (!customElements.get('nw-faq-v3')) {
  class NwFaqV3Accordion {
    constructor(el, accordionGroup) {
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.nw-faq-v3__answer');
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.accordionGroup = accordionGroup;

      if (!this.summary) return;

      this.updateAriaExpanded(this.el.open);
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }

    getPaddingBlock() {
      const styles = getComputedStyle(this.el);
      const top = parseFloat(styles.paddingTop) || 0;
      const bottom = parseFloat(styles.paddingBottom) || 0;
      return { top, bottom, total: top + bottom };
    }

    getClosedHeight() {
      const padding = this.getPaddingBlock();
      return Math.ceil(padding.total + this.summary.offsetHeight);
    }

    getContentGap() {
      if (!this.content) return 0;
      return parseFloat(getComputedStyle(this.content).marginTop) || 0;
    }

    getOpenHeight() {
      const padding = this.getPaddingBlock();
      const contentHeight = this.content ? this.content.scrollHeight : 0;
      return Math.ceil(
        padding.top + this.summary.offsetHeight + this.getContentGap() + contentHeight + padding.bottom
      );
    }

    setAnimating(isAnimating) {
      this.el.classList.toggle('is-animating', isAnimating);
    }

    cancelAnimation() {
      if (this.animation) {
        this.animation.cancel();
        this.animation = null;
      }
      this.isClosing = false;
      this.isExpanding = false;
    }

    onClick(e) {
      e.preventDefault();

      if (window.nwPrefersReducedMotion && window.nwPrefersReducedMotion()) {
        this.el.open = !this.el.open;
        this.updateAriaExpanded(this.el.open);
        if (!this.el.open) {
          this.accordionGroup.currentAccordion = null;
        } else {
          this.accordionGroup.currentAccordion = this;
        }
        return;
      }

      if (!this.accordionGroup.allowMultiple) {
        this.accordionGroup.closeAllExcept(this);
      }

      if (this.isClosing || !this.el.open) {
        this.open();
      } else if (this.isExpanding || this.el.open) {
        this.shrink();
      }
    }

    shrink() {
      this.cancelAnimation();
      this.isClosing = true;
      this.setAnimating(true);

      const startHeight = this.el.offsetHeight;
      const endHeight = this.getClosedHeight();

      this.el.style.overflow = 'hidden';
      this.el.style.height = `${startHeight}px`;

      this.animation = this.el.animate(
        { height: [`${startHeight}px`, `${endHeight}px`] },
        { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
      );

      this.animation.onfinish = () => this.onAnimationFinish(false);
      this.animation.oncancel = () => {
        this.isClosing = false;
        this.setAnimating(false);
      };
    }

    open() {
      this.cancelAnimation();
      this.setAnimating(true);
      this.el.style.overflow = 'hidden';
      this.el.style.height = `${this.getClosedHeight()}px`;
      this.el.open = true;
      this.accordionGroup.currentAccordion = this;

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => this.expand());
      });
    }

    expand() {
      this.isExpanding = true;

      const startHeight = this.el.offsetHeight;
      const endHeight = Math.max(this.getOpenHeight(), this.el.scrollHeight);

      this.animation = this.el.animate(
        { height: [`${startHeight}px`, `${endHeight}px`] },
        { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
      );

      this.animation.onfinish = () => this.onAnimationFinish(true);
      this.animation.oncancel = () => {
        this.isExpanding = false;
        this.setAnimating(false);
      };
    }

    onAnimationFinish(open) {
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.el.open = open;
      this.updateAriaExpanded(open);

      if (open) {
        this.el.style.height = 'auto';
      } else {
        this.el.style.height = '';
      }

      this.el.style.overflow = '';
      this.setAnimating(false);

      if (!open) {
        this.accordionGroup.currentAccordion = null;
      }
    }

    updateAriaExpanded(isExpanded) {
      this.summary.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }

    close() {
      if (!this.el.open || this.isClosing) return;
      if (this.isExpanding) {
        this.cancelAnimation();
      }
      this.shrink();
    }
  }

  class NwFaqV3 extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this.allowMultiple = this.dataset.allowMultiple === 'true';
      this.currentAccordion = null;
      this.accordions = [];

      this.querySelectorAll('.nw-faq-v3__item').forEach((el) => {
        this.accordions.push(new NwFaqV3Accordion(el, this));
      });
    }

    closeAllExcept(currentAccordion) {
      this.accordions.forEach((accordion) => {
        if (accordion !== currentAccordion) accordion.close();
      });
    }
  }

  customElements.define('nw-faq-v3', NwFaqV3);
}
