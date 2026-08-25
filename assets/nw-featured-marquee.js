if (!customElements.get('nw-featured-marquee')) {
  class NwFeaturedMarquee extends HTMLElement {
    static get observedAttributes() {
      return ['data-direction', 'data-speed', 'data-pause-hover'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      if (name === 'data-direction') {
        this.direction = newVal || 'rtl';
      } else if (name === 'data-speed') {
        this.speed = parseFloat(newVal) || 30;
      } else if (name === 'data-pause-hover') {
        this.pauseOnHover = newVal === 'true';
      }
    }

    connectedCallback() {
      this.track = this.querySelector('.nw-featured-marquee__track');
      this.wrapper = this.querySelector('.nw-featured-marquee__wrapper');
      if (!this.track || !this.wrapper) return;

      this.direction = this.getAttribute('data-direction') || 'rtl';
      this.speed = parseFloat(this.getAttribute('data-speed')) || 30;
      this.pauseOnHover = this.getAttribute('data-pause-hover') === 'true';

      this.pos = 0;
      this.groupWidth = 0;
      this.isPaused = false;
      this.lastTime = null;
      this.rafId = null;

      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.animate = this.animate.bind(this);
      this.onResize = this.onResize.bind(this);

      if (this.pauseOnHover) {
        this.wrapper.addEventListener('mouseenter', this.onMouseEnter);
        this.wrapper.addEventListener('mouseleave', this.onMouseLeave);
        this.wrapper.addEventListener('touchstart', this.onMouseEnter, { passive: true });
        this.wrapper.addEventListener('touchend', this.onMouseLeave, { passive: true });
      }

      this.setupMarquee();

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(this.wrapper);
      } else {
        window.addEventListener('resize', this.onResize, { passive: true });
      }
    }

    disconnectedCallback() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', this.onResize);
      }
      if (this.pauseOnHover && this.wrapper) {
        this.wrapper.removeEventListener('mouseenter', this.onMouseEnter);
        this.wrapper.removeEventListener('mouseleave', this.onMouseLeave);
        this.wrapper.removeEventListener('touchstart', this.onMouseEnter);
        this.wrapper.removeEventListener('touchend', this.onMouseLeave);
      }
    }

    onMouseEnter() {
      this.isPaused = true;
    }

    onMouseLeave() {
      this.isPaused = false;
      this.lastTime = null;
    }

    onResize() {
      this.setupMarquee();
    }

    setupMarquee() {
      const firstGroup = this.track.querySelector('.nw-featured-marquee__group');
      if (!firstGroup) return;

      const groupRect = firstGroup.getBoundingClientRect();
      this.groupWidth = groupRect.width;
      if (this.groupWidth <= 0) return;

      const wrapperWidth = this.wrapper.getBoundingClientRect().width || window.innerWidth;
      const totalWidthNeeded = wrapperWidth * 2 + this.groupWidth * 2;

      let currentTotalWidth = this.track.querySelectorAll('.nw-featured-marquee__group').length * this.groupWidth;
      while (currentTotalWidth < totalWidthNeeded) {
        const clone = firstGroup.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        this.track.appendChild(clone);
        currentTotalWidth += this.groupWidth;
      }

      if (this.direction === 'ltr' && this.pos === 0) {
        this.pos = -this.groupWidth;
      }

      if (!this.rafId) {
        this.lastTime = null;
        this.rafId = requestAnimationFrame(this.animate);
      }
    }

    animate(time) {
      if (!this.isConnected) return;

      if (!this.lastTime) {
        this.lastTime = time;
      }

      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (!this.isPaused && this.groupWidth > 0) {
        const pxPerSec = Math.max(this.speed, 5) * 2;

        if (this.direction === 'rtl') {
          this.pos -= pxPerSec * dt;
          if (this.pos <= -this.groupWidth) {
            this.pos += this.groupWidth;
          }
        } else {
          this.pos += pxPerSec * dt;
          if (this.pos >= 0) {
            this.pos -= this.groupWidth;
          }
        }

        this.track.style.transform = `translate3d(${this.pos}px, 0, 0)`;
      }

      this.rafId = requestAnimationFrame(this.animate);
    }
  }

  customElements.define('nw-featured-marquee', NwFeaturedMarquee);
}
