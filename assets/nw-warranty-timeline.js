(function () {
  function setPlayingState(media, isPlaying) {
    var playBtn = media.querySelector('[data-nw-wt-play]');
    var pauseBtn = media.querySelector('[data-nw-wt-pause]');

    media.classList.toggle('is-playing', isPlaying);

    if (playBtn) playBtn.hidden = isPlaying;
    if (pauseBtn) pauseBtn.hidden = !isPlaying;
  }

  function getPosterSrc(media) {
    var mobilePoster = media.querySelector('.nw-warranty-timeline__poster.nw-warranty-timeline__img--mobile');
    var desktopPoster = media.querySelector('.nw-warranty-timeline__poster.nw-warranty-timeline__img--desktop');
    var singlePoster = media.querySelector(
      '.nw-warranty-timeline__poster:not(.nw-warranty-timeline__img--desktop):not(.nw-warranty-timeline__img--mobile)'
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

  function bindTimelineVideo(media) {
    if (!media || media._nwWtVideoBound) return;
    if (media.dataset.autoplay === 'true') return;

    var video = media.querySelector('video');
    if (!video) return;

    media._nwWtVideoBound = true;

    video.controls = false;
    video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
    video.disablePictureInPicture = true;
    video.tabIndex = -1;

    syncVideoPoster(media, video);

    var onResizePoster = function () {
      syncVideoPoster(media, video);
    };

    window.addEventListener('resize', onResizePoster);
    media._nwWtResizePoster = onResizePoster;

    media.addEventListener('click', function (e) {
      var playBtn = e.target.closest('[data-nw-wt-play]');
      var pauseBtn = e.target.closest('[data-nw-wt-pause]');
      var isPoster = e.target.closest('.nw-warranty-timeline__poster');

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

  function initTimelineVideos(root) {
    if (!root) return;

    var scope = root.matches && root.matches('[data-nw-warranty-timeline-media]')
      ? [root]
      : Array.from(root.querySelectorAll('[data-nw-warranty-timeline-media]'));

    scope.forEach(bindTimelineVideo);
  }

  if (!customElements.get('nw-warranty-timeline')) {
    class NwWarrantyTimeline extends HTMLElement {
      connectedCallback() {
        this.steps = Array.from(this.querySelectorAll('.nw-warranty-timeline__step'));
        this.triggerRatio = (parseInt(this.dataset.scrollTrigger, 10) || 60) / 100;
        this.onScroll = this.onScroll.bind(this);
        this.rafId = null;

        initTimelineVideos(this);

        if (this.steps.length === 0) return;

        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onScroll, { passive: true });

        requestAnimationFrame(() => {
          this.updateTimeline();
        });

        window.setTimeout(() => {
          this.updateTimeline();
        }, 150);
      }

      disconnectedCallback() {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onScroll);

        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
        }
      }

      onScroll() {
        if (this.rafId) return;

        this.rafId = requestAnimationFrame(() => {
          this.updateTimeline();
          this.rafId = null;
        });
      }

      updateTimeline() {
        if (!this.steps || this.steps.length === 0) return;

        var windowHeight = window.innerHeight || document.documentElement.clientHeight;
        var triggerPoint = windowHeight * this.triggerRatio;

        this.steps.forEach(function (step, index) {
          var dot = step.querySelector('.nw-warranty-timeline__dot');
          var lineFill = step.querySelector('.nw-warranty-timeline__line-fill');
          var nextStep = this.steps[index + 1];

          step.classList.remove('is-active', 'is-passed');

          if (!dot) return;

          var dotRect = dot.getBoundingClientRect();
          var dotCenterY = dotRect.top + dotRect.height / 2;
          var isDotReached = dotCenterY <= triggerPoint;

          if (isDotReached) {
            step.classList.add('is-active');
          }

          if (lineFill && nextStep) {
            var nextDot = nextStep.querySelector('.nw-warranty-timeline__dot');

            if (nextDot) {
              var nextDotRect = nextDot.getBoundingClientRect();
              var nextDotCenterY = nextDotRect.top + nextDotRect.height / 2;
              var stepDistance = nextDotCenterY - dotCenterY;
              var ratio = 0;

              if (stepDistance > 0) {
                ratio = (triggerPoint - dotCenterY) / stepDistance;
                ratio = Math.max(0, Math.min(1, ratio));
              }

              lineFill.style.height = (ratio * 100).toFixed(1) + '%';

              if (ratio >= 0.999) {
                step.classList.add('is-passed');
              }
            }
          } else if (isDotReached) {
            step.classList.add('is-passed');
          }
        }, this);

        var lastActiveIndex = -1;

        this.steps.forEach(function (step, index) {
          if (step.classList.contains('is-active')) {
            lastActiveIndex = index;
          }
        });

        this.steps.forEach(function (step, index) {
          if (index >= lastActiveIndex || lastActiveIndex < 0) return;

          step.classList.add('is-passed');

          var fill = step.querySelector('.nw-warranty-timeline__line-fill');
          if (fill) {
            fill.style.height = '100%';
          }
        });
      }
    }

    customElements.define('nw-warranty-timeline', NwWarrantyTimeline);
  }

  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (e) {
      var section =
        e.target.querySelector('nw-warranty-timeline') ||
        (e.target.tagName === 'NW-WARRANTY-TIMELINE' ? e.target : null);

      if (section) {
        initTimelineVideos(section);
        if (typeof section.updateTimeline === 'function') {
          section.updateTimeline();
        }
      }
    });
  }
})();
