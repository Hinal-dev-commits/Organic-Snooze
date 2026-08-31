if (!customElements.get('nw-featured-marquee')) {
  class NwFeaturedMarquee extends HTMLElement {
    static get observedAttributes() {
      return ['data-direction', 'data-speed', 'data-pause-hover', 'data-animate-desktop', 'data-animate-mobile'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      if (name === 'data-direction') {
        this.direction = newVal || 'rtl';
      } else if (name === 'data-speed') {
        this.speed = parseFloat(newVal) || 30;
      } else if (name === 'data-pause-hover') {
        this.pauseOnHover = newVal === 'true';
      } else if (name === 'data-animate-desktop') {
        this.animateDesktop = newVal === 'true';
      } else if (name === 'data-animate-mobile') {
        this.animateMobile = newVal === 'true';
      }
      if (this.isConnected) {
        this.setupMarquee();
      }
    }

    connectedCallback() {
      this.track = this.querySelector('.nw-featured-marquee__track');
      this.wrapper = this.querySelector('.nw-featured-marquee__wrapper');
      if (!this.track || !this.wrapper) return;

      this.direction = this.getAttribute('data-direction') || 'rtl';
      this.speed = parseFloat(this.getAttribute('data-speed')) || 30;
      this.pauseOnHover = this.getAttribute('data-pause-hover') === 'true';
      this.animateDesktop = this.getAttribute('data-animate-desktop') === 'true';
      this.animateMobile = this.getAttribute('data-animate-mobile') === 'true';
      this.mobileQuery = window.matchMedia('(max-width: 749px)');

      this.pos = 0;
      this.groupWidth = 0;
      this.isPaused = false;
      this.lastTime = null;
      this.rafId = null;

      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.animate = this.animate.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onBreakpointChange = this.onBreakpointChange.bind(this);

      if (this.pauseOnHover) {
        this.wrapper.addEventListener('mouseenter', this.onMouseEnter);
        this.wrapper.addEventListener('mouseleave', this.onMouseLeave);
        this.wrapper.addEventListener('touchstart', this.onMouseEnter, { passive: true });
        this.wrapper.addEventListener('touchend', this.onMouseLeave, { passive: true });
      }

      if (this.mobileQuery.addEventListener) {
        this.mobileQuery.addEventListener('change', this.onBreakpointChange);
      } else if (this.mobileQuery.addListener) {
        this.mobileQuery.addListener(this.onBreakpointChange);
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
      this.stopAnimation();
      if (this.mobileQuery) {
        if (this.mobileQuery.removeEventListener) {
          this.mobileQuery.removeEventListener('change', this.onBreakpointChange);
        } else if (this.mobileQuery.removeListener) {
          this.mobileQuery.removeListener(this.onBreakpointChange);
        }
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

    shouldAnimate() {
      const isMobile = this.mobileQuery.matches;
      return isMobile ? this.animateMobile : this.animateDesktop;
    }

    stopAnimation() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.track) {
        this.track.style.transform = '';
      }
      this.lastTime = null;
    }

    resetGroups() {
      const groups = Array.from(this.track.querySelectorAll('.nw-featured-marquee__group'));
      groups.forEach(function (group, index) {
        if (index > 1) {
          group.remove();
        }
      });
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

    onBreakpointChange() {
      this.pos = 0;
      this.setupMarquee();
    }

    setupMarquee() {
      const firstGroup = this.track.querySelector('.nw-featured-marquee__group');
      if (!firstGroup) return;

      this.resetGroups();

      if (!this.shouldAnimate()) {
        this.stopAnimation();
        const groups = this.track.querySelectorAll('.nw-featured-marquee__group');
        groups.forEach(function (group, index) {
          if (index > 0) {
            group.remove();
          }
        });
        return;
      }

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

      if (!this.shouldAnimate()) {
        this.setupMarquee();
        return;
      }

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
