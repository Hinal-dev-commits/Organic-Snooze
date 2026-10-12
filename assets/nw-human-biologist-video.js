(function () {
  function setPlayingState(media, isPlaying) {
    var playBtn = media.querySelector('[data-nw-hb-play]');
    var pauseBtn = media.querySelector('[data-nw-hb-pause]');

    media.classList.toggle('is-playing', isPlaying);

    if (playBtn) playBtn.hidden = isPlaying;
    if (pauseBtn) pauseBtn.hidden = !isPlaying;
  }

  function getActiveVideo(media) {
    var isMobile = window.matchMedia('(max-width: 749px)').matches;
    var mobile = media.querySelector('.nw-human-biologist__video--mobile');
    var desktop = media.querySelector('.nw-human-biologist__video--desktop');
    var shared = media.querySelector('.nw-human-biologist__video--both');

    if (isMobile) {
      return mobile || shared || desktop;
    }

    return desktop || shared || mobile;
  }

  function syncVideoPoster(media, video) {
    if (!video) return;

    var isMobile = window.matchMedia('(max-width: 749px)').matches;
    var posterSrc = '';

    if (isMobile && media.dataset.posterMobile) {
      posterSrc = media.dataset.posterMobile;
    } else if (media.dataset.posterDesktop) {
      posterSrc = media.dataset.posterDesktop;
    } else if (video.getAttribute('poster')) {
      posterSrc = video.getAttribute('poster');
    }

    if (posterSrc) {
      video.setAttribute('poster', posterSrc);
    }
  }

  function pauseAllVideos(media, except) {
    media.querySelectorAll('video').forEach(function (video) {
      if (video !== except && !video.paused) {
        video.pause();
      }
    });
  }

  function bindManualVideo(media) {
    if (!media || media._nwHbVideoBound) return;
    if (media.dataset.autoplay === 'true') return;

    media._nwHbVideoBound = true;

    media.querySelectorAll('video').forEach(function (video) {
      video.controls = false;
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      video.disablePictureInPicture = true;
      video.tabIndex = -1;
      syncVideoPoster(media, video);
    });

    var onResizePoster = function () {
      media.querySelectorAll('video').forEach(function (video) {
        syncVideoPoster(media, video);
      });
    };

    window.addEventListener('resize', onResizePoster);
    media._nwHbResizePoster = onResizePoster;

    media.addEventListener('click', function (e) {
      var playBtn = e.target.closest('[data-nw-hb-play]');
      var pauseBtn = e.target.closest('[data-nw-hb-pause]');
      var video = getActiveVideo(media);

      if (!video) return;

      if (playBtn) {
        e.preventDefault();
        e.stopPropagation();
        pauseAllVideos(media, video);
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

    media.querySelectorAll('video').forEach(function (video) {
      video.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });

      video.addEventListener('play', function () {
        pauseAllVideos(media, video);
        setPlayingState(media, true);
      });

      video.addEventListener('pause', function () {
        var active = getActiveVideo(media);
        if (active === video) {
          setPlayingState(media, false);
        }
      });

      video.addEventListener('ended', function () {
        setPlayingState(media, false);
        video.currentTime = 0;
        syncVideoPoster(media, video);
      });
    });
  }

  function initManualVideos(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll ? scope.querySelectorAll('[data-nw-hb-media]') : [];

    nodes.forEach(bindManualVideo);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initManualVideos(document);
  });

  document.addEventListener('shopify:section:load', function (event) {
    initManualVideos(event.target);
  });
})();
