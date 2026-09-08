if (!customElements.get('nw-organic')) {
  class NwOrganic extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this._mediaHandlers = [];
      this.querySelectorAll('[data-nw-organic-media]').forEach((media) => {
        this._bindOrganicVideo(media);
      });
    }

    disconnectedCallback() {
      if (this._mediaHandlers) {
        this._mediaHandlers.forEach(({ media, resizeHandler }) => {
          if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
          }
          media._nwOrganicVideoBound = false;
        });
        this._mediaHandlers = null;
      }

      this._initialized = false;
    }

    _setPlayingState(media, isPlaying) {
      const playBtn = media.querySelector('[data-nw-organic-play]');
      const pauseBtn = media.querySelector('[data-nw-organic-pause]');

      media.classList.toggle('is-playing', isPlaying);

      if (playBtn) playBtn.hidden = isPlaying;
      if (pauseBtn) pauseBtn.hidden = !isPlaying;
    }

    _getPosterSrc(media) {
      const mobilePoster = media.querySelector('.nw-organic__poster.nw-organic__img--mobile');
      const desktopPoster = media.querySelector('.nw-organic__poster.nw-organic__img--desktop');
      const singlePoster = media.querySelector(
        '.nw-organic__poster:not(.nw-organic__img--desktop):not(.nw-organic__img--mobile)'
      );

      if (window.matchMedia('(max-width: 749px)').matches && mobilePoster && mobilePoster.src) {
        return mobilePoster.src;
      }

      if (desktopPoster && desktopPoster.src) return desktopPoster.src;
      if (singlePoster && singlePoster.src) return singlePoster.src;
      if (mobilePoster && mobilePoster.src) return mobilePoster.src;
      return '';
    }

    _syncVideoPoster(media, video) {
      const posterSrc = this._getPosterSrc(media);
      if (posterSrc) {
        video.setAttribute('poster', posterSrc);
      }
    }

    _bindOrganicVideo(media) {
      if (!media || media._nwOrganicVideoBound) return;
      if (media.dataset.autoplay === 'true') return;

      const video = media.querySelector('video');
      if (!video) return;

      media._nwOrganicVideoBound = true;

      video.controls = false;
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      video.disablePictureInPicture = true;
      video.tabIndex = -1;

      this._syncVideoPoster(media, video);

      const onResizePoster = () => {
        this._syncVideoPoster(media, video);
      };

      window.addEventListener('resize', onResizePoster);
      this._mediaHandlers.push({ media, resizeHandler: onResizePoster });

      media.addEventListener('click', (e) => {
        const playBtn = e.target.closest('[data-nw-organic-play]');
        const pauseBtn = e.target.closest('[data-nw-organic-pause]');
        const isPoster = e.target.closest('.nw-organic__poster');

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

      video.addEventListener('click', (e) => {
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

  customElements.define('nw-organic', NwOrganic);
}
