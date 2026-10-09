(function wrapCartAddWithSelectedBundleItems() {
  if (window.__nwBundleCartAddWrapped) return;
  window.__nwBundleCartAddWrapped = true;

  const originalFetch = window.fetch.bind(window);

  const getCartAddUrl = (input) => {
    if (typeof input === 'string') return input;
    if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
    return input?.url || '';
  };

  const getSelectedBundleProductForm = () =>
    document.querySelector('product-info product-form') || document.querySelector('product-form');

  const getExtraBundleItems = (mainId) => {
    const productForm = getSelectedBundleProductForm();
    if (typeof productForm?.getSelectedBundleCartItems !== 'function') return [];
    return productForm.getSelectedBundleCartItems().filter(
      (item) => item?.id && String(item.id) !== String(mainId)
    );
  };

  const payloadAlreadyHasExtras = (items, extraItems) => {
    if (!Array.isArray(items) || !extraItems.length) return true;
    const ids = new Set(items.map((item) => String(item?.id)));
    return extraItems.every((item) => ids.has(String(item.id)));
  };

  const toCleanItem = (item) => {
    const clean = {
      id: Number(item.id),
      quantity: parseInt(item.quantity, 10) || 1,
    };
    if (item.selling_plan) clean.selling_plan = item.selling_plan;
    if (item.properties && Object.keys(item.properties).length) clean.properties = item.properties;
    return clean;
  };

  const mergeBundleItemsIntoInit = (init, extraItems, mainId) => {
    if (!init?.body || !extraItems.length) return init;

    if (typeof init.body === 'string') {
      let payload;
      try {
        payload = JSON.parse(init.body);
      } catch (error) {
        return init;
      }
      if (!payload || !Array.isArray(payload.items) || !payload.items.length) return init;
      if (payloadAlreadyHasExtras(payload.items, extraItems)) return init;

      const first = payload.items[0];
      if (!first?.id || String(first.id) !== String(mainId)) return init;
      if (first.properties?.__upcartRewardProduct) return init;

      payload.items = [toCleanItem(first), ...extraItems.map(toCleanItem)];
      const headers = new Headers(init.headers || {});
      headers.set('Content-Type', 'application/json');
      return Object.assign({}, init, { body: JSON.stringify(payload), headers });
    }

    if (typeof FormData !== 'undefined' && init.body instanceof FormData) {
      const formMainId = init.body.get('id');
      if (!formMainId || String(formMainId) !== String(mainId)) return init;
      const quantity = parseInt(init.body.get('quantity'), 10) || 1;
      const sellingPlan = init.body.get('selling_plan');
      const payload = {
        items: [
          toCleanItem({ id: formMainId, quantity, selling_plan: sellingPlan }),
          ...extraItems.map(toCleanItem),
        ],
      };
      const sections = init.body.get('sections');
      const sectionsUrl = init.body.get('sections_url');
      if (sections) payload.sections = sections;
      if (sectionsUrl) payload.sections_url = sectionsUrl;
      const headers = new Headers(init.headers || {});
      headers.set('Content-Type', 'application/json');
      return Object.assign({}, init, { body: JSON.stringify(payload), headers });
    }

    return init;
  };

  window.fetch = function (input, init) {
    try {
      const url = getCartAddUrl(input);
      if (url.includes('/cart/add')) {
        const productForm = getSelectedBundleProductForm();
        const mainId = productForm?.form?.querySelector('[name="id"]')?.value;
        const extraItems = getExtraBundleItems(mainId);
        if (extraItems.length) {
          init = mergeBundleItemsIntoInit(init || {}, extraItems, mainId);
        }
      }
    } catch (error) {
      // Keep the original cart request if bundle merging fails.
    }
    return originalFetch(input, init);
  };
})();

