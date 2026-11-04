if (!customElements.get('nw-product-promo-banner')) {
  class NwProductPromoBanner extends HTMLElement {
    connectedCallback() {
      if (this._initialized) return;
      this._initialized = true;

      this._initPromoBanner();
    }

    disconnectedCallback() {
      if (this._copyToastTimer) {
        window.clearTimeout(this._copyToastTimer);
        this._copyToastTimer = null;
      }

      if (this._variantPollTimer) {
        window.clearInterval(this._variantPollTimer);
        this._variantPollTimer = null;
      }

      this._initialized = false;
    }

    _initPromoBanner() {
      const sectionId = this.getAttribute('data-section-id');
      const blockId = this.getAttribute('data-block-id');
      const dataEl = document.getElementById('promo-banner-data-' + sectionId + '-' + blockId);
      if (!dataEl) return;

      let config;
      try {
        config = JSON.parse(dataEl.textContent);
      } catch (error) {
        return;
      }

      const messageEl = this.querySelector('[data-promo-banner-message]');
      const codeEl = this.querySelector('[data-promo-banner-code]');
      const codeTextEl = this.querySelector('[data-promo-banner-code-text]');
      const toastEl = this.querySelector('[data-promo-banner-toast]');
      const productFormId = 'product-form-' + sectionId;
      let bindingsDone = false;

      const extractFirstDiscountCode = (value) => {
        const match = String(value).match(/\{([^}]*)\}/);
        return match ? String(match[1]).trim() : '';
      };

      const stripHtml = (value) => {
        const node = document.createElement('div');
        node.innerHTML = value;
        return node.textContent || '';
      };

      const getMessagePlain = () => stripHtml(config.message || '');

      const getDisplayMessagePlain = () => {
        let text = getMessagePlain();
        text = text.replace(/\{([^}]*)\}/g, (match, inner) => String(inner).trim());
        text = text.replace(/\[DiscountedPrice\]/g, '');
        return text.replace(/\s+/g, ' ').trim();
      };

      const getForm = () => document.getElementById(productFormId);

      const getVariantInput = () => {
        const form = getForm();
        if (!form) return null;
        return form.querySelector('input[name="id"], select[name="id"]');
      };

      const showCopiedToast = (code) => {
        if (!toastEl || !codeEl) return;

        const copiedTemplate = this.getAttribute('data-copied-message') || 'Copied! "{{ code }}" is in your clipboard.';
        codeEl.classList.add('nw-product-promo-banner__code--copied');
        toastEl.hidden = false;
        toastEl.textContent = copiedTemplate.replace('__CODE__', code);
        toastEl.classList.add('is-visible');

        window.clearTimeout(this._copyToastTimer);
        this._copyToastTimer = window.setTimeout(() => {
          toastEl.classList.remove('is-visible');
          window.setTimeout(() => {
            toastEl.hidden = true;
            codeEl.classList.remove('nw-product-promo-banner__code--copied');
          }, 280);
        }, 2600);
      };

      const copyCodeToClipboard = (code) => {
        const fallbackCopy = () => {
          const textarea = document.createElement('textarea');
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
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            showCopiedToast(code);
          }).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      };

      const bindCopyOnce = () => {
        if (!codeEl || codeEl.dataset.copyBound === 'true') return;
        codeEl.dataset.copyBound = 'true';

        codeEl.addEventListener('click', () => {
          const code = codeEl.getAttribute('data-copy-discount-code');
          if (code) copyCodeToClipboard(code);
        });

        codeEl.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          const code = codeEl.getAttribute('data-copy-discount-code');
          if (!code) return;
          event.preventDefault();
          copyCodeToClipboard(code);
        });
      };

      const updatePromoBanner = () => {
        const code = extractFirstDiscountCode(getMessagePlain());
        const displayMessage = getDisplayMessagePlain();

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
            codeEl.setAttribute('role', 'button');
            codeEl.setAttribute('tabindex', '0');
            codeEl.hidden = false;
          } else {
            codeTextEl.textContent = '';
            codeEl.removeAttribute('data-copy-discount-code');
            codeEl.removeAttribute('title');
            codeEl.removeAttribute('aria-label');
            codeEl.hidden = true;
            codeEl.removeAttribute('role');
            codeEl.removeAttribute('tabindex');
          }
        }
      };

      const bindVariantUpdates = () => {
        if (bindingsDone) return true;

        const form = getForm();
        const variantInput = getVariantInput();
        if (!form || !variantInput) return false;

        bindingsDone = true;
        variantInput.addEventListener('change', updatePromoBanner);

        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
            if (event?.data?.sectionId !== sectionId) return;
            updatePromoBanner();
          });
        }

        bindCopyOnce();
        return true;
      };

      if (!bindVariantUpdates()) {
        let tries = 0;
        this._variantPollTimer = window.setInterval(() => {
          tries += 1;
          if (bindVariantUpdates() || tries >= 50) {
            window.clearInterval(this._variantPollTimer);
            this._variantPollTimer = null;
          }
        }, 50);
      }

      window.setTimeout(updatePromoBanner, 0);
    }
  }

  customElements.define('nw-product-promo-banner', NwProductPromoBanner);
}
