if (!customElements.get('nw-mattresses-timeline')) {
  class NwMattressesTimeline extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this._timeline = this.querySelector('.nw-mattresses-timeline__timeline');
      if (!this._timeline) return;

      this._onScroll = () => {
        this._updateTimeline(this._timeline);
      };

      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onScroll);
      this._onScroll();
    }

    disconnectedCallback() {
      if (this._onScroll) {
        window.removeEventListener('scroll', this._onScroll);
        window.removeEventListener('resize', this._onScroll);
        this._onScroll = null;
      }

      this._timeline = null;
      this._initialized = false;
    }

    _clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    _updateTimeline(timeline) {
      const items = timeline.querySelectorAll('.nw-mattresses-timeline__layer-item');
      if (!items.length) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach((item) => {
          item.classList.add('is-filled');
          item.classList.remove('is-active');
          item.style.removeProperty('--line-fill');
        });
        return;
      }

      const trigger = window.innerHeight * 0.62;
      let activeIndex = -1;
      let lineFill = 0;

      items.forEach((item, index) => {
        item.classList.remove('is-filled', 'is-active');
        item.style.removeProperty('--line-fill');

        const target = item.querySelector('.nw-mattresses-timeline__card-wrap') || item;
        const rect = target.getBoundingClientRect();
        const center = rect.top + rect.height * 0.35;

        if (center <= trigger) {
          activeIndex = index;
        }
      });

      if (activeIndex === -1) {
        const firstTarget = items[0].querySelector('.nw-mattresses-timeline__card-wrap') || items[0];
        const firstRect = firstTarget.getBoundingClientRect();
        if (firstRect.top < window.innerHeight * 0.9) {
          activeIndex = 0;
          lineFill = this._clamp((trigger - firstRect.top) / Math.max(firstRect.height, 1), 0, 1);
        }
      } else {
        const lastItem = items[items.length - 1];
        const lastTarget = lastItem.querySelector('.nw-mattresses-timeline__card-wrap') || lastItem;
        const lastRect = lastTarget.getBoundingClientRect();

        if (lastRect.bottom <= trigger) {
          items.forEach((item) => {
            item.classList.add('is-filled');
            item.classList.remove('is-active');
            item.style.removeProperty('--line-fill');
          });
          return;
        }

        const activeItem = items[activeIndex];
        const activeTarget = activeItem.querySelector('.nw-mattresses-timeline__card-wrap') || activeItem;
        const activeRect = activeTarget.getBoundingClientRect();
        const nextItem = items[activeIndex + 1];
        let segmentEnd = trigger;

        if (nextItem) {
          const nextTarget = nextItem.querySelector('.nw-mattresses-timeline__card-wrap') || nextItem;
          const nextRect = nextTarget.getBoundingClientRect();
          segmentEnd = nextRect.top + nextRect.height * 0.35;
        }

        const segmentStart = activeRect.top + activeRect.height * 0.35;
        const segmentLength = Math.max(segmentEnd - segmentStart, 1);
        lineFill = this._clamp((trigger - segmentStart) / segmentLength, 0, 1);

        if (!nextItem && lineFill >= 0.85) {
          lineFill = 1;
        }
      }

      items.forEach((item, index) => {
        if (index < activeIndex) {
          item.classList.add('is-filled');
        } else if (index === activeIndex) {
          item.classList.add('is-active');
          if (item.querySelector('.nw-mattresses-timeline__line-bottom')) {
            item.style.setProperty('--line-fill', String(lineFill));
          }
        }
      });
    }
  }

  customElements.define('nw-mattresses-timeline', NwMattressesTimeline);
}
