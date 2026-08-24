if (!customElements.get('nw-hero')) {
  class NwHero extends HTMLElement {
    connectedCallback() {
      this._initCountdown();
      this._initVideo();
    }

    disconnectedCallback() {
      if (this._countdownInterval) {
        clearInterval(this._countdownInterval);
        this._countdownInterval = null;
      }
    }

    _initCountdown() {
      var countdownEl = this.querySelector('[data-countdown-date]');
      if (!countdownEl) return;

      var targetDateStr = countdownEl.getAttribute('data-countdown-date');
      var hideOnEnd = countdownEl.getAttribute('data-hide-on-end') === 'true';
      var daysEl = countdownEl.querySelector('.nw-countdown-days');
      var hoursEl = countdownEl.querySelector('.nw-countdown-hours');
      var minsEl = countdownEl.querySelector('.nw-countdown-mins');
      var secsEl = countdownEl.querySelector('.nw-countdown-secs');

      function padZero(num) {
        return num < 10 ? '0' + num : num;
      }

      if (!targetDateStr || targetDateStr.trim() === '') return;

      var targetDate = new Date(targetDateStr.replace(/-/g, '/')).getTime();

      var updateTimer = () => {
        var now = new Date().getTime();
        var diff = targetDate - now;
        if (isNaN(targetDate)) return;
        if (diff <= 0) {
          if (hideOnEnd) {
            countdownEl.style.display = 'none';
          } else {
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minsEl) minsEl.textContent = '00';
            if (secsEl) secsEl.textContent = '00';
          }
          if (this._countdownInterval) {
            clearInterval(this._countdownInterval);
            this._countdownInterval = null;
          }
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
      };

      updateTimer();
      this._countdownInterval = setInterval(updateTimer, 1000);
    }

    _initVideo() {
      var playBtn = this.querySelector('.nw-hero__play-btn');
      var bgVideo = this.querySelector('.nw-hero__bg-video');
      if (!playBtn || !bgVideo) return;

      if (bgVideo.tagName === 'VIDEO') {
        if (!bgVideo.paused) {
          this.classList.add('is-video-playing');
        }
        bgVideo.addEventListener('play', () => {
          this.classList.add('is-video-playing');
        });
        bgVideo.addEventListener('pause', () => {
          this.classList.remove('is-video-playing');
        });
      }

      playBtn.addEventListener('click', () => {
        if (bgVideo.tagName === 'VIDEO') {
          if (bgVideo.paused) {
            bgVideo.play();
          } else {
            bgVideo.pause();
          }
        } else if (bgVideo.tagName === 'IFRAME') {
          if (this.classList.contains('is-video-playing')) {
            if (bgVideo.src.indexOf('youtube.com') !== -1) {
              bgVideo.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } else if (bgVideo.src.indexOf('vimeo.com') !== -1) {
              bgVideo.contentWindow.postMessage('{"method":"pause"}', '*');
            }
            this.classList.remove('is-video-playing');
          } else {
            if (bgVideo.src.indexOf('youtube.com') !== -1) {
              bgVideo.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            } else if (bgVideo.src.indexOf('vimeo.com') !== -1) {
              bgVideo.contentWindow.postMessage('{"method":"play"}', '*');
            }
            this.classList.add('is-video-playing');
          }
        }
      });
    }
  }

  customElements.define('nw-hero', NwHero);
}