if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('[data-atc-button-text]') || this.submitButton.querySelector('span');
        this.atcLabelEl = this.submitButton.querySelector('[data-atc-label]');
        this.atcPriceWrap = this.submitButton.querySelector('[data-atc-price-wrap]');
        this.atcPriceEl = this.submitButton.querySelector('[data-atc-price]');
        this.currentVariantPriceCents = Number(this.dataset.initialVariantPrice) || 0;

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      connectedCallback() {
        if (this.dataset.atcPriceBound === 'true') return;
        this.dataset.atcPriceBound = 'true';

        this.form?.querySelector('[name="quantity"]')?.addEventListener('change', () => {
          this.updateAtcButtonPrice();
        });

        this.closest('product-info')?.addEventListener('nw-bundle-selection-change', () => {
          this.updateAtcButtonPrice();
        });

        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
            const { sectionId, variant } = event.data || {};
            if (sectionId !== this.dataset.sectionId) return;
            if (variant?.price != null) {
              this.currentVariantPriceCents = Number(variant.price) || 0;
            }
            this.updateAtcButtonPrice();
          });
        }

        this.updateAtcButtonPrice();
      }

      disconnectedCallback() {
        this.variantChangeUnsubscriber?.();
      }

      getBundleSaveElement() {
        return (
          this.closest('product-info')?.querySelector('nw-bundle-save') ||
          document.querySelector('product-info nw-bundle-save')
        );
      }

      formatAtcMoney(cents) {
        const amount = Number(cents);
        if (!Number.isFinite(amount)) return '';

        const format = this.dataset.moneyFormat;
        if (format) {
          return this.applyAtcMoneyFormat(amount, format);
        }
        if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
          return Shopify.formatMoney(amount);
        }
        return (amount / 100).toFixed(2);
      }

      applyAtcMoneyFormat(cents, format) {
        const placeholder = /\{\{\s*(\w+)\s*\}\}/;
        const template = String(format);
        const match = template.match(placeholder);
        if (!match) return template;

        const formatWithDelimiters = (number, precision, thousands, decimal) => {
          const prec = precision == null ? 2 : precision;
          const thou = thousands == null ? ',' : thousands;
          const dec = decimal == null ? '.' : decimal;
          if (Number.isNaN(number) || number == null) return '0';
          const fixed = (number / 100).toFixed(prec);
          const parts = fixed.split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thou);
          return parts.join(dec);
        };

        const value = formatWithDelimiters(cents, 2, ',', '.');
        return template.replace(placeholder, value);
      }

      updateAtcButtonPrice() {
        const showPrice = this.dataset.showAtcPrice === 'true';
        if (!showPrice) {
          if (this.atcPriceWrap) this.atcPriceWrap.hidden = true;
          this.submitButton?.classList.remove('product-form__submit--with-price');
          return;
        }
        if (!this.atcPriceWrap || !this.atcPriceEl) return;

        const isUnavailable =
          this.submitButton.disabled ||
          this.submitButton.getAttribute('aria-disabled') === 'true' ||
          (this.atcLabelEl &&
            (this.atcLabelEl.textContent === window.variantStrings?.soldOut ||
              this.atcLabelEl.textContent === window.variantStrings?.unavailable));

        if (isUnavailable) {
          this.atcPriceWrap.hidden = true;
          this.submitButton.classList.remove('product-form__submit--with-price');
          return;
        }

        const bundle = this.getBundleSaveElement();
        const selected =
          bundle && typeof bundle.getSelectedItems === 'function' ? bundle.getSelectedItems() : [];

        let bundleCents = 0;
        selected.forEach((item) => {
          const variant = typeof bundle.findVariant === 'function' ? bundle.findVariant(item) : null;
          bundleCents += Number(variant?.price_cents) || 0;
        });

        const quantity = parseInt(this.form?.querySelector('[name="quantity"]')?.value, 10) || 1;
        const mainCents = (Number(this.currentVariantPriceCents) || 0) * quantity;
        const totalCents = mainCents + bundleCents;

        this.atcPriceEl.textContent = this.formatAtcMoney(totalCents);
        this.atcPriceWrap.hidden = false;
        this.submitButton.classList.add('product-form__submit--with-price');
      }

      static computeCartTotalCents(productInfo) {
        const form = productInfo?.querySelector('product-form');
        if (!form || form.dataset.showAtcPrice !== 'true') return null;

        const submitButton = form.querySelector('[type="submit"]');
        if (
          submitButton?.disabled ||
          submitButton?.getAttribute('aria-disabled') === 'true'
        ) {
          return null;
        }

        const quantity = parseInt(form.form?.querySelector('[name="quantity"]')?.value, 10) || 1;
        let mainCents = Number(form.currentVariantPriceCents) || 0;
        if (!mainCents) {
          const initial = Number(form.dataset.initialVariantPrice);
          if (Number.isFinite(initial)) mainCents = initial;
        }
        mainCents *= quantity;

        const bundle =
          form.getBundleSaveElement?.() ||
          productInfo?.querySelector('nw-bundle-save') ||
          document.querySelector('product-info nw-bundle-save');

        let bundleCents = 0;
        if (bundle && typeof bundle.getSelectedItems === 'function') {
          bundle.getSelectedItems().forEach((item) => {
            const variant = typeof bundle.findVariant === 'function' ? bundle.findVariant(item) : null;
            bundleCents += Number(variant?.price_cents) || 0;
          });
        }

        return mainCents + bundleCents;
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        const variantId = formData.get('id');
        const quantity = parseInt(formData.get('quantity')) || 1;
        const extraItems = this.getSelectedBundleCartItems().filter(
          (item) => item?.id && String(item.id) !== String(variantId)
        );

        if (this.cart) {
          this.cart.setActiveElement(document.activeElement);
        }

        if (extraItems.length) {
          const sellingPlan = formData.get('selling_plan');
          const payload = {
            items: [
              {
                id: Number(variantId),
                quantity,
              },
              ...extraItems,
            ],
          };
          if (sellingPlan) payload.items[0].selling_plan = sellingPlan;
          if (this.cart) {
            payload.sections = this.cart.getSectionsToRender().map((section) => section.id);
            payload.sections_url = window.location.pathname;
          }
          config.headers['Content-Type'] = 'application/json';
          config.body = JSON.stringify(payload);
        } else {
          if (this.cart) {
            formData.append(
              'sections',
              this.cart.getSectionsToRender().map((section) => section.id)
            );
            formData.append('sections_url', window.location.pathname);
          }
          config.body = formData;
        }

        const linesUpdateDeferred = this.createCartLinesUpdateEvent(variantId, quantity, extraItems);

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: variantId,
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);
              this.dispatchCartErrorEvent(response.description || response.message, 'INVALID');
              linesUpdateDeferred?.reject(new Error(response.description || response.message));

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              this.resolveCartLinesUpdate(linesUpdateDeferred);
              window.location = window.routes.cart_url;
              return;
            }

            this.resolveCartLinesUpdate(linesUpdateDeferred);

            const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: variantId,
                cartData: response,
              }).then(() => {
                CartPerformance.measureFromMarker('add:wait-for-subscribers', startMarker);
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    CartPerformance.measure("add:paint-updated-sections", () => {
                      this.cart.renderContents(response);
                    });
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure("add:paint-updated-sections", () => {
                this.cart.renderContents(response);
              });
            }
          })
          .catch((e) => {
            console.error(e);
            this.dispatchCartErrorEvent(e.message || 'Network error', 'SERVICE_UNAVAILABLE');
            linesUpdateDeferred?.reject(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');

            CartPerformance.measureFromEvent("add:user-action", evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text && this.atcLabelEl) this.atcLabelEl.textContent = text;
          else if (text) this.submitButtonText.textContent = text;
          if (this.atcPriceWrap) this.atcPriceWrap.hidden = true;
          this.submitButton.classList.remove('product-form__submit--with-price');
        } else {
          this.submitButton.removeAttribute('disabled');
          if (this.atcLabelEl) this.atcLabelEl.textContent = window.variantStrings.addToCart;
          else this.submitButtonText.textContent = window.variantStrings.addToCart;
          this.updateAtcButtonPrice();
        }
      }

      getSelectedBundleCartItems() {
        const bundle =
          this.closest('product-info')?.querySelector('nw-bundle-save') ||
          document.querySelector('product-info nw-bundle-save');
        if (!bundle) return [];

        if (typeof bundle.getSelectedCartItems === 'function') {
          return bundle.getSelectedCartItems();
        }

        const seen = new Set();
        const discountPercent = Number(bundle.dataset.discountPercentage);
        const safePercent = Number.isFinite(discountPercent)
          ? Math.min(100, Math.max(0, discountPercent))
          : 0;

        return Array.from(bundle.querySelectorAll('[data-bundle-item]')).reduce((items, item) => {
          const checked = item.querySelector('[data-bundle-check]')?.checked;
          if (!checked && !item.classList.contains('is-selected')) return items;

          const variant = typeof bundle.findVariant === 'function' ? bundle.findVariant(item) : null;
          if (variant ? variant.available === false : item.dataset.available === 'false') return items;

          const variantId = Number(variant?.id || item.dataset.variantId);
          if (!variantId || seen.has(variantId)) return items;
          seen.add(variantId);

          const defaultQty = parseInt(item.dataset.bundleDefaultQty, 10);
          const quantity = Number.isFinite(defaultQty) && defaultQty > 0 ? defaultQty : 1;

          const cartItem = {
            id: variantId,
            quantity,
          };

          const properties = {
            _bundle_save: 'true',
          };
          if (safePercent > 0) {
            properties._bundle_discount_percent = String(safePercent);
          }
          cartItem.properties = properties;

          items.push(cartItem);
          return items;
        }, []);
      }

      createCartLinesUpdateEvent(variantId, quantity, extraItems = []) {
        const { CartLinesUpdateEvent } = window.StandardEvents || {};
        if (!CartLinesUpdateEvent) return null;

        const deferred = CartLinesUpdateEvent.createPromise();
        const lines = [{ merchandiseId: variantId, quantity }];
        extraItems.forEach((item) => {
          if (!item?.id) return;
          lines.push({
            merchandiseId: String(item.id),
            quantity: item.quantity || 1,
          });
        });
        this.dispatchEvent(
          new CartLinesUpdateEvent({
            action: 'add',
            context: 'product',
            lines,
            promise: deferred.promise,
          })
        );
        return deferred;
      }

      resolveCartLinesUpdate(deferred) {
        if (!deferred) return;
        const { CartLinesUpdateEvent } = window.StandardEvents || {};
        if (!CartLinesUpdateEvent) return;

        const pendingCartDataPromise = typeof CartItems !== 'undefined'
          ? CartItems.fetchCartData()
          : fetch(`${routes.cart_url}.json`).then((response) => response.json());

        pendingCartDataPromise
          .then((cart) => {
            if (!cart?.currency) return deferred.reject(new Error('Missing currency in cart response'));
            deferred.resolve({ cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart) });
          })
          .catch((e) => deferred.reject(e));
      }

      dispatchCartErrorEvent(message, code) {
        const { CartErrorEvent } = window.StandardEvents || {};
        if (!CartErrorEvent) return;
        this.dispatchEvent(new CartErrorEvent({ error: message, code }));
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
