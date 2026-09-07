(function () {
  function initPromoBanner(banner) {
    var sectionId = banner.getAttribute('data-section-id');
    var blockId = banner.getAttribute('data-block-id');
    var dataEl = document.getElementById('promo-banner-data-' + sectionId + '-' + blockId);
    if (!dataEl) return;

    var config;
    try {
      config = JSON.parse(dataEl.textContent);
    } catch (error) {
      return;
    }

    var messageEl = banner.querySelector('[data-promo-banner-message]');
    var codeEl = banner.querySelector('[data-promo-banner-code]');
    var codeTextEl = banner.querySelector('[data-promo-banner-code-text]');
    var toastEl = banner.querySelector('[data-promo-banner-toast]');
    var productFormId = 'product-form-' + sectionId;
    var placeholder = config.placeholder || '[DiscountedPrice]';
    var copyToastTimer;
    var bindingsDone = false;

    function escapeHtmlText(value) {
      var node = document.createElement('div');
      node.textContent = value;
      return node.innerHTML;
    }

    function extractFirstDiscountCode(value) {
      var match = String(value).match(/\{([^}]*)\}/);
      return match ? String(match[1]).trim() : '';
    }

    function stripHtml(value) {
      var node = document.createElement('div');
      node.innerHTML = value;
      return node.textContent || '';
    }

    function getMessagePlain() {
      return stripHtml(config.message || '');
    }

    function getDisplayMessagePlain(discountedPrice) {
      var text = getMessagePlain();
      text = text.replace(/\{([^}]*)\}/g, function (match, inner) {
        return String(inner).trim();
      });
      text = text.replace(/\s+/g, ' ').trim();

      if (discountedPrice) {
        text = text.split(placeholder).join(discountedPrice);
      }

      return text;
    }

    function formatMoney(cents) {
      var amount = Number(cents);
      if (!Number.isFinite(amount)) return '';

      if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
        return Shopify.formatMoney(amount, config.moneyFormat || '${{amount}}');
      }

      return (amount / 100).toFixed(2);
    }

    function getDiscountedPriceCents(priceCents) {
      var pct = Number(config.percentage);
      if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return null;
      if (!Number.isFinite(Number(priceCents))) return null;
      return Math.round(Number(priceCents) * (100 - pct) / 100);
    }

    function getForm() {
      return document.getElementById(productFormId);
    }

    function getVariantInput() {
      var form = getForm();
      if (!form) return null;
      return form.querySelector('input[name="id"], select[name="id"]');
    }

    function getActiveVariantId() {
      var variantInput = getVariantInput();
      if (variantInput && variantInput.value) {
        return Number(variantInput.value);
      }
      return NaN;
    }

    function getActiveVariantRow() {
      var variantId = getActiveVariantId();
      var row = (config.variants || []).find(function (variant) {
        return Number(variant.id) === variantId;
      });
      if (!row && config.variants?.length === 1) {
        return config.variants[0];
      }
      return row || null;
    }

    function showCopiedToast(code) {
      if (!toastEl || !codeEl) return;

      codeEl.classList.add('nw-product-promo-banner__code--copied');
      toastEl.hidden = false;
      toastEl.textContent = 'Copied! "' + code + '" is in your clipboard.';
      toastEl.classList.add('is-visible');

      window.clearTimeout(copyToastTimer);
      copyToastTimer = window.setTimeout(function () {
        toastEl.classList.remove('is-visible');
        window.setTimeout(function () {
          toastEl.hidden = true;
          codeEl.classList.remove('nw-product-promo-banner__code--copied');
        }, 280);
      }, 2600);
    }

    function copyCodeToClipboard(code) {
      function fallbackCopy() {
        var textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();

        try {
          document.execCommand('copy');
          showCopiedToast(code);
        } catch (error) {}

        document.body.removeChild(textarea);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
          showCopiedToast(code);
        }).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    }

    function bindCopyOnce() {
      if (!codeEl || codeEl.dataset.copyBound === 'true') return;
      codeEl.dataset.copyBound = 'true';

      codeEl.addEventListener('click', function () {
        var code = codeEl.getAttribute('data-copy-discount-code');
        if (code) copyCodeToClipboard(code);
      });

      codeEl.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        var code = codeEl.getAttribute('data-copy-discount-code');
        if (!code) return;
        event.preventDefault();
        copyCodeToClipboard(code);
      });
    }

    function updatePromoBanner() {
      var row = getActiveVariantRow();
      var code = extractFirstDiscountCode(getMessagePlain());
      var discountedCents = row ? getDiscountedPriceCents(row.price) : null;
      var discountedPrice = discountedCents != null ? formatMoney(discountedCents) : '';
      var displayMessage = getDisplayMessagePlain(discountedPrice);

      if (messageEl) {
        if (displayMessage) {
          messageEl.textContent = displayMessage;
          messageEl.hidden = false;
        } else {
          messageEl.hidden = true;
          messageEl.textContent = '';
        }
      }

      if (codeEl && codeTextEl) {
        if (code) {
          codeTextEl.textContent = code;
          codeEl.setAttribute('data-copy-discount-code', code);
          codeEl.setAttribute('title', 'Click to copy discount code ' + code);
          codeEl.setAttribute('aria-label', 'Copy discount code ' + code);
          codeEl.hidden = false;
        } else {
          codeTextEl.textContent = '';
          codeEl.removeAttribute('data-copy-discount-code');
          codeEl.removeAttribute('title');
          codeEl.removeAttribute('aria-label');
          codeEl.hidden = true;
        }
      }
    }

    function bindVariantUpdates() {
      if (bindingsDone) return true;

      var form = getForm();
      var variantInput = getVariantInput();
      if (!form || !variantInput) return false;

      bindingsDone = true;
      variantInput.addEventListener('change', updatePromoBanner);

      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        subscribe(PUB_SUB_EVENTS.variantChange, function (event) {
          if (event?.data?.sectionId !== sectionId) return;
          updatePromoBanner();
        });
      }

      bindCopyOnce();
      return true;
    }

    function start() {
      if (!bindVariantUpdates()) {
        var tries = 0;
        var timer = window.setInterval(function () {
          tries += 1;
          if (bindVariantUpdates() || tries >= 50) {
            window.clearInterval(timer);
          }
        }, 50);
      }

      window.setTimeout(updatePromoBanner, 0);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }

  function boot() {
    document.querySelectorAll('[data-promo-banner]').forEach(initPromoBanner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
