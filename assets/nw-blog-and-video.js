if (!customElements.get('nw-blog-and-video')) {
  class NwBlogAndVideo extends HTMLElement {
    connectedCallback() {
      this._blogLoadCount = parseInt(this.dataset.blogLoadMore, 10) || 4;
      this._videoLoadCount = parseInt(this.dataset.videoLoadMore, 10) || 3;
      this._mobileQuery = window.matchMedia('(max-width: 989px)');
      this._onMobileChange = this._handleMobileChange.bind(this);

      this._bindTabs();
      this._bindLoadMore();
      this._bindVideoPlay();
      this._mobileQuery.addEventListener('change', this._onMobileChange);
      this._syncPanelVisibility();
    }

    disconnectedCallback() {
      this._mobileQuery.removeEventListener('change', this._onMobileChange);
    }

    _handleMobileChange() {
      this._syncPanelVisibility();
    }

    _isMobileTabs() {
      return this._mobileQuery.matches && this.querySelector('.nw-blog-video__tabs');
    }

    _syncPanelVisibility() {
      var panels = this.querySelectorAll('[data-blog-video-panel]');
      if (!this._isMobileTabs()) {
        panels.forEach(function (panel) {
          panel.classList.add('nw-blog-video__panel--active');
          panel.removeAttribute('hidden');
        });
        return;
      }

      var activeTab = this.querySelector('.nw-blog-video__tab--active');
      var activeTarget = activeTab ? activeTab.dataset.blogVideoTab : 'blog';
      panels.forEach(function (panel) {
        var isActive = panel.dataset.blogVideoPanel === activeTarget;
        panel.classList.toggle('nw-blog-video__panel--active', isActive);
        if (isActive) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    }

    _bindTabs() {
      var tabs = this.querySelectorAll('[data-blog-video-tab]');
      if (!tabs.length) return;

      var self = this;
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          if (!self._isMobileTabs()) return;

          tabs.forEach(function (item) {
            var isActive = item === tab;
            item.classList.toggle('nw-blog-video__tab--active', isActive);
            item.setAttribute('aria-selected', isActive ? 'true' : 'false');
          });

          self._syncPanelVisibility();
        });
      });
    }

    _bindLoadMore() {
      var blogBtn = this.querySelector('[data-blog-video-load-blog]');
      var videoBtn = this.querySelector('[data-blog-video-load-video]');

      if (blogBtn) {
        blogBtn.addEventListener('click', this._loadMoreBlog.bind(this));
      }

      if (videoBtn) {
        videoBtn.addEventListener('click', this._loadMoreVideo.bind(this));
      }
    }

    _setVideoControlState(card, isPlaying) {
      if (!card) return;
      card.classList.toggle('is-playing', isPlaying);
      var btn = card.querySelector('[data-blog-video-play]');
      if (btn) {
        btn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
      }
    }

    _pauseOtherVideos(currentVideo) {
      var self = this;
      this.querySelectorAll('video').forEach(function (video) {
        if (video === currentVideo) return;
        video.pause();
        self._setVideoControlState(video.closest('[data-blog-video-card]'), false);
      });
    }

    _bindVideoPlay() {
      var self = this;

      this.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-blog-video-play]');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        var card = btn.closest('[data-blog-video-card]');
        if (!card) return;

        var video = card.querySelector('video');
        if (!video) return;

        if (!video.paused && !video.ended) {
          video.pause();
          self._setVideoControlState(card, false);
          return;
        }

        self._pauseOtherVideos(video);
        video.play();
        self._setVideoControlState(card, true);
      });

      this.addEventListener('play', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('[data-blog-video-card]'), true);
      }, true);

      this.addEventListener('ended', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('[data-blog-video-card]'), false);
      }, true);

      this.addEventListener('pause', function (e) {
        if (!e.target || e.target.tagName !== 'VIDEO') return;
        self._setVideoControlState(e.target.closest('[data-blog-video-card]'), false);
      }, true);
    }

    _loadMoreBlog() {
      var hiddenCards = this.querySelectorAll('[data-blog-video-blog-card].nw-blog-video__blog-card--hidden');
      if (!hiddenCards.length) return;

      var count = Math.min(this._blogLoadCount, hiddenCards.length);
      for (var i = 0; i < count; i += 1) {
        hiddenCards[i].classList.remove('nw-blog-video__blog-card--hidden');
      }

      if (!this.querySelector('[data-blog-video-blog-card].nw-blog-video__blog-card--hidden')) {
        var blogBtn = this.querySelector('[data-blog-video-load-blog]');
        if (blogBtn && blogBtn.closest('.nw-blog-video__actions')) {
          blogBtn.closest('.nw-blog-video__actions').hidden = true;
        }
      }
    }

    _loadMoreVideo() {
      var pool = this.querySelector('[data-blog-video-pool]');
      var wrapper = this.querySelector('[data-blog-video-grid-wrapper]');
      if (!pool || !wrapper) return;

      var hiddenCards = pool.querySelectorAll('[data-blog-video-card].nw-blog-video__video-card--hidden');
      if (!hiddenCards.length) return;

      var count = Math.min(this._videoLoadCount, hiddenCards.length);

      for (var i = 0; i < count; i += 1) {
        var card = hiddenCards[i];
        card.classList.remove('nw-blog-video__video-card--hidden');
        wrapper.appendChild(card);
      }

      if (!pool.querySelector('[data-blog-video-card].nw-blog-video__video-card--hidden')) {
        var videoBtn = this.querySelector('[data-blog-video-load-video]');
        if (videoBtn && videoBtn.closest('.nw-blog-video__actions')) {
          videoBtn.closest('.nw-blog-video__actions').hidden = true;
        }
      }
    }
  }

  customElements.define('nw-blog-and-video', NwBlogAndVideo);
}
