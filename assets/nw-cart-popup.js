(function () {
  if (window.__nwCartPopupInitialized) return;
  window.__nwCartPopupInitialized = true;

  const MODAL_PREFIX = 'NwCartPopupModal-';
  const ROOT_SELECTOR = 'modal-dialog.nw-cart-popup[data-nw-cart-popup]';
  const UPCART_BACKDROP_SELECTOR = '[class*="CartPreview__backdrop"]';
  const UPCART_ADDON_TITLE_SELECTOR = 'span[class*="upcart-internal-addons__content-title"]';
  const UPCART_ADDON_WRAPPER_SELECTOR = '[class*="upcart-internal-addons__content-title-wrapper"]';
  const UPCART_LINK_FLAG = 'data-nw-cart-popup-upcart-link';
  const DEFAULT_UPCART_ICON_URL =
    'https://cdn.shopify.com/s/files/1/0684/9721/1457/files/info.svg?v=1793355004';
  const FALLBACK_Z_INDEX = 10050;

  function forEachDomRoot(callback) {
    callback(document);
    document.querySelectorAll('*').forEach((host) => {
      if (host.shadowRoot) callback(host.shadowRoot);
    });
  }

  function readElementZIndex(element) {
    const inline = parseInt(element.style.zIndex, 10);
    if (!Number.isNaN(inline)) return inline;
    const computed = parseInt(window.getComputedStyle(element).zIndex, 10);
    return Number.isNaN(computed) ? 0 : computed;
  }

  function getUpcartBackdropZIndex() {
    let maxZ = 0;

    forEachDomRoot((root) => {
      root.querySelectorAll(UPCART_BACKDROP_SELECTOR).forEach((backdrop) => {
        maxZ = Math.max(maxZ, readElementZIndex(backdrop));
      });
    });

    return maxZ;
  }

  function syncCartPopupZIndex() {
    const backdropZ = getUpcartBackdropZIndex();
    const nextZ = backdropZ > 0 ? backdropZ + 1 : FALLBACK_Z_INDEX;
    document.documentElement.style.setProperty('--nw-cart-popup-z-index', String(nextZ));
    return nextZ;
  }

  let syncScheduled = false;
  function scheduleCartPopupZIndexSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    window.requestAnimationFrame(() => {
      syncScheduled = false;
      syncCartPopupZIndex();
    });
  }

  let zIndexWatchId = null;
  function startZIndexWatchWhileOpen() {
    if (zIndexWatchId != null) return;

    zIndexWatchId = window.setInterval(() => {
      const openModal = document.querySelector(`${ROOT_SELECTOR}[open]`);
      if (!openModal) {
        window.clearInterval(zIndexWatchId);
        zIndexWatchId = null;
        return;
      }
      syncCartPopupZIndex();
    }, 200);
  }

  function normalizeHash(value) {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    return trimmed.charAt(0) === '#' ? trimmed.slice(1) : trimmed;
  }

  function hashFromHref(href) {
    if (!href) return '';
    const trimmed = String(href).trim();
    if (!trimmed || trimmed === '#') return '';

    if (trimmed.charAt(0) === '#') {
      return normalizeHash(trimmed);
    }

    try {
      const url = new URL(trimmed, window.location.href);
      return normalizeHash(url.hash);
    } catch {
      return '';
    }
  }

  function findCartPopupModal(hashValue) {
    const raw = normalizeHash(hashValue);
    if (!raw) return null;

    let modal = document.getElementById(raw);
    if (modal && modal.matches(ROOT_SELECTOR)) return modal;

    if (!raw.startsWith(MODAL_PREFIX)) {
      modal = document.getElementById(MODAL_PREFIX + raw);
      if (modal && modal.matches(ROOT_SELECTOR)) return modal;
    }

    return null;
  }

  function openCartPopup(hashOrId, opener) {
    const modal = findCartPopupModal(hashOrId);
    if (!modal || typeof modal.show !== 'function') return false;
    syncCartPopupZIndex();
    modal.show(opener || null);
    scheduleCartPopupZIndexSync();
    startZIndexWatchWhileOpen();
    return true;
  }

  function bindModalZIndexSync(modal) {
    if (!modal || modal.dataset.nwCartPopupZBound === 'true') return;
    modal.dataset.nwCartPopupZBound = 'true';

    const observer = new MutationObserver(() => {
      if (!modal.hasAttribute('open')) return;
      scheduleCartPopupZIndexSync();
    });

    observer.observe(modal, { attributes: true, attributeFilter: ['open'] });
  }

  function clearPopupHashFromUrl() {
    const hash = normalizeHash(window.location.hash);
    if (!hash || !findCartPopupModal(hash)) return;
    const nextUrl = window.location.pathname + window.location.search;
    history.replaceState(history.state, document.title, nextUrl);
  }

  function findAnchorInComposedPath(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    for (let i = 0; i < path.length; i += 1) {
      const node = path[i];
      if (node instanceof HTMLAnchorElement) return node;
    }
    return null;
  }

  function onDocumentClick(event) {
    const link = findAnchorInComposedPath(event);
    if (!link) return;

    const hash = hashFromHref(link.getAttribute('href'));
    if (!hash) return;

    const modal = findCartPopupModal(hash);
    if (!modal) return;

    event.preventDefault();
    event.stopPropagation();
    openCartPopup(hash, link);
    clearPopupHashFromUrl();
  }

  function onHashChange() {
    const hash = normalizeHash(window.location.hash);
    if (!hash) return;
    if (openCartPopup(hash)) {
      clearPopupHashFromUrl();
    }
  }

  function getUpcartPopupLinkConfig() {
    const modal = document.querySelector(`${ROOT_SELECTOR}[data-nw-cart-popup-link-id]`);
    const linkId = modal?.dataset.nwCartPopupLinkId || 'cart-popup';
    const iconUrl = modal?.dataset.nwCartPopupIconUrl || DEFAULT_UPCART_ICON_URL;
    return {
      href: `#${linkId}`,
      iconUrl,
    };
  }

  function createUpcartPopupLink(config) {
    const link = document.createElement('a');
    link.href = config.href;
    link.className = 'popup-link';
    link.setAttribute(UPCART_LINK_FLAG, '');
    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';
    link.style.marginInlineStart = '6px';
    link.style.verticalAlign = 'middle';

    const img = document.createElement('img');
    img.src = config.iconUrl;
    img.className = 'nw-cart-popup-icon';
    img.alt = 'More information';
    img.width = 16;
    img.height = 16;
    img.style.display = 'block';
    img.style.width = '16px';
    img.style.height = '16px';

    link.appendChild(img);
    return link;
  }

  function injectUpcartAddonPopupLinks() {
    const config = getUpcartPopupLinkConfig();

    forEachDomRoot((root) => {
      root.querySelectorAll(UPCART_ADDON_TITLE_SELECTOR).forEach((titleEl) => {
        if (!(titleEl instanceof HTMLElement)) return;
        if (titleEl.querySelector(`[${UPCART_LINK_FLAG}]`)) return;
        titleEl.appendChild(createUpcartPopupLink(config));
      });
    });
  }

  let upcartInjectScheduled = false;
  function scheduleUpcartAddonPopupLinkInject() {
    if (upcartInjectScheduled) return;
    upcartInjectScheduled = true;
    window.requestAnimationFrame(() => {
      upcartInjectScheduled = false;
      injectUpcartAddonPopupLinks();
    });
  }

  function init() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(bindModalZIndexSync);
    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('resize', scheduleCartPopupZIndexSync);

    const bodyObserver = new MutationObserver(() => {
      scheduleCartPopupZIndexSync();
      scheduleUpcartAddonPopupLinkInject();
    });
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
      childList: true,
    });

    const domObserver = new MutationObserver(scheduleUpcartAddonPopupLinkInject);
    domObserver.observe(document.documentElement, { childList: true, subtree: true });

    onHashChange();
    scheduleCartPopupZIndexSync();
    scheduleUpcartAddonPopupLinkInject();
  }

  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll?.(ROOT_SELECTOR)?.forEach(bindModalZIndexSync);
    scheduleCartPopupZIndexSync();
    scheduleUpcartAddonPopupLinkInject();
  });

  window.openNwCartPopup = function openNwCartPopup(linkId) {
    return openCartPopup(linkId);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
