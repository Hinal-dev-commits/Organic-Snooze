if (!customElements.get('nw-sticky-bar')) {
  class NwStickyBar extends HTMLElement {
    connectedCallback() {
      this._portalToBody();
      if (this._initialized) return;
      this._initialized = true;

      this._abortController = new AbortController();
      const signal = this._abortController.signal;

      this.config = this._readConfig();
      this._selectedVariant = null;
      this._restoreMainVariantPicker();

      this.productInfo = document.querySelector('product-info');
      this.backdrop = this.querySelector('[data-sticky-backdrop]');
      this.drawer = this.querySelector('[data-sticky-drawer]');
      this.toggleBtn = this.querySelector('[data-sticky-toggle]');
      this.closeBtn = this.querySelector('[data-sticky-close]');
      this.variantMount = this.querySelector('[data-sticky-variant-mount]');
      this.bundleMount = this.querySelector('[data-sticky-bundle-mount]');

      this.imageEl = this.querySelector('[data-sticky-image]');
      this.drawerImageEl = this.querySelector('[data-sticky-drawer-image]');
      this.variantEl = this.querySelector('[data-sticky-variant]');
      this.variantMobileEl = this.querySelector('[data-sticky-variant-mobile]');
      this.priceEl = this.querySelector('[data-sticky-price]');
      this.priceMobileEl = this.querySelector('[data-sticky-price-mobile]');
      this.saveEl = this.querySelector('[data-sticky-save]');
      this.saveMobileEl = this.querySelector('[data-sticky-save-mobile]');
      this.affirmEls = this.querySelectorAll('[data-sticky-affirm], [data-sticky-affirm-mobile]');
      this.submitBtn = this.querySelector('[data-sticky-submit]');
      this.submitTextEl = this.querySelector('[data-sticky-submit-text]');

      this._clearLegacyScrollLock();
      this._bindSubmit(signal);
      this._bindDrawerControls(signal);
      this._bindVisibility(signal);
      this._bindVariantUpdates();
      this._bindThemeEditor(signal);
      this._scheduleDrawerPickerPrep(signal);
      this._initSelectedVariantState();
      this._refreshAffirm();
    }

    disconnectedCallback() {
      if (this._isPortaling) return;

      this._closeDrawer();
      this._clearLegacyScrollLock();
      this._restoreMainVariantPicker();
      this._drawerPickerAbort?.abort();
      this._drawerPickerAbort = null;
      this._drawerBundleAbort?.abort();
      this._drawerBundleAbort = null;
      this._abortController?.abort();
      this._abortController = null;
      this._visibilityObserver?.disconnect();
      this._visibilityObserver = null;
      this._variantChangeUnsubscriber?.();
      this._variantChangeUnsubscriber = null;
      this._optionChangeUnsubscriber?.();
      this._optionChangeUnsubscriber = null;
      this._scrollListener = null;
      this._keydownListener = null;
      this._initialized = false;
    }

    _portalToBody() {
      if (this.id) {
        document.querySelectorAll(`nw-sticky-bar[id="${CSS.escape(this.id)}"]`).forEach((node) => {
          if (node !== this) node.remove();
        });
      }

      if (this._portaled || this.parentElement === document.body) {
        this._portaled = true;
        return;
      }

      this._portaled = true;
      this._homeAnchor = document.createComment('nw-sticky-bar-home');
      this.parentElement?.insertBefore(this._homeAnchor, this);

      this._isPortaling = true;
      document.body.appendChild(this);
      this._isPortaling = false;
    }

    _bindThemeEditor(signal) {
      if (typeof Shopify === 'undefined' || !Shopify.designMode) return;

      const sectionId = this.dataset.sectionId;
      if (!sectionId) return;

      const onSectionLoad = (event) => {
        if (event.detail?.sectionId !== sectionId) return;

        const sectionRoot = document.getElementById(`shopify-section-${sectionId}`);
        const freshBar = sectionRoot?.querySelector('nw-sticky-bar');
        if (!freshBar || freshBar === this) return;

        this.remove();
      };

      const onSectionUnload = (event) => {
        if (event.detail?.sectionId !== sectionId) return;
        if (this.isConnected && this.parentElement === document.body) {
          this.remove();
        }
      };

      document.addEventListener('shopify:section:load', onSectionLoad, { signal });
      document.addEventListener('shopify:section:unload', onSectionUnload, { signal });
    }

    _readConfig() {
      const node = this.querySelector('[data-sticky-bar-config]');
      if (!node) return {};
      try {
        return JSON.parse(node.textContent);
      } catch {
        return {};
      }
    }

    _getMainVariantPicker() {
      return this.productInfo?.querySelector('variant-selects');
    }

    _getDrawerPicker() {
      return this.variantMount?.querySelector('[data-sticky-drawer-picker]');
    }

    _getMainBundleSave() {
      return this.productInfo?.querySelector('nw-bundle-save');
    }

    _getDrawerBundle() {
      return this.bundleMount?.querySelector('[data-sticky-drawer-bundle]');
    }

    _restoreMainVariantPicker() {
      const productInfo = document.querySelector('product-info');
      const mount = this.variantMount || document.querySelector('[data-sticky-variant-mount]');
      if (!mount || !productInfo) return;

      const movedMainPicker = mount.querySelector('variant-selects');
      if (!movedMainPicker) return;

      const sectionId = productInfo.dataset.section;
      const anchor =
        productInfo.querySelector(`#variant-selects-${sectionId}`)?.parentElement ||
        productInfo.querySelector('.product__info-container') ||
        productInfo;

      const buyForm = productInfo.querySelector('product-form');
      if (buyForm?.parentElement) {
        buyForm.parentElement.insertBefore(movedMainPicker, buyForm);
      } else {
        anchor.appendChild(movedMainPicker);
      }
    }

    _scheduleDrawerPickerPrep(signal) {
      const prepare = () => {
        if (!this.variantMount || !this._getMainVariantPicker()) return false;
        this._ensureDrawerPicker();
        this._ensureDrawerBundle();
        return true;
      };

      if (prepare()) return;

      const onProductInfoReady = () => {
        prepare();
      };

      document.addEventListener('product-info:loaded', onProductInfoReady, { signal });
      window.requestAnimationFrame(() => prepare());
    }

    _drawerPickerPrefix() {
      return `sticky-${this.dataset.sectionId || 'bar'}`;
    }

    _ensureDrawerPicker() {
      const mount = this.variantMount;
      const mainPicker = this._getMainVariantPicker();
      if (!mount || !mainPicker) return;

      const existing = this._getDrawerPicker();
      if (existing && !this._drawerPickerNeedsRebuild(mainPicker, existing)) {
        this._syncPickerState(mainPicker, existing);
        return;
      }

      this._installDrawerPickerFromMain(mainPicker);
    }

    _drawerPickerNeedsRebuild(mainPicker, drawerPicker) {
      const mainFieldsets = mainPicker.querySelectorAll('fieldset, .product-form__input--dropdown').length;
      const drawerFieldsets = drawerPicker.querySelectorAll('fieldset, .product-form__input--dropdown').length;
      if (mainFieldsets !== drawerFieldsets) return true;

      const mainKey = mainPicker.dataset.section || '';
      return drawerPicker.dataset.syncedFromSection !== mainKey;
    }

    _installDrawerPickerFromMain(mainPicker) {
      const mount = this.variantMount;
      if (!mount || !mainPicker) return;

      this._drawerPickerAbort?.abort();
      this._drawerPickerAbort = new AbortController();
      const drawerSignal = this._drawerPickerAbort.signal;

      mount.replaceChildren();

      const drawerPicker = document.createElement('div');
      drawerPicker.className = 'nw-sticky-bar__variant-picker';
      drawerPicker.setAttribute('data-sticky-drawer-picker', '');
      drawerPicker.dataset.syncedFromSection = mainPicker.dataset.section || '';

      if (mainPicker.getAttribute('style')) {
        drawerPicker.setAttribute('style', mainPicker.getAttribute('style'));
      }

      drawerPicker.innerHTML = mainPicker.innerHTML;
      this._isolateDrawerPicker(drawerPicker);
      mount.appendChild(drawerPicker);

      this._syncPickerState(mainPicker, drawerPicker);
      this._bindDrawerPickerSync(drawerPicker, drawerSignal);
    }

    _drawerBundleNeedsRebuild(mainBundle, drawerBundle) {
      if (!mainBundle || !drawerBundle) return true;
      const mainItems = mainBundle.querySelectorAll('[data-bundle-item]').length;
      const drawerItems = drawerBundle.querySelectorAll('[data-bundle-item]').length;
      if (mainItems !== drawerItems) return true;
      return drawerBundle.dataset.syncedFromMain !== 'true';
    }

    _ensureDrawerBundle() {
      const mount = this.bundleMount;
      const mainBundle = this._getMainBundleSave();
      if (!mount) return;

      if (!mainBundle) {
        mount.replaceChildren();
        mount.hidden = true;
        return;
      }

      mount.hidden = false;

      const existing = this._getDrawerBundle();
      if (existing && !this._drawerBundleNeedsRebuild(mainBundle, existing)) {
        this._syncBundleState(mainBundle, existing);
        return;
      }

      this._installDrawerBundleFromMain(mainBundle);
    }

    _installDrawerBundleFromMain(mainBundle) {
      const mount = this.bundleMount;
      if (!mount || !mainBundle) return;

      this._drawerBundleAbort?.abort();
      this._drawerBundleAbort = new AbortController();
      const bundleSignal = this._drawerBundleAbort.signal;

      mount.replaceChildren();

      const drawerBundle = document.createElement('div');
      drawerBundle.className = 'nw-bundle-save nw-sticky-bar__drawer-bundle';
      drawerBundle.setAttribute('data-sticky-drawer-bundle', '');
      drawerBundle.dataset.syncedFromMain = 'true';
      drawerBundle.innerHTML = mainBundle.innerHTML;

      drawerBundle.classList.remove('is-collapsed');
      drawerBundle.querySelector('[data-bundle-submit]')?.remove();
      drawerBundle.querySelector('[data-bundle-error]')?.remove();

      this._isolateDrawerPicker(drawerBundle);
      mount.appendChild(drawerBundle);

      this._syncBundleState(mainBundle, drawerBundle);
      this._bindDrawerBundleSync(drawerBundle, bundleSignal);
    }

    _syncBundleState(source, target) {
      if (!source || !target) return;

      source.querySelectorAll('[data-bundle-item]').forEach((sourceItem) => {
        const productId = sourceItem.dataset.productId;
        if (!productId) return;

        const targetItem = target.querySelector(`[data-bundle-item][data-product-id="${CSS.escape(productId)}"]`);
        if (!targetItem) return;

        const sourceCheck = sourceItem.querySelector('[data-bundle-check]');
        const targetCheck = targetItem.querySelector('[data-bundle-check]');
        if (sourceCheck && targetCheck) {
          targetCheck.checked = sourceCheck.checked;
        }

        targetItem.classList.toggle('is-selected', sourceItem.classList.contains('is-selected'));

        const sourceOptions = sourceItem.querySelector('[data-bundle-options]');
        const targetOptions = targetItem.querySelector('[data-bundle-options]');
        if (sourceOptions && targetOptions) {
          targetOptions.hidden = sourceOptions.hidden;
        }

        sourceItem.querySelectorAll('[data-option-position]').forEach((sourceControl) => {
          const targetControl = this._findMatchingBundleOptionControl(targetItem, sourceControl);
          if (!targetControl) return;

          if (targetControl.type === 'radio') {
            if (sourceControl.checked) {
              targetControl.checked = true;
            }
          } else if (targetControl.tagName === 'SELECT') {
            targetControl.value = sourceControl.value;
          }
        });

        this._syncBundleItemPresentation(sourceItem, targetItem);
      });
    }

    _findMatchingBundleOptionControl(item, control) {
      if (!item || !control) return null;

      const position = control.dataset.optionPosition;
      if (!position) return null;

      const matches = Array.from(
        item.querySelectorAll(`[data-option-position="${CSS.escape(position)}"]`)
      );

      if (control.type === 'radio') {
        return matches.find((el) => el.value === control.value) || null;
      }

      return matches[0] || null;
    }

    _syncBundleItemPresentation(sourceItem, targetItem) {
      const copyContent = (selector) => {
        const source = sourceItem.querySelector(selector);
        const target = targetItem.querySelector(selector);
        if (!source || !target) return;
        target.textContent = source.textContent;
        if (source.hasAttribute('hidden') || 'hidden' in source) {
          target.hidden = source.hidden;
        }
      };

      sourceItem.querySelectorAll('[data-selected-value]').forEach((sourceValue, index) => {
        const targetValue = targetItem.querySelectorAll('[data-selected-value]')[index];
        if (targetValue) targetValue.textContent = sourceValue.textContent;
      });

      copyContent('[data-bundle-price]');
      copyContent('[data-bundle-compare]');
      copyContent('[data-bundle-save]');

      const sourceImg = sourceItem.querySelector('[data-bundle-image]');
      const targetImg = targetItem.querySelector('[data-bundle-image]');
      if (sourceImg && targetImg && sourceImg.src) {
        targetImg.src = sourceImg.src;
      }
    }

    _findMainBundleControlForDrawerControl(control, mainBundle) {
      if (!control || !mainBundle) return null;

      const item = control.closest('[data-bundle-item]');
      if (!item?.dataset.productId) return null;

      const mainItem = mainBundle.querySelector(
        `[data-bundle-item][data-product-id="${CSS.escape(item.dataset.productId)}"]`
      );
      if (!mainItem) return null;

      if (control.matches('[data-bundle-check]')) {
        return mainItem.querySelector('[data-bundle-check]');
      }

      return this._findMatchingBundleOptionControl(mainItem, control);
    }

    _syncDrawerBundleControlToMain(control) {
      const mainBundle = this._getMainBundleSave();
      const mainControl = this._findMainBundleControlForDrawerControl(control, mainBundle);
      if (!mainControl) return false;

      if (mainControl.matches('[data-bundle-check]')) {
        if (mainControl.checked === control.checked) return false;
        mainControl.checked = control.checked;
        mainControl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      if (mainControl.type === 'radio') {
        if (!control.checked || mainControl.checked) return false;
        mainControl.checked = true;
        mainControl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      if (mainControl.tagName === 'SELECT') {
        if (mainControl.value === control.value) return false;
        mainControl.value = control.value;
        mainControl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    }

    _bindDrawerBundleSync(drawerBundle, signal) {
      drawerBundle.addEventListener(
        'change',
        (event) => {
          if (!drawerBundle.contains(event.target)) return;
          this._syncDrawerBundleControlToMain(event.target);
          const mainBundle = this._getMainBundleSave();
          if (mainBundle) {
            window.requestAnimationFrame(() => this._syncBundleState(mainBundle, drawerBundle));
          }
        },
        { signal }
      );

      drawerBundle.addEventListener(
        'click',
        (event) => {
          const collapseToggle = event.target.closest('[data-bundle-collapse-toggle]');
          if (collapseToggle && drawerBundle.contains(collapseToggle)) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        { signal }
      );
    }

    _isolateDrawerPicker(root) {
      const prefix = this._drawerPickerPrefix();

      root.querySelectorAll('[id]').forEach((el) => {
        const originalId = el.id;
        if (!originalId) return;
        el.dataset.stickyOriginalId = originalId;
        el.id = `${prefix}-${originalId}`;
      });

      root.querySelectorAll('label[for]').forEach((label) => {
        const forId = label.getAttribute('for');
        if (!forId || forId.startsWith(`${prefix}-`)) return;
        label.setAttribute('for', `${prefix}-${forId}`);
      });

      root.querySelectorAll('input[name], select[name]').forEach((el) => {
        el.dataset.stickyMainName = el.name;
        el.name = `${prefix}-${el.name}`;
      });

      root.querySelectorAll('[form]').forEach((el) => {
        el.removeAttribute('form');
      });

      root.querySelectorAll('script').forEach((node) => node.remove());
    }

    _bindSubmit(signal) {
      if (!this.submitBtn) return;

      this.submitBtn.addEventListener(
        'click',
        () => {
          if (this._selectedVariant?.id) {
            this._syncMainVariantInput(this._selectedVariant.id);
          }

          const mainButton = this._getMainSubmitButton();
          if (mainButton && !mainButton.disabled) {
            mainButton.click();
            return;
          }

          const form = this.productInfo?.querySelector('form[data-type="add-to-cart-form"]');
          if (form && typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else if (form) {
            form.submit();
          }
        },
        { signal }
      );
    }

    _getMainSubmitButton() {
      if (!this.productInfo) return null;
      return (
        this.productInfo.querySelector('[id^="ProductSubmitButton-"]') ||
        this.productInfo.querySelector('.product-form__submit')
      );
    }

    _bindDrawerControls(signal) {
      this.toggleBtn?.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          if (this.classList.contains('is-drawer-open')) {
            this._closeDrawer();
          } else {
            this._openDrawer();
          }
        },
        { signal }
      );

      this.closeBtn?.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          this._closeDrawer();
        },
        { signal }
      );

      this.backdrop?.addEventListener(
        'click',
        () => {
          this._closeDrawer();
        },
        { signal }
      );

      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Escape' && this.classList.contains('is-drawer-open')) {
            this._closeDrawer();
          }
        },
        { signal }
      );
    }

    _getStickyBarZIndex() {
      const raw = getComputedStyle(this).getPropertyValue('--nw-sticky-bar-z').trim();
      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 50;
    }

    _getDrawerLayerZIndex() {
      return Math.max(this._getStickyBarZIndex(), 101);
    }

    _applyDrawerLayerZIndex() {
      const drawerZ = this._getDrawerLayerZIndex();
      document.documentElement.style.setProperty('--nw-sticky-bar-drawer-z', String(drawerZ));
    }

    _clearLegacyScrollLock() {
      delete document.body.dataset.nwStickyBarScrollLock;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      document.documentElement.classList.remove('nw-sticky-bar-drawer-open');
      document.body.classList.remove('nw-sticky-bar-drawer-open');
      document.querySelector('[data-sticky-viewport-backdrop]')?.remove();
    }

    _openDrawer() {
      if (this.classList.contains('is-drawer-open')) return;

      try {
        this._ensureDrawerPicker();
        this._ensureDrawerBundle();
      } catch (error) {
        console.error('NW Sticky Bar: unable to prepare drawer variants', error);
      }

      this._applyDrawerLayerZIndex();
      this.classList.add('is-drawer-open', 'is-expanded');
      this.toggleBtn?.setAttribute('aria-expanded', 'true');
      this.backdrop?.setAttribute('aria-hidden', 'false');

      const mainPicker = this._getMainVariantPicker();
      const drawerPicker = this._getDrawerPicker();
      if (mainPicker && drawerPicker) {
        this._syncPickerState(mainPicker, drawerPicker);
      }
    }

    _closeDrawer() {
      this.classList.remove('is-drawer-open', 'is-expanded');
      this.toggleBtn?.setAttribute('aria-expanded', 'false');
      this.backdrop?.setAttribute('aria-hidden', 'true');
      this._clearLegacyScrollLock();
      this._refreshVisibilityAfterDrawerClose();
    }

    _refreshVisibilityAfterDrawerClose() {
      const mode = this.dataset.visibilityMode || 'scroll';

      if (mode === 'always') {
        this.classList.add('is-visible');
        return;
      }

      if (mode === 'scroll') {
        const offset = Number(this.dataset.scrollOffset) || 360;
        this.classList.toggle('is-visible', window.scrollY >= offset);
        return;
      }

      const observeEl =
        this.productInfo?.querySelector('.product-form__buttons') ||
        this.productInfo?.querySelector('product-form') ||
        this.productInfo;

      if (!observeEl) {
        this.classList.add('is-visible');
        return;
      }

      const rect = observeEl.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      this.classList.toggle('is-visible', !inView);
    }

    _readCurrentVariantId() {
      const sectionId = this.productInfo?.dataset?.section;
      if (!sectionId) return null;

      const input = this.productInfo.querySelector(`#product-form-${sectionId} input[name="id"]`);
      return input?.value || null;
    }

    _findVariantById(variantId) {
      if (!variantId || !Array.isArray(this.config?.variants)) return null;
      return this.config.variants.find((variant) => String(variant.id) === String(variantId)) || null;
    }

    _initSelectedVariantState() {
      const fromUrl = new URLSearchParams(window.location.search).get('variant');
      const variantId = fromUrl || this._readCurrentVariantId() || this.config?.initialVariantId;
      const variant = this._findVariantById(variantId);
      if (variant) {
        this._setSelectedVariant(variant, { syncCartInput: false, syncMainPicker: false });
      }
    }

    _setSelectedVariant(variant, options = {}) {
      if (!variant) return;

      const { syncCartInput = true, syncMainPicker = false } = options;
      this._selectedVariant = variant;
      this.dataset.selectedVariantId = String(variant.id);
      this._updateFromVariant(variant);

      if (syncCartInput) {
        this._syncMainVariantInput(variant.id);
      }

      if (syncMainPicker) {
        const mainPicker = this._getMainVariantPicker();
        const drawerPicker = this._getDrawerPicker();
        if (mainPicker && drawerPicker) {
          this._syncPickerState(drawerPicker, mainPicker);
        }
      }
    }

    _syncMainVariantInput(variantId) {
      const sectionId = this.productInfo?.dataset?.section;
      if (!sectionId) return;

      this.productInfo
        .querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}`)
        .forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          if (!input) return;
          const nextValue = variantId ? String(variantId) : '';
          if (input.value === nextValue) return;
          input.value = nextValue;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    _syncPickerState(source, target) {
      if (!source || !target) return;

      source.querySelectorAll('fieldset').forEach((sourceFieldset, index) => {
        const targetFieldset = target.querySelectorAll('fieldset')[index];
        if (!targetFieldset) return;

        const sourceSelected = sourceFieldset.querySelector('[data-selected-value]');
        const targetSelected = targetFieldset.querySelector('[data-selected-value]');
        if (sourceSelected && targetSelected) {
          targetSelected.innerHTML = sourceSelected.innerHTML;
        }
      });

      source.querySelectorAll('.product-form__input--dropdown').forEach((sourceDropdown, index) => {
        const targetDropdown = target.querySelectorAll('.product-form__input--dropdown')[index];
        if (!targetDropdown) return;

        const sourceSelected = sourceDropdown.querySelector('[data-selected-value]');
        const targetSelected = targetDropdown.querySelector('[data-selected-value]');
        if (sourceSelected && targetSelected) {
          targetSelected.innerHTML = sourceSelected.innerHTML;
        }
      });

      source.querySelectorAll('input[type="radio"]').forEach((sourceInput) => {
        const optionValueId = sourceInput.dataset.optionValueId;
        let targetInput = null;

        if (optionValueId) {
          targetInput = target.querySelector(
            `input[type="radio"][data-option-value-id="${CSS.escape(String(optionValueId))}"]`
          );
        }

        if (!targetInput) {
          const mainName = sourceInput.name;
          targetInput = Array.from(target.querySelectorAll('input[type="radio"]')).find(
            (input) => input.dataset.stickyMainName === mainName && input.value === sourceInput.value
          );
        }

        if (targetInput) targetInput.checked = sourceInput.checked;
      });

      source.querySelectorAll('select').forEach((sourceSelect) => {
        const targetSelect = Array.from(target.querySelectorAll('select')).find(
          (select) => select.dataset.stickyMainName === sourceSelect.name
        );
        if (!targetSelect) return;
        targetSelect.value = sourceSelect.value;
        const selectedOption = targetSelect.querySelector('option[selected]');
        if (selectedOption) selectedOption.removeAttribute('selected');
        const newSelected = targetSelect.querySelector(`option[value="${CSS.escape(sourceSelect.value)}"]`);
        if (newSelected) newSelected.setAttribute('selected', 'selected');
      });
    }

    _bindDrawerPickerSync(drawerPicker, signal) {
      const queueDrawerControlChange = (control) => {
        if (!control) return;
        this._scheduleDrawerControlChange(control);
      };

      drawerPicker.addEventListener(
        'change',
        (event) => {
          if (!drawerPicker.contains(event.target)) return;
          queueDrawerControlChange(this._resolveDrawerControl(event.target, drawerPicker));
        },
        { signal }
      );

      drawerPicker.addEventListener(
        'click',
        (event) => {
          const label = event.target.closest('label[for]');
          if (!label || !drawerPicker.contains(label)) return;
          const inputId = label.getAttribute('for');
          if (!inputId) return;
          const drawerInput = drawerPicker.querySelector(`#${CSS.escape(inputId)}`);
          if (!drawerInput || drawerInput.type !== 'radio') return;
          queueDrawerControlChange(drawerInput);
        },
        { capture: true, signal }
      );
    }

    _scheduleDrawerControlChange(control) {
      this._pendingDrawerControl = control;

      if (this._drawerChangeFrame) return;

      this._drawerChangeFrame = window.requestAnimationFrame(() => {
        this._drawerChangeFrame = null;
        const pendingControl = this._pendingDrawerControl;
        this._pendingDrawerControl = null;
        if (!pendingControl) return;
        if (pendingControl.type === 'radio' && !pendingControl.checked) return;

        this._updateDrawerSelectionMetadata(pendingControl);
        this._syncDrawerControlToMain(pendingControl);
      });
    }

    _resolveDrawerControl(target, drawerPicker) {
      if (!target || !drawerPicker.contains(target)) return null;
      if (target.tagName === 'SELECT') return target;
      if (target.type === 'radio') return target;
      return null;
    }

    _updateDrawerSelectionMetadata(target) {
      const { value, tagName } = target;

      if (tagName === 'SELECT' && target.selectedOptions.length) {
        Array.from(target.options)
          .find((option) => option.getAttribute('selected'))
          ?.removeAttribute('selected');
        target.selectedOptions[0].setAttribute('selected', 'selected');

        const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
        const selectedDropdownSwatchValue = target
          .closest('.product-form__input')
          ?.querySelector('[data-selected-value] > .swatch');
        if (selectedDropdownSwatchValue) {
          if (swatchValue) {
            selectedDropdownSwatchValue.style.setProperty('--swatch--background', swatchValue);
            selectedDropdownSwatchValue.classList.remove('swatch--unavailable');
          } else {
            selectedDropdownSwatchValue.style.setProperty('--swatch--background', 'unset');
            selectedDropdownSwatchValue.classList.add('swatch--unavailable');
          }

          selectedDropdownSwatchValue.style.setProperty(
            '--swatch-focal-point',
            target.selectedOptions[0].dataset.optionSwatchFocalPoint || 'unset'
          );
        }
        return;
      }

      if (tagName === 'INPUT' && target.type === 'radio') {
        const selectedValue = target.closest('.product-form__input')?.querySelector('[data-selected-value]');
        if (selectedValue) selectedValue.innerHTML = value;
      }
    }

    _findMainControlForDrawerControl(control, mainPicker) {
      if (!control || !mainPicker) return null;

      const mainName = control.dataset.stickyMainName;
      const optionValueId = control.dataset.optionValueId;

      if (control.tagName === 'SELECT') {
        if (!mainName) return null;
        if (optionValueId) {
          for (const select of mainPicker.querySelectorAll('select')) {
            const option = Array.from(select.options).find(
              (opt) => String(opt.dataset.optionValueId || '') === String(optionValueId)
            );
            if (option) return { element: select, value: option.value };
          }
        }

        const mainSelect = Array.from(mainPicker.querySelectorAll('select')).find((select) => select.name === mainName);
        if (!mainSelect) return null;
        return { element: mainSelect, value: control.value };
      }

      if (control.type === 'radio') {
        if (optionValueId) {
          const byId = mainPicker.querySelector(
            `input[type="radio"][data-option-value-id="${CSS.escape(String(optionValueId))}"]`
          );
          if (byId) return { element: byId };
        }

        if (mainName) {
          const normalizedDrawerValue = this._normalizeOptionValue(control.value);
          const byValue = Array.from(
            mainPicker.querySelectorAll(`input[type="radio"][name="${CSS.escape(mainName)}"]`)
          ).find((radio) => this._normalizeOptionValue(radio.value) === normalizedDrawerValue);
          if (byValue) return { element: byValue };
        }

        const drawerRoot = this._getDrawerPicker();
        const drawerFieldset = control.closest('fieldset');
        if (drawerRoot && drawerFieldset && drawerRoot.contains(drawerFieldset) && optionValueId) {
          const fieldsetIndex = Array.from(drawerRoot.querySelectorAll('fieldset')).indexOf(drawerFieldset);
          const mainFieldset = mainPicker.querySelectorAll('fieldset')[fieldsetIndex];
          const byFieldset = mainFieldset?.querySelector(
            `input[type="radio"][data-option-value-id="${CSS.escape(String(optionValueId))}"]`
          );
          if (byFieldset) return { element: byFieldset };
        }
      }

      return null;
    }

    _syncDrawerControlToMain(control) {
      const mainPicker = this._getMainVariantPicker();
      const match = this._findMainControlForDrawerControl(control, mainPicker);
      if (!match?.element) return false;

      if (match.element.tagName === 'SELECT') {
        if (match.element.value === match.value) return false;
        this._syncingFromDrawer = true;
        try {
          match.element.value = match.value;
          match.element.dispatchEvent(new Event('change', { bubbles: true }));
        } finally {
          queueMicrotask(() => {
            this._syncingFromDrawer = false;
          });
        }
        return true;
      }

      if (match.element.type === 'radio') {
        if (!control.checked || match.element.checked) return false;
        this._syncingFromDrawer = true;
        try {
          match.element.checked = true;
          match.element.dispatchEvent(new Event('change', { bubbles: true }));
        } finally {
          queueMicrotask(() => {
            this._syncingFromDrawer = false;
          });
        }
        return true;
      }

      return false;
    }

    _syncDrawerFromMain() {
      if (this._syncingFromDrawer) return;

      const mainPicker = this._getMainVariantPicker();
      const drawerPicker = this._getDrawerPicker();
      if (!mainPicker || !drawerPicker) return;

      if (this._drawerPickerNeedsRebuild(mainPicker, drawerPicker)) {
        this._installDrawerPickerFromMain(mainPicker);
        return;
      }

      this._syncPickerState(mainPicker, drawerPicker);
    }

    _getSelectionValuesFromPicker(picker) {
      if (!picker) return [];

      const values = [];

      picker.querySelectorAll('fieldset, .product-form__input--dropdown').forEach((group) => {
        const checked = group.querySelector('input[type="radio"]:checked');
        if (checked?.value) {
          values.push(checked.value);
          return;
        }

        const select = group.querySelector('select');
        if (select?.value) values.push(select.value);
      });

      return values;
    }

    _normalizeOptionValue(value) {
      const raw = String(value ?? '').trim();
      if (!raw) return '';

      const textarea = document.createElement('textarea');
      textarea.innerHTML = raw;
      return textarea.value.replace(/\s+/g, ' ');
    }

    _resolveVariantFromPicker(picker) {
      const selectedValues = this._getSelectionValuesFromPicker(picker).map((value) =>
        this._normalizeOptionValue(value)
      );
      const variants = this.config?.variants;
      if (!selectedValues.length || !Array.isArray(variants) || !variants.length) return null;

      const optionCount = picker.querySelectorAll('fieldset, .product-form__input--dropdown').length;
      if (optionCount && selectedValues.length < optionCount) return null;

      return (
        variants.find((variant) => {
          const options = (variant.options || []).map((option) => this._normalizeOptionValue(option));
          if (options.length !== selectedValues.length) return false;
          return options.every((option, index) => option === selectedValues[index]);
        }) || null
      );
    }

    _bindVisibility(signal) {
      const mode = this.dataset.visibilityMode || 'scroll';

      if (mode === 'always') {
        this.classList.add('is-visible');
        return;
      }

      if (mode === 'scroll') {
        const offset = Number(this.dataset.scrollOffset) || 360;
        const onScroll = () => {
          if (this.classList.contains('is-drawer-open')) return;
          this.classList.toggle('is-visible', window.scrollY >= offset);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true, signal });
        return;
      }

      const observeEl =
        this.productInfo?.querySelector('.product-form__buttons') ||
        this.productInfo?.querySelector('product-form') ||
        this.productInfo;

      if (!observeEl) {
        this.classList.add('is-visible');
        return;
      }

      this._visibilityObserver = new IntersectionObserver(
        (entries) => {
          if (this.classList.contains('is-drawer-open')) return;
          const entry = entries[0];
          if (!entry) return;
          this.classList.toggle('is-visible', !entry.isIntersecting);
        },
        { root: null, threshold: 0 }
      );

      this._visibilityObserver.observe(observeEl);
    }

    _bindVariantUpdates() {
      if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;

      this._variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
        const { variant, sectionId } = event.data || {};
        const productSectionId = this.productInfo?.dataset?.section;
        if (productSectionId && sectionId && sectionId !== productSectionId) return;

        if (variant?.id) {
          const resolved = this._findVariantById(variant.id) || variant;
          this._setSelectedVariant(resolved, { syncCartInput: false, syncMainPicker: false });
        }

        this._syncDrawerFromMain();
        if (this.classList.contains('is-drawer-open')) {
          this._ensureDrawerBundle();
        }
      });

      this._optionChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, (event) => {
        if (this._syncingFromDrawer) return;

        const target = event.data?.event?.target;
        if (!target || !this.productInfo?.contains(target)) return;

        window.requestAnimationFrame(() => this._syncDrawerFromMain());
      });
    }

    _updateFromVariant(variant) {
      const label = this._getVariantLabel(variant);

      if (this.config.showVariant) {
        [this.variantEl, this.variantMobileEl].forEach((el) => {
          if (!el) return;
          if (label) {
            el.textContent = label;
            el.hidden = false;
          } else {
            el.textContent = '';
            el.hidden = true;
          }
        });
      }

      const priceText = this._formatMoney(variant.price);
      if (this.priceEl) this.priceEl.textContent = priceText;
      if (this.priceMobileEl) this.priceMobileEl.textContent = priceText;

      const compare = Number(variant.compare_at_price);
      const price = Number(variant.price);
      const saveAmount = compare > price ? compare - price : 0;
      const saveText =
        saveAmount > 0
          ? `${this.config.savePrefix || 'You save'} ${this._formatMoney(saveAmount, true)}`
          : '';

      if (this.config.showSave) {
        [this.saveEl, this.saveMobileEl].forEach((el) => {
          if (!el) return;
          if (saveText) {
            el.textContent = saveText;
            el.hidden = false;
          } else {
            el.hidden = true;
          }
        });
      }

      if (this.config.showImage) {
        const imageSrc = variant.featured_image?.src;
        [this.imageEl, this.drawerImageEl].forEach((img) => {
          if (!img || !imageSrc) return;
          const separator = imageSrc.includes('?') ? '&' : '?';
          img.src = `${imageSrc}${separator}width=800`;
          if (variant.featured_image.alt) img.alt = variant.featured_image.alt;
        });
      }

      if (this.config.showAffirm) {
        this.affirmEls.forEach((el) => {
          el.setAttribute('data-amount', variant.price);
        });
        this._refreshAffirm();
      }

      if (this.submitBtn && this.submitTextEl) {
        const available = variant.available !== false;
        this.submitBtn.disabled = !available;
        const addText = (this.config.addToCartText || 'Add to cart').toUpperCase();
        this.submitTextEl.textContent = available
          ? addText
          : (this.config.soldOutText || window.variantStrings?.soldOut || 'Sold out').toUpperCase();
      }
    }

    _getVariantLabel(variant) {
      if (!variant) return '';
      if (Array.isArray(variant.options) && variant.options.length) {
        return variant.options.filter(Boolean).join(' · ');
      }
      if (variant.title && variant.title !== 'Default Title') return variant.title;
      return '';
    }

    _formatMoney(cents, stripZeros) {
      const amount = Number(cents);
      if (!Number.isFinite(amount)) return '';

      const format = this.config?.moneyFormat;
      let formatted = '';

      if (format) {
        formatted = this._applyMoneyFormat(amount, format);
      } else if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
        formatted = Shopify.formatMoney(amount);
      } else {
        const currency = window.Shopify?.currency?.active;
        const locale = document.documentElement.lang || window.Shopify?.locale || undefined;
        formatted = currency
          ? new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / 100)
          : (amount / 100).toFixed(2);
      }

      if (stripZeros) {
        formatted = formatted.replace(/(\.|,)00(?=\D*$)/, '');
      }
      return formatted;
    }

    _applyMoneyFormat(cents, format) {
      const placeholder = /\{\{\s*(\w+)\s*\}\}/;
      const template = String(format);
      const match = template.match(placeholder);
      if (!match) return template;

      const formatWithDelimiters = (number, precision, thousands, decimal) => {
        const prec = precision == null ? 2 : precision;
        const thou = thousands == null ? ',' : thousands;
        const dec = decimal == null ? '.' : decimal;
        const parts = (Number(number) / 100).toFixed(prec).split('.');
        const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thou}`);
        const centsPart = parts[1] ? dec + parts[1] : '';
        return dollars + centsPart;
      };

      let value;
      switch (match[1]) {
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ');
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_with_apostrophe_separator':
          value = formatWithDelimiters(cents, 2, "'", '.');
          break;
        case 'amount_with_space_separator':
          value = formatWithDelimiters(cents, 2, ' ', ',');
          break;
        case 'amount_with_period_and_space_separator':
          value = formatWithDelimiters(cents, 2, ' ', '.');
          break;
        default:
          value = formatWithDelimiters(cents, 2);
      }

      return template.replace(placeholder, value);
    }

    _refreshAffirm() {
      if (typeof affirm !== 'undefined' && affirm.ui?.refresh) {
        affirm.ui.refresh();
      }
    }
  }

  customElements.define('nw-sticky-bar', NwStickyBar);
}
