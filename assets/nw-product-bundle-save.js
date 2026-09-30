if (!customElements.get('nw-bundle-save')) {
  customElements.define(
    'nw-bundle-save',
    class NwBundleSave extends HTMLElement {
      connectedCallback() {
        if (this.dataset.bound === 'true') return;
        this.dataset.bound = 'true';

        this.items = Array.from(this.querySelectorAll('[data-bundle-item]'));
        const modalSelector = this.dataset.quickViewModal;
        this.quickViewModal = modalSelector
          ? document.querySelector(modalSelector)
          : this.parentElement?.querySelector('[data-nw-bundle-quick-view]');
        this.activeQuickViewItem = null;

        this.items.forEach((item) => {
          const jsonEl = item.querySelector('[data-bundle-product-json]');
          try {
            item._bundleProduct = JSON.parse(jsonEl?.textContent || '{}');
          } catch (error) {
            item._bundleProduct = { variants: [] };
          }

          const checkbox = item.querySelector('[data-bundle-check]');
          checkbox?.addEventListener('change', () => {
            this.toggleItem(item, checkbox.checked);
            this.updateSummary();
          });

          item.querySelectorAll('[data-option-position]').forEach((control) => {
            control.addEventListener('change', () => {
              this.onOptionChange(item, control);
              this.updateSummary();
            });
          });

          item.querySelector('[data-bundle-details]')?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.openQuickView(item, event.currentTarget);
          });
        });

        this.initCollapseToggle();
        this.initQuickView();
        this.updateSummary();
      }

      initCollapseToggle() {
        this.collapseToggle = this.querySelector('[data-bundle-collapse-toggle]');
        this.collapsePanel = this.querySelector('[data-bundle-collapse-panel]');
        if (!this.collapseToggle || !this.collapsePanel) return;

        this.collapseToggle.addEventListener('click', () => this.toggleCollapsed());
      }

      toggleCollapsed() {
        if (!this.collapseToggle) return;

        const collapsed = this.classList.toggle('is-collapsed');
        this.collapseToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
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

      getSelectedItems() {
        return Array.from(this.querySelectorAll('[data-bundle-item]')).filter(
          (item) => item.querySelector('[data-bundle-check]')?.checked || item.classList.contains('is-selected')
        );
      }

      getSelectedCartItems() {
        const seen = new Set();
        const discountPercent = Number(this.dataset.discountPercentage);
        const safePercent = Number.isFinite(discountPercent)
          ? Math.min(100, Math.max(0, discountPercent))
          : 0;

        return this.getSelectedItems().reduce((items, item) => {
          const variant = this.findVariant(item);
          if (variant ? variant.available === false : item.dataset.available === 'false') return items;

          const variantId = Number(variant?.id || item.dataset.variantId);
          if (!variantId || seen.has(variantId)) return items;
          seen.add(variantId);

          const properties = {
            _bundle_save: 'true',
          };

          if (safePercent > 0) {
            properties._bundle_discount_percent = String(safePercent);
            if (variant?.price_cents != null) {
              properties._bundle_price = String(variant.price_cents);
            }
          }

          items.push({
            id: variantId,
            quantity: 1,
            properties,
          });

          return items;
        }, []);
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

        const metaEl = item.querySelector('[data-bundle-prices-meta]');
        const sepEl = item.querySelector('[data-bundle-prices-sep]');
        const showMeta = Boolean(variant.compare_at_price && variant.save_label);
        if (metaEl) metaEl.hidden = !showMeta;
        if (sepEl) sepEl.hidden = !showMeta;

        if (imageEl && variant.featured_image) {
          imageEl.src = variant.featured_image;
        } else if (imageEl && imageEl.dataset.defaultSrc) {
          imageEl.src = imageEl.dataset.defaultSrc;
        }
      }

      updateSummary() {
        const selected = this.getSelectedItems();
        const count = selected.length;
        const subtitleEl = this.querySelector('[data-bundle-subtitle]');
        const previewTextEl = this.querySelector('[data-bundle-preview-text]');

        let totalSaveCents = 0;
        selected.forEach((item) => {
          const variant = this.findVariant(item);
          if (variant?.save_cents) totalSaveCents += Number(variant.save_cents) || 0;
        });

        if (count > 0) {
          this.classList.add('has-selection');
          if (subtitleEl) {
            const template = this.dataset.subtitleSelectedTemplate || '';
            subtitleEl.textContent = template
              .replace('__COUNT__', String(count))
              .replace('__AMOUNT__', this.formatMoney(totalSaveCents, true));
          }
          if (previewTextEl) {
            previewTextEl.textContent = selected
              .map((item) => item.dataset.shortTitle || item._bundleProduct?.short_title || item._bundleProduct?.title)
              .filter(Boolean)
              .join(', ');
          }
        } else {
          this.classList.remove('has-selection');
          if (subtitleEl) subtitleEl.textContent = this.dataset.subtitleDefault || '';
          if (previewTextEl) previewTextEl.textContent = this.dataset.previewDefault || '';
        }

        this.querySelectorAll('[data-preview-thumb]').forEach((thumb) => {
          const productId = thumb.dataset.productId;
          const isSelected = selected.some((item) => item.dataset.productId === productId);
          thumb.classList.toggle('is-selected', isSelected);
        });

        this.dispatchEvent(new CustomEvent('nw-bundle-selection-change', { bubbles: true }));
        document.querySelector('product-info')?.dispatchEvent(
          new CustomEvent('nw-bundle-selection-change', { bubbles: true })
        );
      }

      initQuickView() {
        if (!this.quickViewModal) return;

        const addBtn = this.quickViewModal.querySelector('[data-quick-view-add]');
        addBtn?.addEventListener('click', () => {
          if (!this.activeQuickViewItem) return;
          const checkbox = this.activeQuickViewItem.querySelector('[data-bundle-check]');
          if (checkbox && !checkbox.disabled) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }
          this.quickViewModal.hide?.();
        });

        this.quickViewModal.addEventListener('click', (event) => {
          const button = event.target.closest('[data-quick-view-thumb-btn]');
          if (!button || !this.quickViewModal.contains(button)) return;
          const hero = this.quickViewModal.querySelector('[data-quick-view-hero]');
          if (hero) {
            hero.src = button.dataset.fullSrc || '';
            hero.alt = button.dataset.alt || '';
          }
          this.quickViewModal.querySelectorAll('[data-quick-view-thumb-btn]').forEach((el) => {
            el.classList.toggle('is-active', el === button);
          });
        });
      }

      destroyQuickViewThumbsSwiper() {
        const thumbsEl = this.quickViewModal?.querySelector('[data-quick-view-thumbs]');
        const instance = this.quickViewThumbsSwiper || thumbsEl?.swiper;
        if (instance?.destroy) {
          instance.destroy(true, true);
        }
        this.quickViewThumbsSwiper = null;
      }

      initQuickViewThumbs(modal, media) {
        this.destroyQuickViewThumbsSwiper();
        const thumbsEl = modal.querySelector('[data-quick-view-thumbs]');
        const wrapper = modal.querySelector('[data-quick-view-thumbs-wrapper]');
        if (!thumbsEl || !wrapper) return;

        if (!media.length) {
          thumbsEl.hidden = true;
          wrapper.replaceChildren();
          return;
        }

        wrapper.replaceChildren();
        media.forEach((entry, index) => {
          const slide = document.createElement('div');
          slide.className = 'swiper-slide';
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `nw-bundle-quick-view__thumb${index === 0 ? ' is-active' : ''}`;
          button.dataset.quickViewThumbBtn = '';
          button.dataset.fullSrc = entry.src || '';
          button.dataset.alt = entry.alt || '';
          button.innerHTML = `<img src="${entry.thumb || entry.src}" alt="${entry.alt || ''}" width="56" height="56" loading="lazy">`;
          slide.appendChild(button);
          wrapper.appendChild(slide);
        });
        thumbsEl.hidden = media.length <= 1;

        if (media.length <= 1) return;

        const initSwiper = () => {
          if (typeof Swiper === 'undefined') return;
          if (thumbsEl.swiper) {
            thumbsEl.swiper.update();
            this.quickViewThumbsSwiper = thumbsEl.swiper;
            return;
          }
          this.quickViewThumbsSwiper = new Swiper(thumbsEl, {
            slidesPerView: 'auto',
            spaceBetween: 8,
            freeMode: { enabled: true, momentum: true },
            watchOverflow: true,
            resistanceRatio: 0.85,
            breakpoints: {
              750: { spaceBetween: 10 },
            },
          });
        };

        if (typeof window.nwWhenSwiperReady === 'function') {
          window.nwWhenSwiperReady(initSwiper);
        } else {
          initSwiper();
        }
      }

      openQuickView(item, opener) {
        if (!this.quickViewModal) return;

        const product = item._bundleProduct;
        const variant = this.findVariant(item);
        if (!product || !variant) return;

        this.activeQuickViewItem = item;
        const modal = this.quickViewModal;

        const titleEl = modal.querySelector('[data-quick-view-title]');
        const titleOverride = modal.dataset.qvTitleOverride || '';
        if (titleEl) titleEl.textContent = titleOverride || product.title || '';

        const priceRow = modal.querySelector('[data-quick-view-price-row]');
        const priceEl = modal.querySelector('[data-quick-view-price]');
        const compareEl = modal.querySelector('[data-quick-view-compare]');
        const badgeEl = modal.querySelector('[data-quick-view-badge]');

        if (priceRow && priceEl) {
          priceRow.hidden = false;
          priceEl.textContent = variant.price || '';
          if (compareEl) {
            if (variant.compare_at_price) {
              compareEl.textContent = variant.compare_at_price;
              compareEl.hidden = false;
            } else {
              compareEl.textContent = '';
              compareEl.hidden = true;
            }
          }
          if (badgeEl) {
            if (variant.bundle_badge_label) {
              badgeEl.textContent = variant.bundle_badge_label;
              badgeEl.hidden = false;
            } else {
              badgeEl.textContent = '';
              badgeEl.hidden = true;
            }
          }
        }

        const ratingWrap = modal.querySelector('[data-quick-view-rating]');
        const starsEl = modal.querySelector('[data-quick-view-stars]');
        const ratingValueEl = modal.querySelector('[data-quick-view-rating-value]');
        const ratingCountEl = modal.querySelector('[data-quick-view-rating-count]');

        if (ratingWrap && product.rating_value) {
          ratingWrap.hidden = false;
          if (starsEl) starsEl.innerHTML = this.renderStars(product.rating_value, product.rating_scale || 5);
          if (ratingValueEl) ratingValueEl.textContent = `[${Number(product.rating_value).toFixed(1)}]`;
          if (ratingCountEl) {
            ratingCountEl.textContent = `(${product.rating_count || 0} reviews)`;
          }
        } else if (ratingWrap) {
          ratingWrap.hidden = true;
        }

        const descriptionEl = modal.querySelector('[data-quick-view-description]');
        const descriptionOverride = modal.dataset.qvDescriptionOverride || '';
        const descriptionSource = descriptionOverride || product.description || '';
        const descriptionLimit = Number(modal.dataset.qvDescriptionLimit) || 220;
        const descriptionText = this.truncateText(descriptionSource, descriptionLimit);

        if (descriptionEl) {
          if (descriptionText) {
            descriptionEl.textContent = descriptionText;
            descriptionEl.hidden = false;
          } else {
            descriptionEl.textContent = '';
            descriptionEl.hidden = true;
          }
        }

        this.renderHighlights(modal, descriptionSource);
        this.renderSpecs(modal, product);
        this.renderWarranty(modal);

        const hero = modal.querySelector('[data-quick-view-hero]');
        const media = Array.isArray(product.media) ? product.media.filter((entry) => entry?.src) : [];

        if (hero) {
          const first = media[0];
          if (first) {
            hero.src = first.src;
            hero.alt = first.alt || product.title || '';
            hero.hidden = false;
          } else if (variant.featured_image) {
            hero.src = variant.featured_image;
            hero.alt = product.title || '';
            hero.hidden = false;
          }
        }

        const addBtn = modal.querySelector('[data-quick-view-add]');
        if (addBtn) {
          const template = this.dataset.bundleAddTemplate || '';
          const addBtnText = addBtn.querySelector('[data-quick-view-add-text]') || addBtn;
          addBtnText.textContent = template.replace('__PRICE__', variant.price || '');
          addBtn.hidden = false;
        }

        const link = modal.querySelector('[data-quick-view-link]');
        if (link && product.url) link.href = product.url;

        if (typeof modal.show === 'function') {
          modal.show(opener);
        } else {
          modal.setAttribute('open', '');
        }

        window.requestAnimationFrame(() => {
          this.initQuickViewThumbs(modal, media);
        });
      }

      renderHighlights(modal, description) {
        const wrap = modal.querySelector('[data-quick-view-highlights-wrap]');
        const list = modal.querySelector('[data-quick-view-highlights]');
        if (!wrap || !list) return;

        const bullets = String(description || '')
          .split(/\n+/)
          .map((line) => line.replace(/^[-•*]\s*/, '').trim())
          .filter((line) => line.length > 24)
          .slice(0, 4);

        if (!bullets.length) {
          wrap.hidden = true;
          list.replaceChildren();
          return;
        }

        list.replaceChildren(
          ...bullets.map((text) => {
            const li = document.createElement('li');
            li.textContent = text;
            return li;
          })
        );
        wrap.hidden = false;
      }

      truncateText(text, limit) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        if (!normalized) return '';
        const max = Math.max(50, Number(limit) || 220);
        if (normalized.length <= max) return normalized;
        return `${normalized.slice(0, max).trim()}…`;
      }

      getQuickViewSetting(modal, attributeName) {
        if (!modal?.getAttribute) return '';
        const value = modal.getAttribute(`data-${attributeName}`);
        return value == null ? '' : String(value);
      }

      getQuickViewShippingDays(modal) {
        const raw = this.getQuickViewSetting(modal, 'qv-shipping-days');
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 3;
      }

      renderWarranty(modal) {
        const wrap = modal.querySelector('[data-quick-view-warranty-wrap]');
        if (!wrap) return;

        const warrantyTitle = this.getQuickViewSetting(modal, 'qv-warranty-title');
        const warrantyText = this.getQuickViewSetting(modal, 'qv-warranty-text');
        const returnsTitle = this.getQuickViewSetting(modal, 'qv-returns-title');
        const returnsText = this.getQuickViewSetting(modal, 'qv-returns-text');

        const warrantyTile = modal.querySelector('[data-quick-view-warranty-tile]');
        const returnsTile = modal.querySelector('[data-quick-view-returns-tile]');
        const warrantyTitleEl = modal.querySelector('[data-quick-view-warranty-title]');
        const warrantyTextEl = modal.querySelector('[data-quick-view-warranty-text]');
        const returnsTitleEl = modal.querySelector('[data-quick-view-returns-title]');
        const returnsTextEl = modal.querySelector('[data-quick-view-returns-text]');
        const noteEl = modal.querySelector('[data-quick-view-shipping-note]');

        let hasContent = false;

        if (warrantyTile && warrantyTitleEl && warrantyTextEl) {
          const showWarranty = Boolean(warrantyTitle || warrantyText);
          warrantyTile.hidden = !showWarranty;
          if (showWarranty) {
            warrantyTitleEl.textContent = warrantyTitle;
            warrantyTextEl.textContent = warrantyText;
            hasContent = true;
          } else {
            warrantyTitleEl.textContent = '';
            warrantyTextEl.textContent = '';
          }
        }

        if (returnsTile && returnsTitleEl && returnsTextEl) {
          const showReturns = Boolean(returnsTitle || returnsText);
          returnsTile.hidden = !showReturns;
          if (showReturns) {
            returnsTitleEl.textContent = returnsTitle;
            returnsTextEl.textContent = returnsText;
            hasContent = true;
          } else {
            returnsTitleEl.textContent = '';
            returnsTextEl.textContent = '';
          }
        }

        const shippingNote = this.buildShippingNote(modal);

        if (noteEl) {
          if (shippingNote) {
            noteEl.textContent = shippingNote;
            noteEl.hidden = false;
            hasContent = true;
          } else {
            noteEl.textContent = '';
            noteEl.hidden = true;
          }
        }

        wrap.hidden = !hasContent;
      }

      buildShippingNote(modal) {
        const noteTemplate = this.getQuickViewSetting(modal, 'qv-warranty-note').trim();
        const safeDays = this.getQuickViewShippingDays(modal);
        const dateText = this.formatShippingDate(safeDays);
        if (!dateText) return noteTemplate;

        if (!noteTemplate) {
          return `Ships free with your mattress, est. ${dateText}.`;
        }

        if (noteTemplate.includes('__DATE__') || noteTemplate.includes('[DATE]')) {
          return noteTemplate.replace(/__DATE__|\[DATE\]/g, dateText);
        }

        if (/\best\.?\s/i.test(noteTemplate)) {
          const prefix = noteTemplate.replace(/\best\.?\s.*$/i, '').trim().replace(/[,;]\s*$/, '');
          return `${prefix}, est. ${dateText}.`;
        }

        const trimmed = noteTemplate.replace(/[.!?]\s*$/, '').trim();
        return `${trimmed}, est. ${dateText}.`;
      }

      formatShippingDate(days) {
        const offset = Number(days);
        if (!Number.isFinite(offset) || offset < 0) return '';
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + offset);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      renderSpecs(modal, product) {
        const wrap = modal.querySelector('[data-quick-view-specs-wrap]');
        const table = modal.querySelector('[data-quick-view-specs]');
        if (!wrap || !table) return;

        const rows = [];
        if (product.description) {
          rows.push({
            label: 'Includes',
            value: product.description.split('.')[0],
          });
        }

        if (!rows.length) {
          wrap.hidden = true;
          table.replaceChildren();
          return;
        }

        table.replaceChildren(
          ...rows.map((row) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'nw-bundle-quick-view__spec-row';
            rowEl.innerHTML = `<span class="nw-bundle-quick-view__spec-label">${row.label}</span><span class="nw-bundle-quick-view__spec-value">${row.value}</span>`;
            return rowEl;
          })
        );
        wrap.hidden = false;
      }

      renderStars(value, scale) {
        const rating = Number(value) || 0;
        const max = Number(scale) || 5;
        const filled = Math.round(rating);
        let html = '';
        for (let i = 1; i <= max; i += 1) {
          const opacity = i <= filled ? '1' : '0.25';
          html += `<svg viewBox="0 0 12 12" aria-hidden="true" style="opacity:${opacity}"><path fill="currentColor" d="M6 0.5L7.545 4.13L11.5 4.635L8.75 7.37L9.455 11.31L6 9.505L2.545 11.31L3.25 7.37L0.5 4.635L4.455 4.13L6 0.5Z"/></svg>`;
        }
        return html;
      }

      formatMoney(cents, stripZeros) {
        const amount = Number(cents);
        if (!Number.isFinite(amount)) return '';

        const format = this.dataset.moneyFormat;
        let formatted = '';

        if (format) {
          formatted = this.applyMoneyFormat(amount, format);
        } else if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
          formatted = Shopify.formatMoney(amount);
        } else {
          formatted = (amount / 100).toFixed(2);
        }

        if (stripZeros) {
          formatted = formatted.replace(/(\.|,)00(?=\D*$)/, '');
        }
        return formatted;
      }

      applyMoneyFormat(cents, format) {
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
    }
  );
}
