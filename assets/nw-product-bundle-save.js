if (!customElements.get('nw-bundle-save')) {
  customElements.define(
    'nw-bundle-save',
    class NwBundleSave extends HTMLElement {
      connectedCallback() {
        if (this.dataset.bound === 'true') return;
        this.dataset.bound = 'true';

        this.submitButton = this.querySelector('[data-bundle-submit]');
        this.errorEl = this.querySelector('[data-bundle-error]');
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.items = Array.from(this.querySelectorAll('[data-bundle-item]'));

        this.items.forEach((item) => {
          const jsonEl = item.querySelector('[data-bundle-product-json]');
          try {
            item._bundleProduct = JSON.parse(jsonEl?.textContent || '{}');
          } catch (error) {
            item._bundleProduct = { variants: [] };
          }

          const checkbox = item.querySelector('[data-bundle-check]');
          checkbox?.addEventListener('change', () => this.toggleItem(item, checkbox.checked));

          item.querySelectorAll('[data-option-position]').forEach((control) => {
            control.addEventListener('change', () => this.onOptionChange(item, control));
          });
        });

        this.submitButton?.addEventListener('click', (event) => this.onSubmit(event));
        this.updateSubmitState();
      }

      toggleItem(item, selected) {
        item.classList.toggle('is-selected', selected);
        const options = item.querySelector('[data-bundle-options]');
        if (options) options.hidden = !selected;
        this.clearError();
        this.updateSubmitState();
      }

      onOptionChange(item, control) {
        const fieldset = control.closest('fieldset');
        if (fieldset) {
          const label = fieldset.querySelector('[data-selected-value]');
          if (label) label.textContent = control.value;
        }

        const variant = this.findVariant(item);
        if (!variant) return;

        item.dataset.variantId = String(variant.id);
        item.dataset.available = String(Boolean(variant.available));
        this.updateItemDisplay(item, variant);
      }

      getSelectedOptions(item) {
        const options = [];
        item.querySelectorAll('[data-option-position]').forEach((control) => {
          const position = Number(control.dataset.optionPosition) - 1;
          if (control.type === 'radio' && !control.checked) return;
          options[position] = control.value;
        });
        return options;
      }

      findVariant(item) {
        const product = item._bundleProduct;
        if (!product?.variants?.length) return null;

        const selected = this.getSelectedOptions(item);
        return (
          product.variants.find((variant) =>
            selected.every((value, index) => value == null || variant.options[index] === value)
          ) || product.variants[0]
        );
      }

      updateItemDisplay(item, variant) {
        const priceEl = item.querySelector('[data-bundle-price]');
        const compareEl = item.querySelector('[data-bundle-compare]');
        const saveEl = item.querySelector('[data-bundle-save]');
        const imageEl = item.querySelector('[data-bundle-image]');

        if (priceEl) priceEl.textContent = variant.price || '';

        if (compareEl) {
          if (variant.compare_at_price) {
            compareEl.textContent = variant.compare_at_price;
            compareEl.hidden = false;
          } else {
            compareEl.textContent = '';
            compareEl.hidden = true;
          }
        }

        if (saveEl) {
          if (variant.save_label) {
            saveEl.textContent = variant.save_label;
            saveEl.hidden = false;
          } else {
            saveEl.textContent = '';
            saveEl.hidden = true;
          }
        }

        if (imageEl && variant.featured_image) {
          imageEl.src = variant.featured_image;
        } else if (imageEl && imageEl.dataset.defaultSrc) {
          imageEl.src = imageEl.dataset.defaultSrc;
        }
      }

      getSelectedItems() {
        return this.items.filter((item) => item.querySelector('[data-bundle-check]')?.checked);
      }

      getSectionsRequest() {
        if (!this.cart) return null;

        const sectionIds = this.cart.getSectionsToRender().map((section) => section.id);

        return {
          ids: sectionIds,
          param: sectionIds.join(','),
        };
      }

      hasRenderableSections(cartState) {
        const sectionsRequest = this.getSectionsRequest();
        if (!sectionsRequest || !cartState?.sections) return false;

        return sectionsRequest.ids.every((sectionId) => Boolean(cartState.sections[sectionId]));
      }

      fetchCartSections() {
        const sectionsRequest = this.getSectionsRequest();
        if (!sectionsRequest) return Promise.resolve(null);

        const url = `${window.routes.cart_url}.js?sections=${sectionsRequest.param}&sections_url=${encodeURIComponent(window.location.pathname)}`;

        return fetch(url, {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }).then((response) => response.json());
      }

      resolveCartState(response) {
        if (this.hasRenderableSections(response)) return Promise.resolve(response);

        return this.fetchCartSections().then((cartState) => {
          if (!cartState?.sections) return response;

          return {
            ...cartState,
            ...response,
            sections: cartState.sections,
            items: cartState.items ?? response.items,
            item_count: cartState.item_count ?? response.item_count,
          };
        });
      }

      updateSubmitState() {
        if (!this.submitButton || this.submitButton.classList.contains('loading')) return;

        const hasSelection = this.getSelectedItems().length > 0;
        this.submitButton.disabled = !hasSelection;
        this.submitButton.toggleAttribute('aria-disabled', !hasSelection);
      }

      onSubmit(event) {
        event.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        const selectedItems = this.getSelectedItems();
        if (!selectedItems.length) {
          this.showError(this.dataset.selectError || window.bundleSaveStrings?.selectOne || '');
          return;
        }

        const unavailable = selectedItems.find((item) => item.dataset.available === 'false');
        if (unavailable) {
          this.showError(this.dataset.unavailableError || window.bundleSaveStrings?.unavailable || '');
          return;
        }

        const items = selectedItems.map((item) => ({
          id: Number(item.dataset.variantId),
          quantity: 1,
        }));

        this.clearError();
        this.setLoading(true);

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';

        const body = { items };
        const sectionsRequest = this.getSectionsRequest();

        if (sectionsRequest) {
          body.sections = sectionsRequest.param;
          body.sections_url = window.location.pathname;
          this.cart.setActiveElement(document.activeElement);
        }

        config.body = JSON.stringify(body);

        fetch(`${window.routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.showError(response.description || response.message || window.cartStrings?.error);
              return null;
            }

            if (!this.cart) {
              window.location = window.routes.cart_url;
              return null;
            }

            return this.resolveCartState(response);
          })
          .then((cartState) => {
            if (!cartState || !this.cart) return;

            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'bundle-save',
              cartData: cartState,
            });

            if (this.cart.classList.contains('is-empty')) {
              this.cart.classList.remove('is-empty');
            }

            this.cart.renderContents(cartState);
          })
          .catch((error) => {
            console.error(error);
            this.showError(window.cartStrings?.error);
          })
          .finally(() => {
            this.setLoading(false);
          });
      }

      setLoading(isLoading) {
        this.submitButton.classList.toggle('loading', isLoading);
        this.submitButton.disabled = isLoading || !this.getSelectedItems().length;
        this.submitButton.toggleAttribute('aria-disabled', isLoading);
        this.querySelector('.loading__spinner')?.classList.toggle('hidden', !isLoading);

        if (!isLoading) this.updateSubmitState();
      }

      showError(message) {
        if (!this.errorEl || !message) return;
        this.errorEl.hidden = false;
        this.errorEl.textContent = message;
      }

      clearError() {
        if (!this.errorEl) return;
        this.errorEl.hidden = true;
        this.errorEl.textContent = '';
      }
    }
  );
}
