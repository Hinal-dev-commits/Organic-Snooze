/**
 * Footer link-list accordion (mobile ≤767px).
 * Click target: .footer-block--menu .footer-block__heading (inside [data-footer-menu-accordion]).
 * Height animation via Web Animations API (no max-height in CSS).
 */
(function () {
  const MQ = '(max-width: 749px)';
  const ROOT = '[data-footer-menu-accordion]';

  function isMobile() {
    return window.matchMedia(MQ).matches;
  }

  function getHeading(root) {
    for (let i = 0; i < root.children.length; i++) {
      const el = root.children[i];
      if (el.matches && el.matches('h2.footer-block__heading')) return el;
    }
    return null;
  }

  function getPanel(root) {
    for (let i = 0; i < root.children.length; i++) {
      const el = root.children[i];
      if (el.matches && el.matches('.footer-menu-accordion__panel')) return el;
    }
    return null;
  }

  function cancelPanelAnimation(panel) {
    if (typeof panel.getAnimations !== 'function') return;
    panel.getAnimations().forEach((a) => a.cancel());
  }

  function setDesktop(heading, panel) {
    cancelPanelAnimation(panel);
    panel.style.height = '';
    panel.style.overflow = '';
    heading.classList.add('is-open');
    heading.setAttribute('aria-expanded', 'true');
    heading.removeAttribute('tabindex');
    heading.removeAttribute('role');
    panel.setAttribute('aria-hidden', 'false');
  }

  function setMobileClosed(heading, panel) {
    cancelPanelAnimation(panel);
    panel.style.overflow = 'hidden';
    panel.style.height = '0px';
    heading.classList.remove('is-open');
    heading.setAttribute('aria-expanded', 'false');
    heading.setAttribute('tabindex', '0');
    heading.setAttribute('role', 'button');
    panel.setAttribute('aria-hidden', 'true');
  }

  function animateHeight(panel, keyframes, onFinish) {
    cancelPanelAnimation(panel);
    const anim = panel.animate(keyframes, {
      duration: 360,
      easing: 'ease-out',
    });
    anim.onfinish = onFinish;
    return anim;
  }

  function openPanel(heading, panel) {
    panel.style.overflow = 'hidden';
    const end = panel.scrollHeight;
    const start = panel.getBoundingClientRect().height;
    panel.style.height = `${start}px`;
    requestAnimationFrame(() => {
      animateHeight(
        panel,
        [{ height: `${start}px` }, { height: `${end}px` }],
        () => {
          panel.style.height = 'auto';
          panel.style.overflow = '';
          heading.classList.add('is-open');
          heading.setAttribute('aria-expanded', 'true');
          panel.setAttribute('aria-hidden', 'false');
        }
      );
    });
  }

  function closePanel(heading, panel) {
    panel.style.overflow = 'hidden';
    const h = panel.scrollHeight;
    panel.style.height = `${h}px`;
    requestAnimationFrame(() => {
      animateHeight(
        panel,
        [{ height: `${h}px` }, { height: '0px' }],
        () => {
          panel.style.height = '0px';
          heading.classList.remove('is-open');
          heading.setAttribute('aria-expanded', 'false');
          panel.setAttribute('aria-hidden', 'true');
        }
      );
    });
  }

  function toggle(heading, panel) {
    if (!isMobile()) return;
    const open = heading.classList.contains('is-open');
    if (open) {
      closePanel(heading, panel);
    } else {
      openPanel(heading, panel);
    }
  }

  function bindAccordion(root) {
    const heading = getHeading(root);
    const panel = getPanel(root);
    if (!heading || !panel) return;

    heading.addEventListener('click', (e) => {
      if (!isMobile()) return;
      e.preventDefault();
      toggle(heading, panel);
    });

    heading.addEventListener('keydown', (e) => {
      if (!isMobile()) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(heading, panel);
      }
    });
  }

  function applyMode() {
    document.querySelectorAll(ROOT).forEach((root) => {
      const heading = getHeading(root);
      const panel = getPanel(root);
      if (!heading || !panel) return;

      if (!isMobile()) {
        setDesktop(heading, panel);
      } else {
        setMobileClosed(heading, panel);
      }
    });
  }

  function init() {
    document.querySelectorAll(ROOT).forEach(bindAccordion);
    applyMode();

    const mql = window.matchMedia(MQ);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', applyMode);
    } else {
      mql.addListener(applyMode);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
