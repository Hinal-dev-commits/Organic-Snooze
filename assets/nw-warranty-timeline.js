if (!customElements.get('nw-warranty-timeline')) {
  class NwWarrantyTimeline extends HTMLElement {
    connectedCallback() {
      this.steps = this.querySelectorAll('.nw-warranty-timeline__step');
      if (this.steps.length === 0) return;

      this.onScroll = this.onScroll.bind(this);
      this.rafId = null;

      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll, { passive: true });

      requestAnimationFrame(() => {
        this.updateTimeline();
      });
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onScroll);
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
    }

    onScroll() {
      if (this.rafId) return;
      this.rafId = requestAnimationFrame(() => {
        this.updateTimeline();
        this.rafId = null;
      });
    }

    updateTimeline() {
      if (!this.steps || this.steps.length === 0) return;

      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const triggerPoint = windowHeight * 0.6;

      this.steps.forEach((step, index) => {
        const dot = step.querySelector('.nw-warranty-timeline__dot');
        const lineFill = step.querySelector('.nw-warranty-timeline__line-fill');
        const nextStep = this.steps[index + 1];

        if (index === 0) {
          step.classList.add('is-active');
        }

        if (!dot) return;
        const dotRect = dot.getBoundingClientRect();
        const dotCenterY = dotRect.top + dotRect.height / 2;

        if (dotCenterY <= triggerPoint) {
          step.classList.add('is-active');
        } else if (index > 0) {
          step.classList.remove('is-active');
        }

        // Calculate progress of line connecting to next step
        if (lineFill && nextStep) {
          const nextDot = nextStep.querySelector('.nw-warranty-timeline__dot');
          if (nextDot) {
            const nextDotRect = nextDot.getBoundingClientRect();
            const nextDotCenterY = nextDotRect.top + nextDotRect.height / 2;
            const stepDistance = nextDotCenterY - dotCenterY;

            if (stepDistance > 0) {
              const currentProgress = triggerPoint - dotCenterY;
              const ratio = Math.max(0, Math.min(1, currentProgress / stepDistance));
              lineFill.style.height = `${(ratio * 100).toFixed(1)}%`;
            }
          }
        }
      });
    }
  }

  customElements.define('nw-warranty-timeline', NwWarrantyTimeline);
}
