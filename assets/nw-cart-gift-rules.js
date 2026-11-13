/**
 * Global cart gift rules driven by cart_gift_rule metaobjects.
 * Adds/removes gift lines based on trigger products or variants and trigger quantity.
 */
(function initNwCartGiftRules() {
  if (window.__nwCartGiftRulesInitialized) return;
  window.__nwCartGiftRulesInitialized = true;

  const JSON_ELEMENT_ID = 'nw-cart-gift-rules-json';
  const DEFAULT_PROPERTY_KEY = '_cart_gift_rule';
  const SYNC_FLAG = '__nwCartGiftSyncActive';
  const MAX_SYNC_PASSES = 5;

  const cartAddPath = '/cart/add';
  const cartChangePath = '/cart/change';
  const cartUpdatePath = '/cart/update';
  const cartJsPath = '/cart.js';

  /** @typedef {{ id: string, title: string, triggerMode: string, triggerProductIds: number[], triggerVariantIds: number[], triggerQuantity: number, giftVariantId: number, giftQuantity: number, priority: number, internalId: string, lineProperty: { key: string, value: string } }} GiftRule */

  /** @type {GiftRule[]} */
  let rules = [];

  let syncTimer = null;
  let syncRunning = false;
  let syncQueued = false;

  const getRoutes = () => window.routes || {};

  const cartJsUrl = () => {
    const routes = getRoutes();
    const base = routes.cart_url || `${window.Shopify?.routes?.root || '/'}cart`;
    return base.endsWith('.js') ? base : `${base}.js`;
  };

  const cartAddUrl = () => {
    const routes = getRoutes();
    const url = routes.cart_add_url || '/cart/add';
    return url.endsWith('.js') ? url : `${url}.js`;
  };

  const cartChangeUrl = () => {
    const routes = getRoutes();
    const url = routes.cart_change_url || '/cart/change';
    return url.endsWith('.js') ? url : `${url}.js`;
  };

  const parseRules = () => {
    const el = document.getElementById(JSON_ELEMENT_ID);
    if (!el?.textContent?.trim()) return [];

    try {
      const parsed = JSON.parse(el.textContent);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(normalizeRule)
        .filter(Boolean)
        .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
    } catch (error) {
      console.warn('[nw-cart-gift-rules] Failed to parse rules JSON.', error);
      return [];
    }
  };

  const parseLineProperty = (internalId, title) => {
    const raw = String(internalId || '').trim();
    if (!raw) {
      return { key: DEFAULT_PROPERTY_KEY, value: String(title || '').trim() };
    }

    const colonIndex = raw.indexOf(':');
    if (colonIndex === -1) {
      return { key: DEFAULT_PROPERTY_KEY, value: raw };
    }

    const key = raw.slice(0, colonIndex).trim() || DEFAULT_PROPERTY_KEY;
    const value = raw.slice(colonIndex + 1).trim() || String(title || '').trim();
    return { key, value };
  };

  /** @param {Record<string, unknown>} raw */
  const normalizeRule = (raw) => {
    if (!raw?.giftVariantId) return null;

    const triggerMode = String(raw.triggerMode || 'variant').toLowerCase();
    const title = String(raw.title || raw.id || '').trim();
    const giftQuantity = Math.max(1, parseInt(raw.giftQuantity, 10) || 1);
    const triggerQuantity = Math.max(1, parseInt(raw.triggerQuantity, 10) || 1);

    return {
      id: String(raw.id || title),
      title,
      triggerMode: triggerMode.includes('product') ? 'product' : 'variant',
      triggerProductIds: toIdList(raw.triggerProductIds),
      triggerVariantIds: toIdList(raw.triggerVariantIds),
      triggerQuantity,
      giftVariantId: Number(raw.giftVariantId),
      giftQuantity,
      priority: parseInt(raw.priority, 10) || 0,
      internalId: String(raw.internalId || ''),
      lineProperty: parseLineProperty(raw.internalId, title),
    };
  };

  const toIdList = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  };

  const isSyncRequest = () => Boolean(window[SYNC_FLAG]);

  const isCartMutationUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const path = url.split('?')[0];
    return (
      path.endsWith(`${cartAddPath}.js`) ||
      path.endsWith(cartAddPath) ||
      path.endsWith(`${cartChangePath}.js`) ||
      path.endsWith(cartChangePath) ||
      path.endsWith(`${cartUpdatePath}.js`) ||
      path.endsWith(cartUpdatePath)
    );
  };

  const fetchCart = async () => {
    const response = await fetch(cartJsUrl(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('Failed to load cart');
    return response.json();
  };

  const cartRequest = async (url, body) => {
    window[SYNC_FLAG] = true;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data?.description || data?.message || 'Cart request failed';
        throw new Error(message);
      }
      return data;
    } finally {
      window[SYNC_FLAG] = false;
    }
  };

  /** Lines added by this script always include _cart_gift_rule (Upcart / manual add-ons do not). */
  const isLineAddedByGiftRules = (line) => {
    const properties = line?.properties || {};
    const marker = properties[DEFAULT_PROPERTY_KEY];
    if (marker === undefined || marker === null) return false;
    return String(marker).trim() !== '';
  };

  const isManagedLineForRule = (line, rule) => {
    if (!isLineAddedByGiftRules(line)) return false;

    const properties = line?.properties || {};
    const expected = rule.lineProperty.value;
    const marker = properties[DEFAULT_PROPERTY_KEY];
    if (String(marker) !== String(expected)) return false;

    if (rule.lineProperty.key === DEFAULT_PROPERTY_KEY) return true;

    const actual = properties[rule.lineProperty.key];
    if (actual === undefined || actual === null) return false;
    return String(actual) === String(expected);
  };

  const isManagedGiftLine = (line) => isLineAddedByGiftRules(line);

  const lineMatchesTrigger = (line, rule) => {
    if (!line || isManagedGiftLine(line)) return false;

    if (rule.triggerMode === 'product') {
      if (!rule.triggerProductIds.length) return false;
      return rule.triggerProductIds.includes(Number(line.product_id));
    }

    if (!rule.triggerVariantIds.length) return false;
    return rule.triggerVariantIds.includes(Number(line.variant_id));
  };

  const isTriggerMet = (cart, rule) => {
    const items = cart?.items || [];
    const requiredQty = rule.triggerQuantity;
    let matchedQty = 0;

    for (const line of items) {
      if (!lineMatchesTrigger(line, rule)) continue;
      matchedQty += Number(line.quantity) || 0;
      if (matchedQty >= requiredQty) return true;
    }

    return false;
  };

  const getManagedLines = (cart, rule) => {
    return (cart?.items || []).filter((line) => isManagedLineForRule(line, rule));
  };

  /** @returns {{ type: 'add' | 'update' | 'remove', rule: GiftRule, line?: object, quantity?: number }[]} */
  const planActions = (cart) => {
    /** @type {ReturnType<typeof planActions>} */
    const actions = [];

    for (const rule of rules) {
      const triggerMet = isTriggerMet(cart, rule);
      const managedLines = getManagedLines(cart, rule);
      const targetQty = rule.giftQuantity;

      if (triggerMet) {
        const primaryLine = managedLines[0];

        if (!primaryLine) {
          actions.push({ type: 'add', rule });
        } else if (Number(primaryLine.quantity) !== targetQty) {
          actions.push({ type: 'update', rule, line: primaryLine, quantity: targetQty });
        }

        for (let i = 1; i < managedLines.length; i += 1) {
          actions.push({ type: 'remove', rule, line: managedLines[i] });
        }
      } else {
        for (const line of managedLines) {
          actions.push({ type: 'remove', rule, line });
        }
      }
    }

    return actions;
  };

  const buildGiftLineProperties = (rule) => {
    const propertyKey = rule.lineProperty.key;
    const propertyValue = rule.lineProperty.value;
    /** @type {Record<string, string>} */
    const properties = {
      [DEFAULT_PROPERTY_KEY]: propertyValue,
    };

    if (propertyKey !== DEFAULT_PROPERTY_KEY) {
      properties[propertyKey] = propertyValue;
    }

    return properties;
  };

  const addGiftLine = async (rule) => {
    await cartRequest(cartAddUrl(), {
      items: [
        {
          id: rule.giftVariantId,
          quantity: rule.giftQuantity,
          properties: buildGiftLineProperties(rule),
        },
      ],
    });
  };

  const updateLineQuantity = async (line, quantity) => {
    await cartRequest(cartChangeUrl(), {
      id: line.key,
      quantity,
    });
  };

  const removeLine = async (line) => updateLineQuantity(line, 0);

  const notifyUpcart = () => {
    if (typeof window.upcartRefreshCart === 'function') {
      try {
        window.upcartRefreshCart();
      } catch (error) {
        console.warn('[nw-cart-gift-rules] upcartRefreshCart failed.', error);
      }
    }
  };

  const notifyThemeCart = (cart) => {
    if (typeof publish === 'function' && window.PUB_SUB_EVENTS?.cartUpdate) {
      publish(PUB_SUB_EVENTS.cartUpdate, { source: 'nw-cart-gift-rules', cartData: cart });
    }
  };

  const runSync = async () => {
    if (!rules.length) return;
    if (syncRunning) {
      syncQueued = true;
      return;
    }

    syncRunning = true;
    let cartChanged = false;

    try {
      for (let pass = 0; pass < MAX_SYNC_PASSES; pass += 1) {
        const cart = await fetchCart();
        const actions = planActions(cart);
        if (!actions.length) break;

        cartChanged = true;
        for (const action of actions) {
          if (action.type === 'add') {
            await addGiftLine(action.rule);
          } else if (action.type === 'update') {
            await updateLineQuantity(action.line, action.quantity);
          } else if (action.type === 'remove') {
            await removeLine(action.line);
          }
        }
      }

      const finalCart = await fetchCart();
      if (cartChanged) {
        notifyUpcart();
        notifyThemeCart(finalCart);
      }
    } catch (error) {
      console.warn('[nw-cart-gift-rules] Sync failed.', error);
    } finally {
      syncRunning = false;
      if (syncQueued) {
        syncQueued = false;
        scheduleSync(0);
      }
    }
  };

  const scheduleSync = (delayMs = 80) => {
    if (isSyncRequest()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      runSync();
    }, delayMs);
  };

  const wrapFetch = () => {
    if (window.__nwCartGiftFetchWrapped) return;
    window.__nwCartGiftFetchWrapped = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = function nwCartGiftFetchWrapper(input, init) {
      const url = typeof input === 'string' ? input : input?.url || '';
      const shouldWatch = isCartMutationUrl(url) && !isSyncRequest();

      return originalFetch(input, init).then((response) => {
        if (shouldWatch && response.ok) {
          scheduleSync();
        }
        return response;
      });
    };
  };

  const bootstrap = () => {
    rules = parseRules();
    if (!rules.length) return;

    wrapFetch();
    scheduleSync(0);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
