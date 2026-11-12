/**
 * Forces bundle-kit app price UI and related nodes to reflect Shopify variant price / compare_at_price.
 */
(() => {
  const VARIANT_SCRIPT = '[data-selected-variant]';
  const lastVariantBySection = new Map();
  let moneyFormat = null;
  let observersStarted = false;

  const loadMoneyFormat = () => {
    if (moneyFormat) return moneyFormat;
    const configEl = document.querySelector('[data-nw-variant-pricing-config]');
    if (configEl) {
      try {
        moneyFormat = JSON.parse(configEl.textContent).moneyFormat;
      } catch {
        /* ignore */
      }
    }
    if (!moneyFormat) {
      const form = document.querySelector('product-form[data-money-format]');
      moneyFormat = form?.dataset.moneyFormat || null;
    }
    return moneyFormat;
  };

  const formatWithDelimiters = (cents, precision, thousands, decimal) => {
    const prec = precision == null ? 2 : precision;
    const thou = thousands == null ? ',' : thousands;
    const dec = decimal == null ? '.' : decimal;
    const parts = (Number(cents) / 100).toFixed(prec).split('.');
    const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thou}`);
    return parts.length > 1 ? dollars + dec + parts[1] : dollars;
  };

  const formatMoney = (cents) => {
    const amount = Number(cents);
    if (!Number.isFinite(amount)) return '';

    const format = loadMoneyFormat();
    if (format) {
      const placeholder = /\{\{\s*(\w+)\s*\}\}/;
      const match = String(format).match(placeholder);
      if (match) {
        const value =
          match[1] === 'amount_no_decimals' || match[1] === 'amount_no_decimals_with_comma_separator'
            ? formatWithDelimiters(amount, 0, ',', '.')
            : formatWithDelimiters(amount, 2, ',', '.');
        return String(format).replace(placeholder, value);
      }
    }
    if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(amount);
    }
    return (amount / 100).toFixed(2);
  };

  const saveUsesPercent = (saveEl) => {
    if (!saveEl) return false;
    const sample = (saveEl.textContent || '').trim();
    if (!sample) return true;
    return /%/.test(sample) || /\[percentage\]/i.test(sample);
  };

  const formatSaveLabel = (saveEl, saveCents, compareCents) => {
    const raw = (saveEl?.textContent || 'Save').trim();
    const prefix = raw.replace(/\s*[\d$,.]+\s*%?\s*$/i, '').trim() || 'Save';

    if (saveUsesPercent(saveEl)) {
      const pct = Math.round((saveCents * 100) / compareCents);
      return `${prefix} ${pct}%`;
    }
    const money = formatMoney(saveCents).replace(/(\.|,)00(?=\D*$)/, '');
    return `${prefix} ${money}`;
  };

  const applyToKitRoot = (root, variant) => {
    if (!root || !variant) return;

    const price = Number(variant.price) || 0;
    const compare = Number(variant.compare_at_price) || 0;
    const onSale = compare > price;

    const payEl = root.querySelector('[data-kit-pay]') || root.querySelector('.nw-bundle-kit__pay');
    const wasEl = root.querySelector('[data-kit-was]') || root.querySelector('.nw-bundle-kit__was');
    const saveEl = root.querySelector('[data-kit-save]') || root.querySelector('.nw-bundle-kit__save');

    if (payEl) payEl.textContent = formatMoney(price);

    if (wasEl) {
      if (onSale) {
        wasEl.textContent = formatMoney(compare);
        wasEl.removeAttribute('hidden');
        wasEl.hidden = false;
      } else {
        wasEl.textContent = '';
        wasEl.hidden = true;
      }
    }

    if (saveEl) {
      if (onSale) {
        saveEl.textContent = formatSaveLabel(saveEl, compare - price, compare);
        saveEl.removeAttribute('hidden');
        saveEl.hidden = false;
      } else {
        saveEl.textContent = '';
        saveEl.hidden = true;
      }
    }

    if (root.hasAttribute('data-nw-bundle-kit')) {
      root.setAttribute('data-nw-catalog-priced', 'true');
    }
  };

  const applyVariantPricing = (variant, scope) => {
    if (!variant) return;
    const root = scope || document;
    root.querySelectorAll('[data-nw-bundle-kit], .nw-bundle-kit').forEach((kit) => {
      applyToKitRoot(kit, variant);
    });
  };

  const readVariantFromProductInfo = (productInfo) => {
    const script = productInfo?.querySelector(`variant-selects ${VARIANT_SCRIPT}`);
    if (!script) return null;
    try {
      return JSON.parse(script.textContent);
    } catch {
      return null;
    }
  };

  const getProductInfo = (sectionId) => {
    if (sectionId) {
      const match = document.querySelector(`product-info[data-section="${sectionId}"]`);
      if (match) return match;
    }
    return document.querySelector('product-info');
  };

  const rememberVariant = (sectionId, variant) => {
    if (!variant?.id) return;
    const key = sectionId || 'default';
    lastVariantBySection.set(key, variant);
  };

  const replayVariant = (sectionId) => {
    const key = sectionId || 'default';
    const variant = lastVariantBySection.get(key);
    if (!variant) return;
    const productInfo = getProductInfo(sectionId);
    applyVariantPricing(variant, productInfo || document);
  };

  const scheduleReplay = (() => {
    const timers = new Map();
    return (sectionId, delay = 60) => {
      const key = sectionId || 'default';
      if (timers.has(key)) window.clearTimeout(timers.get(key));
      timers.set(
        key,
        window.setTimeout(() => {
          timers.delete(key);
          replayVariant(sectionId);
        }, delay)
      );
    };
  })();

  const bindKitObservers = () => {
    if (observersStarted) return;
    observersStarted = true;

    document.querySelectorAll('product-info').forEach((productInfo) => {
      const sectionId = productInfo.dataset.section;

      productInfo.querySelectorAll('[data-nw-bundle-kit], .nw-bundle-kit').forEach((kit) => {
        const observer = new MutationObserver(() => scheduleReplay(sectionId, 30));
        observer.observe(kit, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['hidden'],
        });
      });

      const variantSelects = productInfo.querySelector('variant-selects');
      if (!variantSelects) return;

      const scriptObserver = new MutationObserver(() => {
        const variant = readVariantFromProductInfo(productInfo);
        if (variant) {
          rememberVariant(sectionId, variant);
          applyVariantPricing(variant, productInfo);
          scheduleReplay(sectionId, 50);
        }
      });
      scriptObserver.observe(variantSelects, { childList: true, subtree: true });
    });
  };

  const init = () => {
    document.querySelectorAll('product-info').forEach((productInfo) => {
      const variant = readVariantFromProductInfo(productInfo);
      if (variant) {
        rememberVariant(productInfo.dataset.section, variant);
        applyVariantPricing(variant, productInfo);
        scheduleReplay(productInfo.dataset.section, 120);
        scheduleReplay(productInfo.dataset.section, 400);
      }
    });
    bindKitObservers();
  };

  const bindVariantChange = () => {
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') {
      window.setTimeout(bindVariantChange, 25);
      return;
    }
    subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
      const { variant, sectionId } = event.data || {};
      if (!variant) return;
      rememberVariant(sectionId, variant);
      const productInfo = getProductInfo(sectionId);
      applyVariantPricing(variant, productInfo || document);
      scheduleReplay(sectionId, 40);
      scheduleReplay(sectionId, 200);
    });
  };
  bindVariantChange();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('product-info:loaded', (event) => {
    const productInfo = event.target;
    if (!productInfo?.matches?.('product-info')) return;
    const variant = readVariantFromProductInfo(productInfo);
    if (variant) {
      rememberVariant(productInfo.dataset.section, variant);
      applyVariantPricing(variant, productInfo);
    }
    bindKitObservers();
  });
})();
