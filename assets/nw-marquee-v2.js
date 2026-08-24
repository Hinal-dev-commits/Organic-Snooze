(function () {
  function initMarquee(el) {
    if (!el) return;
  }

  function bootMarquees() {
    document.querySelectorAll('.nw-marquee-v2').forEach(initMarquee);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootMarquees);
  } else {
    bootMarquees();
  }

  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', function (e) {
      var section = e.target.classList.contains('nw-marquee-v2') ? e.target : e.target.querySelector('.nw-marquee-v2');
      if (section) initMarquee(section);
    });
  }
})();
