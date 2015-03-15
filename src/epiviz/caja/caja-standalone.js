/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/27/2015
 * Time: 9:47 AM
 */

goog.provide('epiviz.caja.cajole');

/**
 * @param {string} funcStr
 * @param {Object.<string, *>} [args]
 * @returns {epiviz.deferred.Deferred.<function>}
 */
epiviz.caja.cajole = function(funcStr, args) {
  var deferred = new epiviz.deferred.Deferred();
  deferred.resolve(eval('(' + funcStr + ')'));
  return deferred;
};
