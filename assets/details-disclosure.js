class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  static DESKTOP_BREAKPOINT = '(min-width: 990px)';

  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this._closeTimer = null;
    this._openTimer = null;
    this._desktopMediaQuery = window.matchMedia(HeaderMenu.DESKTOP_BREAKPOINT);

    this._onMouseEnter = () => this._scheduleOpen();
    this._onMouseLeave = () => this._scheduleClose();
    this._onFocusIn = () => this._scheduleOpen();
    this._onFocusOut = (event) => {
      if (this.contains(event.relatedTarget)) return;
      this._scheduleClose();
    };
    this._onSummaryClick = (event) => {
      if (!this._isDesktop()) return;
      event.preventDefault();
    };

    this.addEventListener('mouseenter', this._onMouseEnter);
    this.addEventListener('mouseleave', this._onMouseLeave);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);

    const summary = this.mainDetailsToggle?.querySelector('summary');
    if (summary) {
      summary.addEventListener('click', this._onSummaryClick);
    }

    this._initNestedDropdowns();
  }

  disconnectedCallback() {
    this._clearTimers();
    this.removeEventListener('mouseenter', this._onMouseEnter);
    this.removeEventListener('mouseleave', this._onMouseLeave);
    this.removeEventListener('focusin', this._onFocusIn);
    this.removeEventListener('focusout', this._onFocusOut);

    if (this.mainDetailsToggle) {
      const summary = this.mainDetailsToggle.querySelector('summary');
      if (summary) {
        summary.removeEventListener('click', this._onSummaryClick);
      }
    }

    this._nestedDropdowns?.forEach(({ details, onMouseEnter, onMouseLeave, onSummaryClick }) => {
      details.removeEventListener('mouseenter', onMouseEnter);
      details.removeEventListener('mouseleave', onMouseLeave);
      details.querySelector('summary')?.removeEventListener('click', onSummaryClick);
    });
    this._nestedDropdowns = null;
  }

  _isDesktop() {
    return this._desktopMediaQuery.matches;
  }

  _clearTimers() {
    if (this._closeTimer) {
      window.clearTimeout(this._closeTimer);
      this._closeTimer = null;
    }
    if (this._openTimer) {
      window.clearTimeout(this._openTimer);
      this._openTimer = null;
    }
  }

  _scheduleOpen() {
    if (!this._isDesktop()) return;
    this._clearTimers();
    this._openTimer = window.setTimeout(() => this.open(), 80);
  }

  _scheduleClose() {
    if (!this._isDesktop()) return;
    this._clearTimers();
    this._closeTimer = window.setTimeout(() => this.close(), 180);
  }

  static closeAllExcept(current) {
    document.querySelectorAll('nw-mega-menu-item.is-open').forEach((item) => {
      if (typeof item.close === 'function') item.close(true);
    });

    document.querySelectorAll('header-menu').forEach((menu) => {
      if (menu !== current && typeof menu.close === 'function') menu.close();
    });
  }

  open() {
    if (!this._isDesktop() || this.mainDetailsToggle.hasAttribute('open')) return;

    HeaderMenu.closeAllExcept(this);

    this.mainDetailsToggle.setAttribute('open', '');
    const summary = this.mainDetailsToggle.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', 'true');
    this.classList.add('is-open');
    this.onToggle();
  }

  close() {
    if (!this.mainDetailsToggle.hasAttribute('open')) {
      this.classList.remove('is-open');
      return;
    }

    super.close();
    this.classList.remove('is-open');

    if (this.header) {
      this.header.preventHide = false;
    }
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (this.mainDetailsToggle.open) {
      this.classList.add('is-open');
    } else {
      this.classList.remove('is-open');
    }

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }

  _initNestedDropdowns() {
    this._nestedDropdowns = [];

    this.querySelectorAll('.header__submenu details').forEach((details) => {
      let closeTimer = null;
      let openTimer = null;

      const onMouseEnter = () => {
        if (!this._isDesktop()) return;
        if (closeTimer) window.clearTimeout(closeTimer);
        openTimer = window.setTimeout(() => {
          details.setAttribute('open', '');
          details.querySelector('summary')?.setAttribute('aria-expanded', 'true');
        }, 80);
      };

      const onMouseLeave = () => {
        if (!this._isDesktop()) return;
        if (openTimer) window.clearTimeout(openTimer);
        closeTimer = window.setTimeout(() => {
          details.removeAttribute('open');
          details.querySelector('summary')?.setAttribute('aria-expanded', 'false');
        }, 180);
      };

      const onSummaryClick = (event) => {
        if (!this._isDesktop()) return;
        event.preventDefault();
      };

      details.addEventListener('mouseenter', onMouseEnter);
      details.addEventListener('mouseleave', onMouseLeave);
      details.querySelector('summary')?.addEventListener('click', onSummaryClick);

      this._nestedDropdowns.push({ details, onMouseEnter, onMouseLeave, onSummaryClick });
    });
  }
}

customElements.define('header-menu', HeaderMenu);
