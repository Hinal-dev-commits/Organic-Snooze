if (!customElements.get('nw-freegift')) {
  customElements.define(
    'nw-freegift',
    class NwFreeGift extends HTMLElement {
      connectedCallback() {
        if (this.dataset.bound === 'true') return;
        this.dataset.bound = 'true';

        this.initCollapseToggle();
        this.initValueDetailsToggle();
      }

      initCollapseToggle() {
        this.collapseToggle = this.querySelector('[data-freegift-collapse-toggle]');
        if (!this.collapseToggle) return;

        this.collapseToggle.addEventListener('click', () => this.toggleCollapsed());
      }

      toggleCollapsed() {
        if (!this.collapseToggle) return;

        const collapsed = this.classList.toggle('is-collapsed');
        this.collapseToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }

      initValueDetailsToggle() {
        const toggle = this.querySelector('[data-freegift-value-details-toggle]');
        const panel = this.querySelector('[data-freegift-value-details]');
        if (!toggle || !panel) return;

        const labelShow = toggle.querySelector('[data-freegift-value-details-label-show]');
        const labelHide = toggle.querySelector('[data-freegift-value-details-label-hide]');

        toggle.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();

          const willOpen = !this.classList.contains('is-value-details-open');
          this.classList.toggle('is-value-details-open', willOpen);
          toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
          panel.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

          if (labelShow && labelHide) {
            labelShow.hidden = willOpen;
            labelHide.hidden = !willOpen;
          }
        });
      }
    }
  );
}
