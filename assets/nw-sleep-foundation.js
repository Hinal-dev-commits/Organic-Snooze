if (!customElements.get('nw-sleep-foundation')) {
  class NwSleepFoundation extends HTMLElement {
    connectedCallback() {
      this._videoBound = false;
      this._bindVideoEvents();
    }

    _pauseOtherVideos(currentVideo) {
      this.querySelectorAll('video').forEach(function (video) {
        if (video !== currentVideo) {
          video.pause();
          var card = video.closest('.nw-sleep-foundation__card');
          if (card) card.classList.remove('is-playing');
        }
      });
    }

    _bindVideoEvents() {
      if (this._videoBound) return;
      this._videoBound = true;

      this.addEventListener('click', (e) => {
        var btn = e.target.closest('[data-nw-sf-play]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        var card = btn.closest('.nw-sleep-foundation__card');
        if (!card) return;
        var video = card.querySelector('video');
        if (!video) return;
        this._pauseOtherVideos(video);
        card.classList.add('is-playing');
        video.play();
      });

      this.addEventListener('pause', (e) => {
        if (e.target && e.target.tagName === 'VIDEO') {
          var card = e.target.closest('.nw-sleep-foundation__card');
          if (e.target.currentTime === 0 || e.target.ended) {
            if (card) card.classList.remove('is-playing');
          }
        }
      }, true);

      this.addEventListener('ended', (e) => {
        if (e.target && e.target.tagName === 'VIDEO') {
          var card = e.target.closest('.nw-sleep-foundation__card');
          if (card) card.classList.remove('is-playing');
        }
      }, true);
    }
  }

  customElements.define('nw-sleep-foundation', NwSleepFoundation);
}
