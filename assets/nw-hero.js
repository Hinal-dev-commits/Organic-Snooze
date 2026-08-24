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
      if (!countdownEl || typeof window.nwStartCountdown !== 'function') return;
      this._countdownInterval = window.nwStartCountdown(countdownEl);
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
