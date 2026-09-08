(function () {
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }

    return Promise.resolve();
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-nw-article-share-copy]');
    if (!link) return;

    event.preventDefault();

    var url = link.getAttribute('data-nw-article-share-copy');
    if (!url) return;

    copyText(url).then(function () {
      link.setAttribute('aria-label', 'Link copied');
      link.classList.add('is-copied');

      window.setTimeout(function () {
        link.classList.remove('is-copied');
      }, 2000);
    });
  });
})();
