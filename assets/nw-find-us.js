(function () {
  const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#efeae2' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8f857b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#efeae2' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5dbcf' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f5d4a8' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d4e4ec' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d8e4c8' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];

  const mapsLoadQueue = [];
  let mapsScriptRequested = false;

  function parseCoords(value) {
    const n = parseFloat(String(value || '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }

  function loadGoogleMaps(apiKey, callback) {
    if (window.google && window.google.maps) {
      callback();
      return;
    }
    mapsLoadQueue.push(callback);
    if (mapsScriptRequested) return;
    mapsScriptRequested = true;
    window.__nwFindUsMapsInit = function () {
      while (mapsLoadQueue.length) {
        const cb = mapsLoadQueue.shift();
        try {
          cb();
        } catch (e) {
          console.error(e);
        }
      }
    };
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src =
      'https://maps.googleapis.com/maps/api/js?key=' +
      encodeURIComponent(apiKey) +
      '&callback=__nwFindUsMapsInit';
    document.head.appendChild(script);
  }

  function readStoreData(root) {
    const dataEl = root.querySelector('.nw-find-us__data');
    if (!dataEl) return [];
    try {
      const raw = JSON.parse(dataEl.textContent);
      return raw
        .map(function (store) {
          const lat = parseCoords(store.lat);
          const lng = parseCoords(store.lng);
          return Object.assign({}, store, { lat: lat, lng: lng });
        })
        .filter(function (store) {
          return !Number.isNaN(store.lat) && !Number.isNaN(store.lng);
        });
    } catch (e) {
      console.error('NW Find Us: invalid store JSON', e);
      return [];
    }
  }

  function buildSearchHaystack(store) {
    return [
      store.title,
      store.address_line_1,
      store.city,
      store.state_name,
      store.state_code,
      store.postal_code,
      store.phone,
      store.search_keywords,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function storeMatchesQuery(store, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = buildSearchHaystack(store);
    if (hay.indexOf(q) !== -1) return true;
    if (/^\d{5}$/.test(q) && String(store.postal_code || '').indexOf(q) !== -1) return true;
    return false;
  }

  function formatCountLabel(template, count, place) {
    return template
      .replace(/\[\[count\]\]/g, String(count))
      .replace(/\[\[place\]\]/g, place || '');
  }

  class NwFindUsLocator {
    constructor(root) {
      this.root = root;
      this.section = root.closest('.nw-find-us');
      this.config = root.dataset;
      this.stores = readStoreData(root);
      this.allStores = this.stores.slice();
      this.filterQuery = '';
      this.filterLabel = '';
      this.activeId = null;
      this.map = null;
      this.markers = new Map();
      this.infoWindow = null;
      this.geocoder = null;

      this.countEl = root.querySelector('[data-nw-fu-count]');
      this.chipEl = root.querySelector('[data-nw-fu-chip]');
      this.chipLabelEl = root.querySelector('[data-nw-fu-chip-label]');
      this.viewAllBtn = root.querySelector('[data-nw-fu-view-all]');
      this.emptyEl = root.querySelector('[data-nw-fu-empty]');
      this.mapEl = root.querySelector('[data-nw-fu-map]');
      this.cards = Array.from(root.querySelectorAll('[data-nw-fu-store-card]'));

      this.input = this.section ? this.section.querySelector('.nw-find-us__input') : null;
      this.submitBtn = this.section ? this.section.querySelector('.nw-find-us__submit') : null;
      this.locationBtn = this.section ? this.section.querySelector('.nw-find-us__location') : null;

      this._onSubmit = this._onSubmit.bind(this);
      this._onLocation = this._onLocation.bind(this);
      this._onViewAll = this._onViewAll.bind(this);
      this._onChipClear = this._onChipClear.bind(this);
      this._onCardClick = this._onCardClick.bind(this);
      this._onZoom = this._onZoom.bind(this);
    }

    init() {
      if (!this.stores.length) return;

      this.bindUi();
      this.applyFilter('', '', { skipInput: true });
      this.initMap();
    }

    bindUi() {
      if (this.submitBtn) this.submitBtn.addEventListener('click', this._onSubmit);
      if (this.input) {
        this.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this._onSubmit();
          }
        });
      }
      if (this.locationBtn) this.locationBtn.addEventListener('click', this._onLocation);
      if (this.viewAllBtn) this.viewAllBtn.addEventListener('click', this._onViewAll);
      if (this.chipEl) {
        this.chipEl.addEventListener('click', this._onChipClear);
      }
      this.cards.forEach((card) => {
        card.addEventListener('click', this._onCardClick);
      });
      this.root.querySelectorAll('[data-nw-fu-zoom]').forEach((btn) => {
        btn.addEventListener('click', this._onZoom);
      });
    }

    initMap() {
      const apiKey = this.config.apiKey;
      if (!apiKey || !this.mapEl) return;

      loadGoogleMaps(apiKey, () => {
        if (!window.google || !window.google.maps) return;
        this.geocoder = new google.maps.Geocoder();
        this.infoWindow = new google.maps.InfoWindow({ maxWidth: 280 });
        this.map = new google.maps.Map(this.mapEl, {
          zoom: 5,
          center: { lat: this.stores[0].lat, lng: this.stores[0].lng },
          styles: MAP_STYLES,
          disableDefaultUI: true,
          gestureHandling: 'cooperative',
          clickableIcons: false,
        });
        this.syncMarkers();
        this.fitVisibleMarkers();
        if (this.activeId) this.setActiveStore(this.activeId, { pan: false });
      });
    }

    visibleStores() {
      return this.allStores.filter((store) => storeMatchesQuery(store, this.filterQuery));
    }

    applyFilter(query, label, options) {
      options = options || {};
      this.filterQuery = query || '';
      this.filterLabel = label || query || '';
      if (!options.skipInput && this.input) {
        this.input.value = this.filterQuery;
      }

      const visible = this.visibleStores();
      const visibleIds = new Set(visible.map((s) => s.id));

      this.cards.forEach((card) => {
        const id = card.getAttribute('data-store-id');
        const show = visibleIds.has(id);
        card.hidden = !show;
        card.classList.toggle('is-hidden', !show);
      });

      if (this.emptyEl) {
        this.emptyEl.hidden = visible.length > 0;
      }

      const hasFilter = Boolean(this.filterQuery);
      if (this.chipEl) {
        this.chipEl.hidden = !hasFilter;
      }
      if (this.chipLabelEl && hasFilter) {
        this.chipLabelEl.textContent = this.filterLabel;
      }
      if (this.viewAllBtn) {
        this.viewAllBtn.hidden = !hasFilter;
      }

      if (this.countEl) {
        const template = hasFilter
          ? this.config.resultsFilteredLabel || '[[count]] stores in [[place]]'
          : this.config.resultsAllLabel || '[[count]] store locations';
        const place = this.filterLabel;
        this.countEl.textContent = formatCountLabel(template, visible.length, place);
      }

      const firstVisible = visible[0];
      this.setActiveStore(firstVisible ? firstVisible.id : null, { pan: false });
      this.syncMarkers();
      this.fitVisibleMarkers();
    }

    syncMarkers() {
      if (!this.map) return;
      const visible = this.visibleStores();
      const visibleIds = new Set(visible.map((s) => s.id));

      this.markers.forEach((entry, id) => {
        if (!visibleIds.has(id)) {
          entry.marker.setMap(null);
        }
      });

      visible.forEach((store) => {
        let entry = this.markers.get(store.id);
        if (!entry) {
          const marker = new google.maps.Marker({
            map: this.map,
            position: { lat: store.lat, lng: store.lng },
            title: store.title,
            icon: this.markerIcon(false),
            label: this.markerLabel(store.index, false),
            zIndex: 1,
          });
          marker.addListener('click', () => {
            this.setActiveStore(store.id, { pan: true, openInfo: true });
            const card = this.root.querySelector('[data-store-id="' + store.id + '"]');
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
          entry = { marker: marker, store: store };
          this.markers.set(store.id, entry);
        } else {
          entry.marker.setMap(this.map);
          entry.store = store;
        }
        const isActive = store.id === this.activeId;
        entry.marker.setIcon(this.markerIcon(isActive));
        entry.marker.setLabel(this.markerLabel(store.index, isActive));
        entry.marker.setZIndex(isActive ? 10 : 1);
      });
    }

    markerIcon(isActive) {
      const activeColor = this.config.pinActiveColor || '#6a3d1e';
      const pinColor = this.config.pinColor || '#c68b5f';
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isActive ? activeColor : pinColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: isActive ? 20 : 16,
      };
    }

    markerLabel(index, isActive) {
      return {
        text: String(index),
        color: '#ffffff',
        fontSize: isActive ? '15px' : '13px',
        fontWeight: '600',
      };
    }

    fitVisibleMarkers() {
      if (!this.map) return;
      const visible = this.visibleStores();
      if (!visible.length) return;
      const bounds = new google.maps.LatLngBounds();
      visible.forEach((store) => bounds.extend({ lat: store.lat, lng: store.lng }));
      if (visible.length === 1) {
        this.map.setCenter(bounds.getCenter());
        this.map.setZoom(14);
      } else {
        this.map.fitBounds(bounds, 48);
      }
    }

    setActiveStore(id, options) {
      options = options || {};
      this.activeId = id;

      this.cards.forEach((card) => {
        const active = card.getAttribute('data-store-id') === id && !card.hidden;
        card.classList.toggle('is-active', active);
        card.setAttribute('aria-current', active ? 'true' : 'false');
      });

      this.syncMarkers();

      if (!this.map || !id) return;
      const entry = this.markers.get(id);
      if (!entry) return;
      if (options.pan) {
        this.map.panTo(entry.marker.getPosition());
      }
      if (options.openInfo && this.infoWindow) {
        const store = entry.store;
        const directions = store.directions_url || '';
        const hours = store.hours_text
          ? store.hours_text
          : '';
        const hoursHtml = hours
          ? hours + ' &nbsp;&bull;&nbsp; '
          : '';
        const content =
          '<div class="nw-find-us-map-info">' +
          '<strong class="nw-find-us-map-info__title">' +
          this.escapeHtml(store.title) +
          '</strong>' +
          '<p class="nw-find-us-map-info__meta">' +
          hoursHtml +
          (directions
            ? '<a href="' +
              this.escapeHtml(directions) +
              '" target="_blank" rel="noopener noreferrer">Directions →</a>'
            : '') +
          '</p></div>';
        this.infoWindow.setContent(content);
        this.infoWindow.open({ map: this.map, anchor: entry.marker });
      }
    }

    escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    _onSubmit() {
      const query = this.input ? this.input.value : '';
      this.applyFilter(query, query.trim());
    }

    _onViewAll(e) {
      e.preventDefault();
      this.applyFilter('', '');
    }

    _onChipClear(e) {
      e.preventDefault();
      this.applyFilter('', '');
    }

    _onCardClick(e) {
      if (e.target.closest('a')) return;
      const card = e.currentTarget;
      if (card.hidden) return;
      const id = card.getAttribute('data-store-id');
      this.setActiveStore(id, { pan: true, openInfo: true });
    }

    _onZoom(e) {
      if (!this.map) return;
      const dir = e.currentTarget.getAttribute('data-nw-fu-zoom');
      const current = this.map.getZoom() || 5;
      this.map.setZoom(dir === 'in' ? current + 1 : current - 1);
    }

    _onLocation() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (this.geocoder) {
            this.geocoder.geocode({ location: { lat: lat, lng: lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const stateComp = results[0].address_components.find(function (c) {
                  return c.types.indexOf('administrative_area_level_1') !== -1;
                });
                const stateName = stateComp ? stateComp.long_name : '';
                const stateCode = stateComp ? stateComp.short_name : '';
                const label = stateCode || stateName;
                const query = stateName || stateCode;
                this.applyFilter(query, label);
                if (this.map) {
                  this.map.panTo({ lat: lat, lng: lng });
                }
              }
            });
          } else {
            this.applyFilter('', '');
          }
        },
        function () {
          /* user denied or unavailable */
        }
      );
    }

    destroy() {
      if (this.submitBtn) this.submitBtn.removeEventListener('click', this._onSubmit);
      if (this.locationBtn) this.locationBtn.removeEventListener('click', this._onLocation);
      if (this.viewAllBtn) this.viewAllBtn.removeEventListener('click', this._onViewAll);
      if (this.chipEl) this.chipEl.removeEventListener('click', this._onChipClear);
      this.markers.forEach((entry) => entry.marker.setMap(null));
      this.markers.clear();
      this.map = null;
    }
  }

  const instances = new WeakMap();

  function initLocator(root) {
    if (!root || instances.has(root)) return;
    const instance = new NwFindUsLocator(root);
    instances.set(root, instance);
    instance.init();
  }

  function destroyLocator(root) {
    const instance = instances.get(root);
    if (instance) {
      instance.destroy();
      instances.delete(root);
    }
  }

  function initAll(scope) {
    (scope || document).querySelectorAll('[data-nw-find-us-locator]').forEach(initLocator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll();
    });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    event.target.querySelectorAll('[data-nw-find-us-locator]').forEach(destroyLocator);
  });
})();
