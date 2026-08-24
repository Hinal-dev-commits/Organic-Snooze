window.nwWhenSwiperReady = function (callback, timeoutMs) {
  if (typeof callback !== 'function') return;

  var maxWait = typeof timeoutMs === 'number' ? timeoutMs : 5000;

  if (typeof Swiper !== 'undefined') {
    callback();
    return;
  }

  var startedAt = Date.now();

  (function poll() {
    if (typeof Swiper !== 'undefined') {
      callback();
      return;
    }

    if (Date.now() - startedAt >= maxWait) return;

    window.setTimeout(poll, 50);
  })();
};
