if (!customElements.get('nw-faq')) {
  class NwFaqAccordion {
    constructor(el, accordionGroup) {
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.accordion__content');
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
      this.accordionGroup.closeAllExcept(this);

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
      this.accordionGroup.currentAccordion = this;
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

      if (!open) {
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

  class NwFaq extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this._initAccordions();
      this._initSearchAndLimit();
    }

    disconnectedCallback() {
      if (this._moreBtn && this._onMoreClick) {
        this._moreBtn.removeEventListener('click', this._onMoreClick);
      }

      if (this._searchInput && this._onSearchInput) {
        this._searchInput.removeEventListener('input', this._onSearchInput);
      }

      this.accordions = [];
      this._moreBtn = null;
      this._searchInput = null;
      this._onMoreClick = null;
      this._onSearchInput = null;
      this._initialized = false;
    }

    _initAccordions() {
      this.currentAccordion = null;
      this.accordions = [];

      this.querySelectorAll('.accordion.smooth details').forEach((el) => {
        this.accordions.push(new NwFaqAccordion(el, this));
      });
    }

    closeAllExcept(currentAccordion) {
      this.accordions.forEach((accordion) => {
        if (accordion !== currentAccordion) accordion.close();
      });
    }

    _initSearchAndLimit() {
      const searchInput = this.querySelector('.nw-faq__search-input');
      const faqList = this.querySelector('.nw-faq__list');
      if (!faqList) return;

      const faqItems = faqList.querySelectorAll('.nw-faq__item');
      const moreBtn = this.querySelector('.nw-faq__more');
      const initialLimit = parseInt(faqList.getAttribute('data-initial-limit') || '6', 10);

      this._searchInput = searchInput;
      this._moreBtn = moreBtn;

      if (moreBtn && faqItems.length > initialLimit) {
        faqItems.forEach((item, index) => {
          if (index >= initialLimit) item.classList.add('is-hidden-by-limit');
        });

        this._onMoreClick = (e) => {
          if (moreBtn.getAttribute('data-toggle') !== 'true') return;

          e.preventDefault();
          const isExpanded = moreBtn.classList.contains('is-expanded');

          if (isExpanded) {
            faqItems.forEach((item, index) => {
              if (index >= initialLimit) item.classList.add('is-hidden-by-limit');
            });
            moreBtn.classList.remove('is-expanded');
            moreBtn.textContent = moreBtn.getAttribute('data-more-text') || "SEE MORE FAQ'S";
          } else {
            faqItems.forEach((item) => item.classList.remove('is-hidden-by-limit'));
            moreBtn.classList.add('is-expanded');
            moreBtn.textContent = moreBtn.getAttribute('data-less-text') || "SEE LESS FAQ'S";
          }
        };

        moreBtn.addEventListener('click', this._onMoreClick);
      }

      if (!searchInput) return;

      this._onSearchInput = () => {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
          faqItems.forEach((item, index) => {
            item.style.display = '';
            if (moreBtn && !moreBtn.classList.contains('is-expanded') && index >= initialLimit) {
              item.classList.add('is-hidden-by-limit');
            }
          });
          if (moreBtn) moreBtn.style.display = '';
          return;
        }

        if (moreBtn) moreBtn.style.display = 'none';

        faqItems.forEach((item) => {
          item.classList.remove('is-hidden-by-limit');
          const details = item.querySelector('details');
          if (details) details.removeAttribute('open');
          const qEl = item.querySelector('.nw-faq__question');
          const aEl = item.querySelector('.nw-faq__answer');
          const text = ((qEl ? qEl.textContent : '') + ' ' + (aEl ? aEl.textContent : '')).toLowerCase();
          item.style.display = text.indexOf(query) !== -1 ? '' : 'none';
        });
      };

      searchInput.addEventListener('input', this._onSearchInput);
    }
  }

  customElements.define('nw-faq', NwFaq);
}
