(function () {
  function setPlayingState(media, isPlaying) {
    var playBtn = media.querySelector('[data-nw-organic-play]');
    var pauseBtn = media.querySelector('[data-nw-organic-pause]');

    media.classList.toggle('is-playing', isPlaying);

    if (playBtn) playBtn.hidden = isPlaying;
    if (pauseBtn) pauseBtn.hidden = !isPlaying;
  }

  function getPosterSrc(media) {
    var mobilePoster = media.querySelector('.nw-organic__poster.nw-organic__img--mobile');
    var desktopPoster = media.querySelector('.nw-organic__poster.nw-organic__img--desktop');
    var singlePoster = media.querySelector(
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

  function syncVideoPoster(media, video) {
    var posterSrc = getPosterSrc(media);
    if (posterSrc) {
      video.setAttribute('poster', posterSrc);
    }
  }

  function bindOrganicVideo(media) {
    if (!media || media._nwOrganicVideoBound) return;
    if (media.dataset.autoplay === 'true') return;

    var video = media.querySelector('video');
    if (!video) return;

    media._nwOrganicVideoBound = true;

    video.controls = false;
    video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
    video.disablePictureInPicture = true;
    video.tabIndex = -1;

    syncVideoPoster(media, video);

    var onResizePoster = function () {
      syncVideoPoster(media, video);
    };

    window.addEventListener('resize', onResizePoster);
    media._nwOrganicResizePoster = onResizePoster;

    media.addEventListener('click', function (e) {
      var playBtn = e.target.closest('[data-nw-organic-play]');
      var pauseBtn = e.target.closest('[data-nw-organic-pause]');
      var isPoster = e.target.closest('.nw-organic__poster');

      if (playBtn || isPoster) {
        e.preventDefault();
        e.stopPropagation();
        setPlayingState(media, true);
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

    video.addEventListener('play', function () {
      setPlayingState(media, true);
    });

    video.addEventListener('pause', function () {
      setPlayingState(media, false);
    });

    video.addEventListener('ended', function () {
      setPlayingState(media, false);
      video.currentTime = 0;
    });
  }

  function initOrganicVideos(root) {
    if (!root) return;

    root.querySelectorAll('[data-nw-organic-media]').forEach(bindOrganicVideo);
  }

  function bootAll() {
    document.querySelectorAll('.nw-organic').forEach(initOrganicVideos);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }

  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (e) {
      var section = e.target.querySelector('.nw-organic') ||
        (e.target.classList.contains('nw-organic') ? e.target : null);
      if (section) initOrganicVideos(section);
    });
  }
})();
