if (!customElements.get('nw-blog-and-video')) {
  class NwBlogAndVideo extends HTMLElement {
    connectedCallback() {
      this._blogLoadCount = parseInt(this.dataset.blogLoadMore, 10) || 4;
      this._videoLoadCount = parseInt(this.dataset.videoLoadMore, 10) || 3;
      this._blogInitialCount = parseInt(this.dataset.blogInitialCount, 10) || 8;
      this._videoInitialCount = parseInt(this.dataset.videoInitialCount, 10) || 3;
      this._mobileQuery = window.matchMedia('(max-width: 989px)');
      this._onMobileChange = this._handleMobileChange.bind(this);

      this._bindTabs();
      this._bindLoadMore();
      this._bindFilters();
      this._bindVideoPlay();
      this._saveVideoCardOrigins();
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

    _bindFilters() {
      var self = this;

      this.querySelectorAll('[data-blog-video-topic]').forEach(function (select) {
        select.addEventListener('change', function () {
          self._applyFilters(select.dataset.blogVideoTopic);
        });
      });

      this.querySelectorAll('[data-blog-video-search]').forEach(function (input) {
        input.addEventListener('input', function () {
          self._applyFilters(input.dataset.blogVideoSearch);
        });
      });
    }

    _normalize(value) {
      return (value || '').trim().toLowerCase();
    }

    _getCardSearchText(card) {
      var parts = [];
      card.querySelectorAll(
        '.nw-blog-video__blog-tag, .nw-blog-video__blog-media-tag, .nw-blog-video__blog-title, .nw-blog-video__blog-author, .nw-blog-video__blog-read-time, .nw-blog-video__video-tag, .nw-blog-video__video-title'
      ).forEach(function (el) {
        parts.push(el.textContent || '');
      });
      return parts.join(' ');
    }

    _cardMatchesFilters(card, topicValue, query) {
      var cardTag = this._normalize(card.dataset.topicTag || '');
      var topic = this._normalize(topicValue);
      var topicMatch = topic === 'all' || topic === '' || cardTag === topic;
      var searchMatch = !query || this._normalize(this._getCardSearchText(card)).indexOf(query) !== -1;
      return topicMatch && searchMatch;
    }

    _isPanelFiltering(panel) {
      var topicSelect = panel.querySelector('[data-blog-video-topic]');
      var searchInput = panel.querySelector('[data-blog-video-search]');
      var topic = topicSelect ? topicSelect.value : 'all';
      var query = searchInput ? searchInput.value.trim() : '';
      return topic !== 'all' || query.length > 0;
    }

    _isFeaturedVideoCard(card) {
      return !!card.closest('[data-blog-video-featured]');
    }

    _saveVideoCardOrigins() {
      var panel = this.querySelector('[data-blog-video-panel="video"]');
      if (!panel) return;

      panel.querySelectorAll('[data-blog-video-card]').forEach(function (card) {
        if (this._isFeaturedVideoCard(card) || card._nwOriginalParent) return;
        card._nwOriginalParent = card.parentElement;
        card._nwOriginalHidden = card.classList.contains('nw-blog-video__video-card--hidden');
      }, this);
    }

    _getVideoSidebarCount() {
      return Math.min(2, this._videoInitialCount);
    }

    _applyFilters(panelType) {
      if (panelType === 'blog') {
        this._applyBlogFilters();
        return;
      }

      if (panelType === 'video') {
        this._applyVideoFilters();
      }
    }

    _applyBlogFilters() {
      var panel = this.querySelector('[data-blog-video-panel="blog"]');
      if (!panel) return;

      var topicSelect = panel.querySelector('[data-blog-video-topic="blog"]');
      var searchInput = panel.querySelector('[data-blog-video-search="blog"]');
      var topicValue = topicSelect ? topicSelect.value : 'all';
      var query = this._normalize(searchInput ? searchInput.value : '');
      var isFiltering = this._isPanelFiltering(panel);
      var cards = panel.querySelectorAll('[data-blog-video-blog-card]');

      panel.classList.toggle('is-filter-active', isFiltering);

      cards.forEach(function (card) {
        card.classList.remove('nw-blog-video__blog-card--filter-hidden');

        if (isFiltering) {
          var visible = this._cardMatchesFilters(card, topicValue, query);
          card.classList.toggle('nw-blog-video__blog-card--filter-hidden', !visible);
          if (visible) {
            card.classList.remove('nw-blog-video__blog-card--hidden');
          }
          return;
        }

        card.classList.remove('nw-blog-video__blog-card--filter-hidden');
      }, this);

      if (!isFiltering) {
        this._restoreBlogLimit();
      }
    }

    _applyVideoFilters() {
      var panel = this.querySelector('[data-blog-video-panel="video"]');
      if (!panel) return;

      var topicSelect = panel.querySelector('[data-blog-video-topic="video"]');
      var searchInput = panel.querySelector('[data-blog-video-search="video"]');
      var topicValue = topicSelect ? topicSelect.value : 'all';
      var query = this._normalize(searchInput ? searchInput.value : '');
      var isFiltering = this._isPanelFiltering(panel);

      panel.classList.toggle('is-filter-active', isFiltering);

      if (isFiltering) {
        this._layoutFilteredVideos(panel, topicValue, query);
        return;
      }

      this._restoreVideoLayout();
      this._restoreVideoLimit();
    }

    _layoutFilteredVideos(panel, topicValue, query) {
      var grid = panel.querySelector('[data-blog-video-grid]');
      var wrapper = panel.querySelector('[data-blog-video-grid-wrapper]');
      var pool = panel.querySelector('[data-blog-video-pool]');
      if (!grid || !wrapper) return;

      var sidebarCount = this._getVideoSidebarCount();
      var visibleCards = [];

      panel.querySelectorAll('[data-blog-video-card]').forEach(function (card) {
        if (this._isFeaturedVideoCard(card)) {
          card.classList.remove('nw-blog-video__video-card--filter-hidden');
          card.classList.remove('nw-blog-video__video-card--hidden');
          return;
        }

        var matches = this._cardMatchesFilters(card, topicValue, query);
        card.classList.toggle('nw-blog-video__video-card--filter-hidden', !matches);

        if (matches) {
          visibleCards.push(card);
        }
      }, this);

      if (pool) {
        pool.setAttribute('hidden', '');
      }

      visibleCards.forEach(function (card, index) {
        card.classList.remove('nw-blog-video__video-card--hidden');

        if (index < sidebarCount) {
          grid.appendChild(card);
          return;
        }

        wrapper.appendChild(card);
      });

      wrapper.hidden = visibleCards.length <= sidebarCount;
    }

    _restoreVideoLayout() {
      var panel = this.querySelector('[data-blog-video-panel="video"]');
      if (!panel) return;

      panel.querySelectorAll('[data-blog-video-card]').forEach(function (card) {
        if (this._isFeaturedVideoCard(card)) return;

        if (card._nwOriginalParent) {
          card._nwOriginalParent.appendChild(card);
        }

        card.classList.remove('nw-blog-video__video-card--filter-hidden');

        if (card._nwOriginalHidden) {
          card.classList.add('nw-blog-video__video-card--hidden');
        } else {
          card.classList.remove('nw-blog-video__video-card--hidden');
        }
      }, this);

      var wrapper = panel.querySelector('[data-blog-video-grid-wrapper]');
      if (wrapper) {
        wrapper.hidden = false;
      }
    }

    _restoreBlogLimit() {
      var blogBtn = this.querySelector('[data-blog-video-load-blog]');
      var isExpanded = blogBtn && blogBtn.classList.contains('is-expanded');
      var cards = this.querySelectorAll('[data-blog-video-panel="blog"] [data-blog-video-blog-card]');

      cards.forEach(function (card, index) {
        if (isExpanded || index < this._blogInitialCount) {
          card.classList.remove('nw-blog-video__blog-card--hidden');
        } else {
          card.classList.add('nw-blog-video__blog-card--hidden');
        }
      }, this);
    }

    _restoreVideoLimit() {
      var videoBtn = this.querySelector('[data-blog-video-load-video]');
      var isExpanded = videoBtn && videoBtn.classList.contains('is-expanded');
      var panel = this.querySelector('[data-blog-video-panel="video"]');
      if (!panel || this._isPanelFiltering(panel)) return;

      var pool = panel.querySelector('[data-blog-video-pool]');
      var wrapper = panel.querySelector('[data-blog-video-grid-wrapper]');

      if (wrapper && pool) {
        Array.from(wrapper.querySelectorAll('[data-blog-video-card]')).forEach(function (card) {
          card.classList.add('nw-blog-video__video-card--hidden');
          pool.appendChild(card);
        });
      }

      panel.querySelectorAll('[data-blog-video-grid] [data-blog-video-card]').forEach(function (card) {
        card.classList.remove('nw-blog-video__video-card--hidden');
      });

      if (pool) {
        pool.setAttribute('hidden', '');
      }

      if (isExpanded && pool && wrapper) {
        Array.from(pool.querySelectorAll('[data-blog-video-card]')).forEach(function (card) {
          card.classList.remove('nw-blog-video__video-card--hidden');
          wrapper.appendChild(card);
        });
      }
    }

    _bindLoadMore() {
      var blogBtn = this.querySelector('[data-blog-video-load-blog]');
      var videoBtn = this.querySelector('[data-blog-video-load-video]');

      if (blogBtn) {
        blogBtn.addEventListener('click', this._toggleBlogLoad.bind(this));
      }

      if (videoBtn) {
        videoBtn.addEventListener('click', this._toggleVideoLoad.bind(this));
      }
    }

    _setLoadMoreLabel(btn, isExpanded) {
      var textEl = btn.querySelector('.nw-btn__text');
      if (!textEl) return;

      textEl.textContent = isExpanded
        ? btn.dataset.lessText || 'VIEW LESS'
        : btn.dataset.moreText || 'VIEW MORE';
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

    _showLessBlog() {
      var panel = this.querySelector('[data-blog-video-panel="blog"]');
      if (panel && this._isPanelFiltering(panel)) return;

      var cards = this.querySelectorAll('[data-blog-video-panel="blog"] [data-blog-video-blog-card]');
      cards.forEach(function (card, index) {
        if (index >= this._blogInitialCount) {
          card.classList.add('nw-blog-video__blog-card--hidden');
        }
      }, this);
    }

    _toggleBlogLoad() {
      var panel = this.querySelector('[data-blog-video-panel="blog"]');
      if (panel && this._isPanelFiltering(panel)) return;

      var blogBtn = this.querySelector('[data-blog-video-load-blog]');
      if (!blogBtn) return;

      if (blogBtn.classList.contains('is-expanded')) {
        this._showLessBlog();
        blogBtn.classList.remove('is-expanded');
        this._setLoadMoreLabel(blogBtn, false);
        return;
      }

      var hiddenCards = this.querySelectorAll(
        '[data-blog-video-panel="blog"] [data-blog-video-blog-card].nw-blog-video__blog-card--hidden'
      );
      if (!hiddenCards.length) return;

      var count = Math.min(this._blogLoadCount, hiddenCards.length);
      for (var i = 0; i < count; i += 1) {
        hiddenCards[i].classList.remove('nw-blog-video__blog-card--hidden');
      }

      if (
        !this.querySelector(
          '[data-blog-video-panel="blog"] [data-blog-video-blog-card].nw-blog-video__blog-card--hidden'
        )
      ) {
        blogBtn.classList.add('is-expanded');
        this._setLoadMoreLabel(blogBtn, true);
      }
    }

    _showLessVideo() {
      var panel = this.querySelector('[data-blog-video-panel="video"]');
      if (panel && this._isPanelFiltering(panel)) return;

      var pool = panel.querySelector('[data-blog-video-pool]');
      var wrapper = panel.querySelector('[data-blog-video-grid-wrapper]');
      if (!pool || !wrapper) return;

      var loadedCards = wrapper.querySelectorAll('[data-blog-video-card]');
      loadedCards.forEach(function (card) {
        card.classList.add('nw-blog-video__video-card--hidden');
        pool.appendChild(card);
      });
    }

    _toggleVideoLoad() {
      var panel = this.querySelector('[data-blog-video-panel="video"]');
      if (panel && this._isPanelFiltering(panel)) return;

      var videoBtn = this.querySelector('[data-blog-video-load-video]');
      if (!videoBtn) return;

      if (videoBtn.classList.contains('is-expanded')) {
        this._showLessVideo();
        videoBtn.classList.remove('is-expanded');
        this._setLoadMoreLabel(videoBtn, false);
        return;
      }

      var pool = panel.querySelector('[data-blog-video-pool]');
      var wrapper = panel.querySelector('[data-blog-video-grid-wrapper]');
      if (!pool || !wrapper) return;

      var hiddenCards = pool.querySelectorAll('[data-blog-video-card].nw-blog-video__video-card--hidden');
      if (!hiddenCards.length) return;

      var count = Math.min(this._videoLoadCount, hiddenCards.length);

      for (var j = 0; j < count; j += 1) {
        var card = hiddenCards[j];
        card.classList.remove('nw-blog-video__video-card--hidden');
        wrapper.appendChild(card);
      }

      if (!pool.querySelector('[data-blog-video-card].nw-blog-video__video-card--hidden')) {
        videoBtn.classList.add('is-expanded');
        this._setLoadMoreLabel(videoBtn, true);
      }
    }
  }

  customElements.define('nw-blog-and-video', NwBlogAndVideo);
}
