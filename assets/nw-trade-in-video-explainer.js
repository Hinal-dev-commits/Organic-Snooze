if (!customElements.get('nw-trade-in-video-explainer')) {
  class NwTradeInVideoExplainer extends HTMLElement {
    connectedCallback() {
      this._bindVideos();
    }

    _formatDuration(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '';
      var total = Math.max(0, Math.floor(seconds));
      var mins = Math.floor(total / 60);
      var secs = total % 60;
      return mins + ':' + String(secs).padStart(2, '0');
    }

    _parseManualDuration(manual) {
      if (!manual || String(manual).trim() === '') return NaN;
      var parts = String(manual).trim().split(':');
      if (parts.length !== 2) return NaN;
      var mins = parseInt(parts[0], 10);
      var secs = parseInt(parts[1], 10);
      if (!Number.isFinite(mins) || !Number.isFinite(secs)) return NaN;
      return mins * 60 + secs;
    }

    _resolveDuration(video, badge) {
      if (video.duration && Number.isFinite(video.duration) && video.duration > 0) {
        return video.duration;
      }
      if (!badge) return NaN;
      return this._parseManualDuration(badge.getAttribute('data-duration-manual'));
    }

    _syncDurationBadge(media, video) {
      var badge = media.querySelector('[data-nw-tive-duration]');
      if (!badge || !video) return;

      if (video.ended) {
        badge.textContent = '0:00';
        return;
      }

      var duration = this._resolveDuration(video, badge);
      if (!Number.isFinite(duration) || duration <= 0) return;

      var remaining = duration - video.currentTime;
      if (remaining <= 0) {
        badge.textContent = '0:00';
        return;
      }

      badge.textContent = this._formatDuration(Math.ceil(remaining));
    }

    _setPlayingState(media, isPlaying) {
      var playBtn = media.querySelector('[data-nw-tive-play]');
      var pauseBtn = media.querySelector('[data-nw-tive-pause]');

      media.classList.toggle('is-playing', isPlaying);
      if (playBtn) playBtn.hidden = isPlaying;
      if (pauseBtn) pauseBtn.hidden = !isPlaying;
    }

    _bindMediaVideo(media) {
      var video = media.querySelector('video');
      if (!video) return;

      video.controls = false;
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      video.disablePictureInPicture = true;
      video.tabIndex = -1;

      var syncBadge = () => this._syncDurationBadge(media, video);

      video.addEventListener('loadedmetadata', syncBadge);
      video.addEventListener('durationchange', syncBadge);
      video.addEventListener('timeupdate', syncBadge);
      video.addEventListener('seeked', syncBadge);
      if (video.readyState >= 1) syncBadge();

      media.addEventListener('click', (e) => {
        if (!media.contains(e.target)) return;

        e.preventDefault();

        if (video.paused || video.ended) {
          video.muted = false;
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
          }
          return;
        }

        video.pause();
      });

      video.addEventListener('play', () => this._setPlayingState(media, true));
      video.addEventListener('pause', () => {
        syncBadge();
        if (!video.ended) this._setPlayingState(media, false);
      });
      video.addEventListener('ended', () => {
        syncBadge();
        this._setPlayingState(media, false);
      });
    }

    _bindVideos() {
      this.querySelectorAll('[data-nw-tive-media]').forEach((media) => {
        this._bindMediaVideo(media);
      });
    }
  }

  customElements.define('nw-trade-in-video-explainer', NwTradeInVideoExplainer);
}
