(function () {
  var sections = new WeakMap();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateTimeline(timeline) {
    var items = timeline.querySelectorAll('.nw-mattresses-timeline__layer-item');
    if (!items.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (item) {
        item.classList.add('is-filled');
        item.classList.remove('is-active');
        item.style.removeProperty('--line-fill');
      });
      return;
    }

    var trigger = window.innerHeight * 0.62;
    var activeIndex = -1;
    var lineFill = 0;

    items.forEach(function (item, index) {
      item.classList.remove('is-filled', 'is-active');
      item.style.removeProperty('--line-fill');

      var target = item.querySelector('.nw-mattresses-timeline__card-wrap') || item;
      var rect = target.getBoundingClientRect();
      var center = rect.top + rect.height * 0.35;

      if (center <= trigger) {
        activeIndex = index;
      }
    });

    if (activeIndex === -1) {
      var firstTarget = items[0].querySelector('.nw-mattresses-timeline__card-wrap') || items[0];
      var firstRect = firstTarget.getBoundingClientRect();
      if (firstRect.top < window.innerHeight * 0.9) {
        activeIndex = 0;
        lineFill = clamp((trigger - firstRect.top) / Math.max(firstRect.height, 1), 0, 1);
      }
    } else {
      var lastItem = items[items.length - 1];
      var lastTarget = lastItem.querySelector('.nw-mattresses-timeline__card-wrap') || lastItem;
      var lastRect = lastTarget.getBoundingClientRect();

      if (lastRect.bottom <= trigger) {
        items.forEach(function (item) {
          item.classList.add('is-filled');
          item.classList.remove('is-active');
          item.style.removeProperty('--line-fill');
        });
        return;
      }

      var activeItem = items[activeIndex];
      var activeTarget = activeItem.querySelector('.nw-mattresses-timeline__card-wrap') || activeItem;
      var activeRect = activeTarget.getBoundingClientRect();
      var nextItem = items[activeIndex + 1];
      var segmentEnd = trigger;

      if (nextItem) {
        var nextTarget = nextItem.querySelector('.nw-mattresses-timeline__card-wrap') || nextItem;
        var nextRect = nextTarget.getBoundingClientRect();
        segmentEnd = nextRect.top + nextRect.height * 0.35;
      }

      var segmentStart = activeRect.top + activeRect.height * 0.35;
      var segmentLength = Math.max(segmentEnd - segmentStart, 1);
      lineFill = clamp((trigger - segmentStart) / segmentLength, 0, 1);

      if (!nextItem && lineFill >= 0.85) {
        lineFill = 1;
      }
    }

    items.forEach(function (item, index) {
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

  function bindTimeline(section) {
    var timeline = section.querySelector('.nw-mattresses-timeline__timeline');
    if (!timeline) return;

    var state = sections.get(section);
    if (state) {
      window.removeEventListener('scroll', state.onScroll);
      window.removeEventListener('resize', state.onScroll);
    }

    var onScroll = function () {
      updateTimeline(timeline);
    };

    sections.set(section, { onScroll: onScroll });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  function initSection(section) {
    if (!section || !section.classList.contains('nw-mattresses-timeline')) return;
    bindTimeline(section);
  }

  function bootAll() {
    document.querySelectorAll('.nw-mattresses-timeline').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }

  window.addEventListener('load', bootAll);

  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (event) {
      var section = event.target.querySelector('.nw-mattresses-timeline');
      initSection(section || event.target);
    });

    document.addEventListener('shopify:section:unload', function (event) {
      var section = event.target.querySelector('.nw-mattresses-timeline') || event.target;
      var state = sections.get(section);
      if (!state) return;
      window.removeEventListener('scroll', state.onScroll);
      window.removeEventListener('resize', state.onScroll);
      sections.delete(section);
    });
  }
})();
