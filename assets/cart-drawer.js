class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  _isScrollAllowedEvent(event) {
    const drawerInner = this.querySelector('.drawer__inner');
    if (!drawerInner || !(event.target instanceof Node)) return false;
    return drawerInner.contains(event.target);
  }

  _preventBackgroundScroll(event) {
    if (!this._scrollLocked) return;
    if (this._isScrollAllowedEvent(event)) return;
    event.preventDefault();
  }

  _bindScrollPreventListeners() {
    this._onWheel = this._preventBackgroundScroll.bind(this);
    this._onTouchMove = this._preventBackgroundScroll.bind(this);
    this._onKeyDown = (event) => {
      if (!this._scrollLocked) return;
      if (this._isScrollAllowedEvent(event)) return;
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.includes(event.key)) event.preventDefault();
    };

    document.addEventListener('wheel', this._onWheel, { passive: false, capture: true });
    document.addEventListener('touchmove', this._onTouchMove, { passive: false, capture: true });
    document.addEventListener('keydown', this._onKeyDown, { passive: false, capture: true });
  }

  _unbindScrollPreventListeners() {
    if (this._onWheel) document.removeEventListener('wheel', this._onWheel, { capture: true });
    if (this._onTouchMove) document.removeEventListener('touchmove', this._onTouchMove, { capture: true });
    if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown, { capture: true });
    this._onWheel = null;
    this._onTouchMove = null;
    this._onKeyDown = null;
  }

  _stripDocumentOverflowLock() {
    const overflowClasses = ['overflow-hidden', 'overflow-hidden-mobile', 'overflow-hidden-desktop'];
    document.documentElement.classList.remove(...overflowClasses);
    document.body.classList.remove(...overflowClasses);
  }

  _startDocumentOverflowGuard() {
    this._stripDocumentOverflowLock();
    this._overflowGuard = new MutationObserver(() => {
      if (!this._scrollLocked) return;
      this._stripDocumentOverflowLock();
    });
    this._overflowGuard.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    this._overflowGuard.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  _stopDocumentOverflowGuard() {
    this._overflowGuard?.disconnect();
    this._overflowGuard = null;
  }

  _syncLockedScrollPosition() {
    if (!this._scrollLocked || this._scrollLockY == null) return;
    if (window.scrollY !== this._scrollLockY) {
      window.scrollTo(0, this._scrollLockY);
    }
  }

  _lockPageScroll() {
    if (this._scrollLocked) return;
    this._scrollLocked = true;
    this._scrollLockY =
      typeof this._openScrollY === 'number' ? this._openScrollY : window.scrollY || window.pageYOffset || 0;
    delete this._openScrollY;

    document.documentElement.classList.add('cart-drawer-open');
    this._stripDocumentOverflowLock();
    this._startDocumentOverflowGuard();
    this._syncLockedScrollPosition();

    this._bindScrollPreventListeners();
  }

  _unlockPageScroll() {
    if (!this._scrollLocked) return;
    const scrollY = this._scrollLockY;
    this._scrollLocked = false;

    document.documentElement.classList.remove('cart-drawer-open');
    this._stopDocumentOverflowGuard();
    this._stripDocumentOverflowLock();

    this._unbindScrollPreventListeners();

    if (typeof scrollY === 'number' && window.scrollY !== scrollY) {
      window.scrollTo(0, scrollY);
    }

    this._scrollLockY = null;
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (this.classList.contains('active')) return;
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement =
          this.querySelector('.drawer__close') ||
          getFocusableElements(containerToTrapFocusOn)[0] ||
          containerToTrapFocusOn;
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true },
    );

    this._lockPageScroll();

    this.querySelector('cart-drawer-items')?.dispatchViewEvent();
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    this._unlockPageScroll();
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this._openScrollY = window.scrollY || window.pageYOffset || 0;

    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    requestAnimationFrame(() => {
      if (typeof this._openScrollY === 'number' && window.scrollY !== this._openScrollY) {
        window.scrollTo(0, this._openScrollY);
      }
      setTimeout(() => {
        this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
        this.open();
      });
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
