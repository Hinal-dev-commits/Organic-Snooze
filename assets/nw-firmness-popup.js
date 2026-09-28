(function () {
  const ROOT_SELECTOR = 'modal-dialog.nw-firmness-popup[data-nw-firmness-popup]';

  function closeAccordion(item) {
    if (!item || !item.classList.contains('is-open')) return;
    const trigger = item.querySelector('[data-firmness-accordion-trigger]');
    const panel = item.querySelector('[data-firmness-accordion-panel]');
    item.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (panel) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      // Force repaint to establish current height before transitioning to 0
      panel.offsetHeight;
      panel.style.maxHeight = '0px';
      panel.style.opacity = '0';
    }
  }

  function openAccordion(item) {
    if (!item) return;
    const trigger = item.querySelector('[data-firmness-accordion-trigger]');
    const panel = item.querySelector('[data-firmness-accordion-panel]');
    item.classList.add('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    if (panel) {
      panel.hidden = false;
      panel.style.maxHeight = '0px';
      panel.style.opacity = '0';
      // Force repaint to establish 0px height before transitioning to scrollHeight
      panel.offsetHeight;
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.style.opacity = '1';
    }
  }

  function closeAllAccordions(root) {
    root.querySelectorAll('[data-firmness-accordion]').forEach(closeAccordion);
  }

  function toggleAccordion(item) {
    const isOpen = item.classList.contains('is-open');
    const root = item.closest(ROOT_SELECTOR);
    if (root) {
      root.querySelectorAll('[data-firmness-accordion]').forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains('is-open')) {
          closeAccordion(otherItem);
        }
      });
    }

    if (isOpen) {
      closeAccordion(item);
    } else {
      openAccordion(item);
    }
  }

  function bindModal(modal) {
    if (!modal || modal.dataset.firmnessPopupBound === 'true') return;
    modal.dataset.firmnessPopupBound = 'true';

    modal.querySelectorAll('[data-firmness-accordion-panel]').forEach((panel) => {
      panel.addEventListener('transitionend', (event) => {
        if (event.propertyName !== 'max-height') return;
        const item = panel.closest('[data-firmness-accordion]');
        if (item && item.classList.contains('is-open')) {
          panel.style.maxHeight = 'none';
        } else {
          panel.hidden = true;
          panel.style.maxHeight = '';
        }
      });
    });

    modal.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-firmness-accordion-trigger]');
      if (!trigger || !modal.contains(trigger)) return;
      event.preventDefault();
      const item = trigger.closest('[data-firmness-accordion]');
      if (item) toggleAccordion(item);
    });

    document.body.addEventListener('modalClosed', () => {
      if (!modal.hasAttribute('open')) closeAllAccordions(modal);
    });
  }

  function init() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(bindModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', (event) => {
    const modal = event.target.querySelector?.(ROOT_SELECTOR);
    if (modal) bindModal(modal);
  });
})();
