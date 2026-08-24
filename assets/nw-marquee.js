if (!customElements.get('nw-marquee')) {
  class NwMarquee extends HTMLElement {
    connectedCallback() {
      if (this.getAttribute('data-parallax') !== 'true') return;

      this._ticking = false;
      this._direction = this.getAttribute('data-direction') === 'left_to_right' ? 1 : -1;
      this._onScroll = this._onScroll.bind(this);
      this._updateParallax = this._updateParallax.bind(this);

      window.addEventListener('scroll', this._onScroll, { passive: true });
      this._updateParallax();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this._onScroll);
    }

    _updateParallax() {
      var rect = this.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        var scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        var offset = (scrollProgress - 0.5) * 160 * this._direction;
        this.style.setProperty('--nw-parallax-shift', offset + 'px');
      }
      this._ticking = false;
    }

    _onScroll() {
      if (!this._ticking) {
        window.requestAnimationFrame(this._updateParallax);
        this._ticking = true;
      }
    }
  }

  customElements.define('nw-marquee', NwMarquee);
}
