if (!customElements.get('nw-faq-v2')) {
  class NwFaqV2Accordion {
    constructor(el, accordionGroup) {
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.nw-faq-v2__answer');
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.accordionGroup = accordionGroup;

      if (!this.summary) return;

      this.updateAriaExpanded(this.el.open);
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(e) {
      e.preventDefault();

      if (window.nwPrefersReducedMotion && window.nwPrefersReducedMotion()) {
        this.el.open = !this.el.open;
        this.updateAriaExpanded(this.el.open);
        if (!this.el.open) {
          this.accordionGroup.currentAccordion = null;
        } else {
          this.accordionGroup.currentAccordion = this;
        }
        return;
      }

      this.el.style.overflow = 'hidden';
      this.accordionGroup.closeAllExcept(this);

      if (this.isClosing || !this.el.open) {
        this.open();
      } else if (this.isExpanding || this.el.open) {
        this.shrink();
      }
    }

    shrink() {
      this.isClosing = true;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight}px`;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 400, easing: 'ease-out' }
      );

      this.animation.onfinish = () => this.onAnimationFinish(false);
      this.animation.oncancel = () => {
        this.isClosing = false;
      };
    }

    open() {
      this.el.style.height = `${this.el.offsetHeight}px`;
      this.el.open = true;
      this.accordionGroup.currentAccordion = this;
      window.requestAnimationFrame(() => this.expand());
    }

    expand() {
      this.isExpanding = true;
      const contentHeight = this.content ? this.content.scrollHeight : 0;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + contentHeight}px`;

      if (this.animation) this.animation.cancel();

      this.animation = this.el.animate(
        { height: [startHeight, endHeight] },
        { duration: 400, easing: 'ease-out' }
      );

      this.animation.onfinish = () => this.onAnimationFinish(true);
      this.animation.oncancel = () => {
        this.isExpanding = false;
      };
    }

    onAnimationFinish(open) {
      this.el.open = open;
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.el.style.height = '';
      this.el.style.overflow = '';
      this.updateAriaExpanded(open);

      if (!open) {
        this.accordionGroup.currentAccordion = null;
      }
    }

    updateAriaExpanded(isExpanded) {
      this.summary.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }

    close() {
      if (this.el.open) this.shrink();
    }
  }

  class NwFaqV2 extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this._list = this.querySelector('.nw-faq-v2__list');
      this._items = this._list ? Array.from(this._list.querySelectorAll('.nw-faq-v2__item')) : [];
      this._searchInput = this.querySelector('.nw-faq-v2__search-input');
      this._pagination = this.querySelector('[data-nw-faq-v2-pagination]');
      this._paginationControls = this.querySelector('[data-nw-faq-v2-pagination-controls]');
      this._statusEl = this.querySelector('[data-nw-faq-v2-status]');
      this._pagesEl = this.querySelector('[data-nw-faq-v2-pages]');
      this._prevBtn = this.querySelector('[data-nw-faq-v2-prev]');
      this._nextBtn = this.querySelector('[data-nw-faq-v2-next]');

      this._perPage = parseInt(this.dataset.itemsPerPage, 10) || 20;
      if (this._perPage < 1) this._perPage = 20;

      this._activeTabId = this._normalizeTabId(this.dataset.defaultTab || 'all');
      this._currentPage = 1;
      this._searchQuery = '';

      this._initAccordions();
      this._initTabs();
      this._initSearch();
      this._initPaginationControls();
      this._ensureValidActiveTab();
      this._syncActiveTabButton();
      this._updateView();
    }

    disconnectedCallback() {
      if (this._searchInput && this._onSearchInput) {
        this._searchInput.removeEventListener('input', this._onSearchInput);
      }

      if (this._onTabClick) {
        this.removeEventListener('click', this._onTabClick);
      }

      if (this._prevBtn && this._onPrev) {
        this._prevBtn.removeEventListener('click', this._onPrev);
      }

      if (this._nextBtn && this._onNext) {
        this._nextBtn.removeEventListener('click', this._onNext);
      }

      this._initialized = false;
    }

    _normalizeTabId(value) {
      return String(value || '')
        .trim()
        .toLowerCase();
    }

    _initAccordions() {
      this.currentAccordion = null;
      this.accordions = [];

      this.querySelectorAll('.nw-faq-v2__accordion-item details').forEach((el) => {
        this.accordions.push(new NwFaqV2Accordion(el, this));
      });
    }

    closeAllExcept(currentAccordion) {
      this.accordions.forEach((accordion) => {
        if (accordion !== currentAccordion) accordion.close();
      });
    }

    _ensureValidActiveTab() {
      var tabs = Array.from(this.querySelectorAll('[data-nw-faq-v2-tab]'));
      if (!tabs.length) {
        this._activeTabId = 'all';
        return;
      }

      var available = tabs.map(function (tab) {
        return tab.getAttribute('data-nw-faq-v2-tab');
      });

      if (available.indexOf(this._activeTabId) === -1) {
        this._activeTabId = available[0];
      }
    }

    _initTabs() {
      this._onTabClick = (event) => {
        var tabBtn = event.target.closest('[data-nw-faq-v2-tab]');
        if (!tabBtn || !this.contains(tabBtn)) return;

        event.preventDefault();
        this._setActiveTab(tabBtn.getAttribute('data-nw-faq-v2-tab'));
      };

      this.addEventListener('click', this._onTabClick);
    }

    _setActiveTab(tabId, options) {
      var normalized = this._normalizeTabId(tabId);
      if (!normalized) return;

      this._activeTabId = normalized;
      this._currentPage = 1;
      this._syncActiveTabButton();
      this._updateView(options);
    }

    _syncActiveTabButton() {
      var tabs = this.querySelectorAll('[data-nw-faq-v2-tab]');
      var activeId = this._activeTabId;

      tabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-nw-faq-v2-tab') === activeId;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    }

    _initSearch() {
      if (!this._searchInput) return;

      this._onSearchInput = () => {
        this._searchQuery = this._searchInput.value.trim().toLowerCase();
        this._currentPage = 1;
        this._updateView();
      };

      this._searchInput.addEventListener('input', this._onSearchInput);
    }

    _initPaginationControls() {
      if (this._prevBtn) {
        this._onPrev = (e) => {
          e.preventDefault();
          if (this._currentPage > 1) {
            this._currentPage -= 1;
            this._updateView({ scroll: true });
          }
        };
        this._prevBtn.addEventListener('click', this._onPrev);
      }

      if (this._nextBtn) {
        this._onNext = (e) => {
          e.preventDefault();
          var totalPages = this._getTotalPages(this._getMatchingItems().length);
          if (this._currentPage < totalPages) {
            this._currentPage += 1;
            this._updateView({ scroll: true });
          }
        };
        this._nextBtn.addEventListener('click', this._onNext);
      }
    }

    _itemMatchesTab(item) {
      if (this._activeTabId === 'all') return true;
      var itemTab = this._normalizeTabId(item.getAttribute('data-tab-id'));
      return itemTab === this._activeTabId;
    }

    _itemMatchesSearch(item) {
      if (!this._searchQuery) return true;
      var qEl = item.querySelector('.nw-faq-v2__question');
      var aEl = item.querySelector('.nw-faq-v2__answer');
      var text = ((qEl ? qEl.textContent : '') + ' ' + (aEl ? aEl.textContent : '')).toLowerCase();
      return text.indexOf(this._searchQuery) !== -1;
    }

    _getMatchingItems() {
      return this._items.filter((item) => this._itemMatchesTab(item) && this._itemMatchesSearch(item));
    }

    _getTotalPages(count) {
      if (count <= 0) return 1;
      return Math.ceil(count / this._perPage);
    }

    _buildPageList(current, total) {
      if (total <= 1) return [1];
      if (total <= 7) {
        var all = [];
        for (var i = 1; i <= total; i += 1) all.push(i);
        return all;
      }

      var pages = [1];
      var siblings = 1;
      var start = Math.max(2, current - siblings);
      var end = Math.min(total - 1, current + siblings);

      if (start > 2) {
        pages.push('ellipsis');
      } else {
        start = 2;
      }

      for (var p = start; p <= end; p += 1) {
        pages.push(p);
      }

      if (end < total - 1) {
        pages.push('ellipsis');
      }

      pages.push(total);

      var seen = {};
      return pages.filter(function (value) {
        if (value === 'ellipsis') return true;
        if (seen[value]) return false;
        seen[value] = true;
        return true;
      });
    }

    _updateView(options) {
      var matching = this._getMatchingItems();
      var total = matching.length;
      var totalPages = this._getTotalPages(total);

      if (this._currentPage > totalPages) this._currentPage = totalPages;
      if (this._currentPage < 1) this._currentPage = 1;

      var startIndex = (this._currentPage - 1) * this._perPage;
      var endIndex = startIndex + this._perPage;
      var pageItems = matching.slice(startIndex, endIndex);

      this._items.forEach(function (item) {
        item.hidden = true;
        item.classList.remove('is-hidden-by-page');
      });

      pageItems.forEach(function (item) {
        item.hidden = false;
      });

      matching.forEach(function (item) {
        if (!pageItems.includes(item)) {
          item.classList.add('is-hidden-by-page');
          var details = item.querySelector('details');
          if (details && details.open) details.removeAttribute('open');
        }
      });

      this._updateStatus(startIndex, total, pageItems.length);
      this._renderPagination(totalPages);

      if (options && options.scroll && this._list) {
        this._list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    _updateStatus(startIndex, total, visibleCount) {
      if (!this._statusEl) return;

      if (total === 0) {
        this._statusEl.textContent = this._statusEl.getAttribute('data-empty-text') || '';
        return;
      }

      var start = startIndex + 1;
      var end = startIndex + visibleCount;
      var template =
        this._statusEl.getAttribute('data-template') || 'Showing {{ start }}–{{ end }} of {{ total }} questions';

      this._statusEl.textContent = template
        .replace(/\{\{\s*start\s*\}\}/g, String(start))
        .replace(/\{\{\s*end\s*\}\}/g, String(end))
        .replace(/\{\{\s*total\s*\}\}/g, String(total));
    }

    _renderPagination(totalPages) {
      if (!this._pagination) return;

      var showControls = totalPages > 1;
      if (this._paginationControls) {
        this._paginationControls.hidden = !showControls;
      }

      if (!showControls) {
        if (this._pagesEl) this._pagesEl.innerHTML = '';
        return;
      }

      if (this._prevBtn) {
        this._prevBtn.disabled = this._currentPage <= 1;
      }

      if (this._nextBtn) {
        this._nextBtn.disabled = this._currentPage >= totalPages;
      }

      if (!this._pagesEl) return;

      var current = this._currentPage;
      var pages = this._buildPageList(current, totalPages);
      var self = this;

      this._pagesEl.innerHTML = '';

      pages.forEach(function (page) {
        if (page === 'ellipsis') {
          var ellipsis = document.createElement('span');
          ellipsis.className = 'nw-faq-v2__page-ellipsis';
          ellipsis.setAttribute('aria-hidden', 'true');
          ellipsis.textContent = '…';
          self._pagesEl.appendChild(ellipsis);
          return;
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nw-faq-v2__page-btn';
        if (page === current) {
          btn.classList.add('is-active');
          btn.setAttribute('aria-current', 'page');
        }
        btn.textContent = String(page);
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (self._currentPage === page) return;
          self._currentPage = page;
          self._updateView({ scroll: true });
        });
        self._pagesEl.appendChild(btn);
      });
    }
  }

  customElements.define('nw-faq-v2', NwFaqV2);
}
