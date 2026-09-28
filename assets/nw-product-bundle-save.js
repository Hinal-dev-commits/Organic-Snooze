if (!customElements.get('nw-bundle-save')) {
  customElements.define(
    'nw-bundle-save',
    class NwBundleSave extends HTMLElement {
      connectedCallback() {
        if (this.dataset.bound === 'true') return;
        this.dataset.bound = 'true';

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

        this.initCollapseToggle();
      }

      initCollapseToggle() {
        this.collapseToggle = this.querySelector('[data-bundle-collapse-toggle]');
        this.collapsePanel = this.querySelector('[data-bundle-collapse-panel]');
        if (!this.collapseToggle || !this.collapsePanel) return;

        this.collapseToggle.addEventListener('click', () => this.toggleCollapsed());
      }

      toggleCollapsed() {
        if (!this.collapseToggle) return;

        const willCollapse = !this.classList.contains('is-collapsed');
        this.classList.toggle('is-collapsed', willCollapse);
        this.collapseToggle.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');
      }

      toggleItem(item, selected) {
        item.classList.toggle('is-selected', selected);
        const options = item.querySelector('[data-bundle-options]');
        if (options) options.hidden = !selected;
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
    }
  );
}
