if (!customElements.get('nw-mobile-menu')) {
  class NwMobileMenu extends HTMLElement {
    connectedCallback() {
      this.main = this.querySelector('[data-nw-mobile-menu-main]');
      this.panelsWrap = this.querySelector('[data-nw-mobile-mega-panels]');
      this.panels = this.querySelectorAll('[data-nw-mobile-mega-panel]');
      this.openButtons = this.querySelectorAll('[data-nw-mobile-mega-open]');
      this.backButtons = this.querySelectorAll('[data-nw-mobile-mega-back]');

      this._onOpenClick = this._handleOpenClick.bind(this);
      this._onBackClick = this._handleBackClick.bind(this);

      this.openButtons.forEach((button) => {
        button.addEventListener('click', this._onOpenClick);
      });

      this.backButtons.forEach((button) => {
        button.addEventListener('click', this._onBackClick);
      });

      this.panels.forEach((panel) => {
        panel.hidden = true;
      });
    }

    disconnectedCallback() {
      this.openButtons.forEach((button) => {
        button.removeEventListener('click', this._onOpenClick);
      });

      this.backButtons.forEach((button) => {
        button.removeEventListener('click', this._onBackClick);
      });
    }

    _handleOpenClick(event) {
      event.preventDefault();
      event.stopPropagation();

      var button = event.currentTarget;
      var panelId = button.getAttribute('data-nw-mobile-mega-open');
      if (!panelId) return;

      var panel = this.querySelector('[data-nw-mobile-mega-panel][data-panel-id="' + panelId + '"]');
      if (!panel) return;

      this.panels.forEach((item) => {
        item.classList.remove('is-active');
        item.hidden = true;
      });

      panel.hidden = false;
      window.requestAnimationFrame(function () {
        panel.classList.add('is-active');
      });

      this.classList.add('is-mega-open');
      button.setAttribute('aria-expanded', 'true');
    }

    _handleBackClick(event) {
      event.preventDefault();
      event.stopPropagation();
      this.closeMegaPanel();
    }

    closeMegaPanel() {
      this.classList.remove('is-mega-open');

      this.panels.forEach((panel) => {
        panel.classList.remove('is-active');
        window.setTimeout(function () {
          if (!panel.classList.contains('is-active')) {
            panel.hidden = true;
          }
        }, 350);
      });

      this.openButtons.forEach((button) => {
        button.setAttribute('aria-expanded', 'false');
      });
    }
  }

  customElements.define('nw-mobile-menu', NwMobileMenu);
}

(function () {
  var drawerSelector = '#Details-menu-drawer-container';
  var chatTriggerSelector = '[data-nw-open-ghl-chat]';
  var ghlChatBubbleSelectors = [
    '#lc_text-widget--btn',
    'button.lc_text-widget--bubble',
    '[aria-label*="open the chat widget" i]',
  ];

  function applyMenuDrawerClosedState(drawer, summary) {
    document.documentElement.classList.remove('overflow-hidden-tablet');
    document.documentElement.classList.remove('overflow-hidden-desktop');

    if (drawer) {
      drawer.classList.remove('menu-opening');
      drawer.querySelectorAll('details').forEach(function (details) {
        details.classList.remove('menu-opening');
      });
    }

    if (summary) {
      summary.setAttribute('aria-expanded', 'false');
    }
  }

  function closeMobileMenuDrawer() {
    var drawer = document.querySelector(drawerSelector);
    var summary = drawer && drawer.querySelector('summary.header__icon');

    if (drawer && drawer.hasAttribute('open')) {
      var headerDrawer = drawer.closest('header-drawer');
      if (headerDrawer && typeof headerDrawer.closeMenuDrawer === 'function' && summary) {
        headerDrawer.closeMenuDrawer(new Event('click'), summary);
      } else {
        drawer.removeAttribute('open');
      }
    }

    applyMenuDrawerClosedState(drawer, summary);
    resetMobileMegaPanels();
  }

  function clickGhlChatBubble() {
    var widgets = document.querySelectorAll('chat-widget');
    for (var i = 0; i < widgets.length; i++) {
      var root = widgets[i].shadowRoot;
      if (!root) continue;

      for (var s = 0; s < ghlChatBubbleSelectors.length; s++) {
        var bubble = root.querySelector(ghlChatBubbleSelectors[s]);
        if (bubble) {
          bubble.click();
          return true;
        }
      }
    }
    return false;
  }

  function openGhlChatWidget(attempt) {
    attempt = attempt || 0;
    if (clickGhlChatBubble()) return;
    if (attempt >= 24) return;
    window.setTimeout(function () {
      openGhlChatWidget(attempt + 1);
    }, 250);
  }

  function resetMobileMegaPanels() {
    document.querySelectorAll('nw-mobile-menu').forEach(function (menu) {
      if (typeof menu.closeMegaPanel === 'function') {
        menu.closeMegaPanel();
      }
    });
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest(chatTriggerSelector);
    if (!trigger) return;

    event.preventDefault();
    closeMobileMenuDrawer();
    openGhlChatWidget(0);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var drawer = document.querySelector(drawerSelector);
    if (!drawer) return;

    drawer.addEventListener('toggle', function () {
      if (!drawer.open) {
        resetMobileMegaPanels();
      }
    });
  });
})();
