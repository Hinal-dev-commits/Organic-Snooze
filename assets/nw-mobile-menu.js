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

  function resetMobileMegaPanels() {
    document.querySelectorAll('nw-mobile-menu').forEach(function (menu) {
      if (typeof menu.closeMegaPanel === 'function') {
        menu.closeMegaPanel();
      }
    });
  }

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
