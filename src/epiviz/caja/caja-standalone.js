/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/27/2015
 * Time: 9:47 AM
 */

goog.provide('caja');
goog.provide('epiviz.caja');

caja.initialize = function() {};

/**
 * @param {string} funcStr
 * @param {Object.<string, *>} [args]
 * @returns {epiviz.deferred.Deferred.<function>}
 */
epiviz.caja.cajole = function(funcStr, args) {
  var deferred = new epiviz.deferred.Deferred();

  setTimeout(function() {
    deferred.resolve(eval('(' + funcStr + ')'));
  }, 0);

  return deferred;
};

/**
 * @param {string} scriptUrl
 * @param {Object.<string, *>} [args]
 * @returns {epiviz.deferred.Deferred}
 */
epiviz.caja.run = function(scriptUrl, args) {
  var deferred = new epiviz.deferred.Deferred();

  setTimeout(function() {
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = script.onload = function() {
      deferred.resolve();
    };

    // Fire the loading
    head.appendChild(script);
  }, 0);

  return deferred;
};

/**
 * @param {Array.<string>} scriptUrls
 * @param {Array.<Object.<string, *>>|Object.<string, *>} [args]
 * @returns {epiviz.deferred.Deferred}
 */
epiviz.caja.chain = function(scriptUrls, args) {
  if (!$.isArray(args)) {
    args = epiviz.utils.fillArray(scriptUrls.length, args);
  }
  return epiviz.utils.deferredFor(scriptUrls.length, function(j) {
    return epiviz.caja.run(scriptUrls[j], args[j]);
  });
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
      data: {
        DataProvider: epiviz.data.DataProvider,
        Request: epiviz.data.Request,
        Response: epiviz.data.Response,
        WebServerDataProvider: {
          // TODO: In the future, restrict the access to this method, as it can be a risk factor
          // TODO: For now, it is kept here for DataProvider plugins
          makeGetRequest: epiviz.data.WebServerDataProvider.makeGetRequest
        }
      },
      Config: epiviz.Config
    },
    d3: d3,
    $: $,
    sprintf: sprintf,
    goog: goog
  };
};
