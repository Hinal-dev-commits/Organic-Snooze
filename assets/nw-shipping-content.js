(function () {
  function updateScrollbars(root) {
    var container = root || document;
    var tracks = container.querySelectorAll('.nw-shipping-content__scrollbar-track');

    tracks.forEach(function (track) {
      var group = track.closest('.nw-shipping-content__table-group');
      if (!group) return;
      var scrollEl = group.querySelector('.nw-shipping-content__table-scroll');
      var thumb = track.querySelector('.nw-shipping-content__scrollbar-thumb');

      if (!scrollEl || !thumb) return;

      function update() {
        var scrollWidth = scrollEl.scrollWidth;
        var clientWidth = scrollEl.clientWidth;
        var maxScroll = scrollWidth - clientWidth;
        var ratio = 0;

        if (maxScroll > 0) {
          ratio = Math.max(0, Math.min(1, scrollEl.scrollLeft / maxScroll));
        }

        var fillPercent = (35 + (ratio * 65)).toFixed(1);
        thumb.style.width = fillPercent + '%';
      }

      scrollEl.removeEventListener('scroll', track._nwScrollFn);
      track._nwScrollFn = update;
      scrollEl.addEventListener('scroll', update, { passive: true });
      scrollEl.addEventListener('touchmove', update, { passive: true });
      scrollEl.addEventListener('pointermove', update, { passive: true });

      window.removeEventListener('resize', track._nwResizeFn);
      track._nwResizeFn = update;
      window.addEventListener('resize', update, { passive: true });

      update();
      requestAnimationFrame(update);
      setTimeout(update, 100);
      setTimeout(update, 300);
      setTimeout(update, 800);
    });
  }

  if (!customElements.get('nw-shipping-content')) {
    class NwShippingContent extends HTMLElement {
      connectedCallback() {
        updateScrollbars(this);
      }
    }
    customElements.define('nw-shipping-content', NwShippingContent);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      updateScrollbars();
    });
  } else {
    updateScrollbars();
  }

  document.addEventListener('shopify:section:load', function (e) {
    updateScrollbars(e.target);
  });
  window.addEventListener('load', function () {
    updateScrollbars();
  });
})();
