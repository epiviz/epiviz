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
  caja.load(
    undefined,  // no DOM access
    undefined,  // no network access
    function(frame) {
      frame.code(
        undefined,
        'application/javascript',
        'return (' + funcStr + ');')
        .api(args ? args : {})
        .run(function(func) {
          deferred.resolve(func);
        });
    });
  return deferred;
};

/**
 * @returns {Object.<string, *>}
 */
epiviz.caja.buildChartMethodContext = function() {
  return {
    epiviz: {
      ui: {
        charts: epiviz.ui.charts,
        controls: epiviz.ui.controls
      },
      utils: epiviz.utils,
      plugins: epiviz.plugins,
      measurements: epiviz.measurements,
      events: epiviz.events,
      deferred: epiviz.deferred,
      datatypes: epiviz.datatypes,
      Config: epiviz.Config
    },
    d3: d3,
    $: $
  };
};
