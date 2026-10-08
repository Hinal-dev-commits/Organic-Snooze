/**
 * Upcart (AfterSell): exclude tagged products from AI and manual upsells.
 * @see https://aftersell.mintlify.app/upcart/exclude_certain_products_from_upcart_upsells_ai_recommendations_manual
 */
(function () {
  var EXCLUDE_TAGS = ['exclude-recommendation'];
  var previousModify = window.upcartModifyListOfUpsells;

  function shouldExcludeUpsell(item) {
    if (!item) return false;
    var tags = Array.isArray(item.tags) ? item.tags : [];
    return tags.some(function (tag) {
      return EXCLUDE_TAGS.indexOf(tag) !== -1;
    });
  }

  window.upcartModifyListOfUpsells = function (upsells) {
    var list = upsells;

    if (typeof previousModify === 'function') {
      list = previousModify(list);
    }

    if (!Array.isArray(list)) {
      return list;
    }

    return list.filter(function (item) {
      return !shouldExcludeUpsell(item);
    });
  };
})();
