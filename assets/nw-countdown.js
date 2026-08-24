window.nwStartCountdown = function (root, options) {
  if (!root) return null;

  var settings = options || {};
  var targetDateStr = root.getAttribute('data-countdown-date');
  if (!targetDateStr || targetDateStr.trim() === '') return null;

  var hideOnEnd = root.getAttribute('data-hide-on-end') === 'true';
  var daysEl = root.querySelector(settings.days || '.nw-countdown-days');
  var hoursEl = root.querySelector(settings.hours || '.nw-countdown-hours');
  var minsEl = root.querySelector(settings.mins || '.nw-countdown-mins');
  var secsEl = root.querySelector(settings.secs || '.nw-countdown-secs');
  var targetDate = new Date(targetDateStr.replace(/-/g, '/')).getTime();
  var intervalId = null;

  function padZero(num) {
    return num < 10 ? '0' + num : String(num);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function updateTimer() {
    var diff = targetDate - Date.now();
    if (isNaN(targetDate)) {
      stop();
      return;
    }

    if (diff <= 0) {
      if (hideOnEnd) {
        root.style.display = 'none';
      } else {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
      }
      stop();
      return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = padZero(days);
    if (hoursEl) hoursEl.textContent = padZero(hours);
    if (minsEl) minsEl.textContent = padZero(mins);
    if (secsEl) secsEl.textContent = padZero(secs);
  }

  updateTimer();
  intervalId = setInterval(updateTimer, 1000);
  return intervalId;
};
