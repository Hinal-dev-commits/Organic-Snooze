if (!customElements.get('nw-founder-story')) {
  class NwFounderStory extends HTMLElement {
    connectedCallback() {
      this._bindVideo();
    }

    _setPlayingState(media, isPlaying) {
      var playBtn = media.querySelector('[data-nw-founder-play]');
      var pauseBtn = media.querySelector('[data-nw-founder-pause]');

      media.classList.toggle('is-playing', isPlaying);

      if (playBtn) playBtn.hidden = isPlaying;
      if (pauseBtn) pauseBtn.hidden = !isPlaying;
    }

    _bindVideo() {
      var media = this.querySelector('[data-nw-founder-media]');
      if (!media || media.dataset.autoplay === 'true') return;

      var video = media.querySelector('video');
      if (!video) return;

      video.controls = false;
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      video.disablePictureInPicture = true;
      video.tabIndex = -1;

      var poster = media.querySelector('.nw-founder-story__media-poster');
      if (poster && poster.src) {
        video.setAttribute('poster', poster.src);
      }

      media.addEventListener('click', (e) => {
        var playBtn = e.target.closest('[data-nw-founder-play]');
        var pauseBtn = e.target.closest('[data-nw-founder-pause]');
        var isPoster = e.target.closest('.nw-founder-story__media-poster');

        if (playBtn || isPoster) {
          e.preventDefault();
          e.stopPropagation();
          this._setPlayingState(media, true);
          video.play();
          return;
        }

        if (pauseBtn) {
          e.preventDefault();
          e.stopPropagation();
          video.pause();
        }
      });

      video.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });

      video.addEventListener('play', () => {
        this._setPlayingState(media, true);
      });

      video.addEventListener('pause', () => {
        this._setPlayingState(media, false);
      });

      video.addEventListener('ended', () => {
        this._setPlayingState(media, false);
        video.currentTime = 0;
      });
    }
  }

  customElements.define('nw-founder-story', NwFounderStory);
}
