(function () {
  function initFaq(section) {
    if (!section) return;
    var searchInput = section.querySelector('.nw-faq__search-input');
    var faqList = section.querySelector('.nw-faq__list');
    if (!faqList) return;
    var faqItems = faqList.querySelectorAll('.nw-faq__item');
    var moreBtn = section.querySelector('.nw-faq__more');
    var initialLimit = parseInt(faqList.getAttribute('data-initial-limit') || '6', 10);

    if (moreBtn && faqItems.length > initialLimit) {
      faqItems.forEach(function (item, index) {
        if (index >= initialLimit) {
          item.classList.add('is-hidden-by-limit');
        }
      });

      moreBtn.addEventListener('click', function (e) {
        if (moreBtn.getAttribute('data-toggle') === 'true') {
          e.preventDefault();
          var isExpanded = moreBtn.classList.contains('is-expanded');
          if (isExpanded) {
            faqItems.forEach(function (item, index) {
              if (index >= initialLimit) {
                item.classList.add('is-hidden-by-limit');
              }
            });
            moreBtn.classList.remove('is-expanded');
            moreBtn.textContent = moreBtn.getAttribute('data-more-text') || "SEE MORE FAQ'S";
          } else {
            faqItems.forEach(function (item) {
              item.classList.remove('is-hidden-by-limit');
            });
            moreBtn.classList.add('is-expanded');
            moreBtn.textContent = moreBtn.getAttribute('data-less-text') || "SEE LESS FAQ'S";
          }
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var query = searchInput.value.trim().toLowerCase();
        if (!query) {
          faqItems.forEach(function (item, index) {
            item.style.display = '';
            if (moreBtn && !moreBtn.classList.contains('is-expanded') && index >= initialLimit) {
              item.classList.add('is-hidden-by-limit');
            }
          });
          if (moreBtn) moreBtn.style.display = '';
          return;
        }

        if (moreBtn) moreBtn.style.display = 'none';

        faqItems.forEach(function (item) {
          item.classList.remove('is-hidden-by-limit');
          item.removeAttribute('open');
          var qEl = item.querySelector('.nw-faq__question');
          var aEl = item.querySelector('.nw-faq__answer');
          var text = ((qEl ? qEl.textContent : '') + ' ' + (aEl ? aEl.textContent : '')).toLowerCase();
          if (text.indexOf(query) !== -1) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }
  }

  function bootFaq() {
    document.querySelectorAll('.nw-faq').forEach(initFaq);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootFaq);
  } else {
    bootFaq();
  }

  document.addEventListener('shopify:section:load', function (e) {
    var section = e.target.classList.contains('nw-faq') ? e.target : e.target.querySelector('.nw-faq');
    if (section) initFaq(section);
  });
})();
