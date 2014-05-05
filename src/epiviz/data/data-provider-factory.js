/**
 * Created by: Florin Chelaru
 * Date: 10/1/13
 * Time: 1:28 PM
 */

goog.provide('epiviz.data.DataProviderFactory');

/**
 * A factory containing all the registered active data providers
 * (like EpivizR connections or PHP servers)
 * @param {epiviz.Config} config
 * @constructor
 * @implements {epiviz.utils.Iterable}
 */
epiviz.data.DataProviderFactory = function(config) {
  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;

  /**
   * @type {Array.<epiviz.data.DataProvider>}
   * @private
   */
  //this._providers = [];

  /**
   * @type {Object.<string, epiviz.data.DataProvider>}
   * @private
   */
  this._providers = {};

  /**
   * @type {number}
   * @private
   */
  this._size = 0;

  var tokens;
  for (var i = 0; i < this._config.dataProviders.length; ++i) {
    tokens = this._config.dataProviders[i].split(',');
    /**
     * @type {?function(new:epiviz.data.DataProvider)}
     */
    var dataProviderConstructor = epiviz.utils.evaluateFullyQualifiedTypeName(tokens[0]);

    if (!dataProviderConstructor) { continue; }

    /** @type {epiviz.data.DataProvider} */
    var dataProvider = epiviz.utils.applyConstructor(dataProviderConstructor, tokens.slice(1));

    this._providers[dataProvider.id()] = dataProvider;

    ++this._size;
  }
  var emptyProvider = new epiviz.data.EmptyResponseDataProvider();
  this._providers[emptyProvider.id()] = emptyProvider;
  ++this._size;

  tokens = this._config.workspacesDataProvider.split(',');
  /**
   * @type {?function(new:epiviz.data.DataProvider)}
   */
  var wsDataProviderConstructor = epiviz.utils.evaluateFullyQualifiedTypeName(tokens[0]);

  /** @type {epiviz.data.DataProvider} */
  this._workspacesDataProvider = epiviz.utils.applyConstructor(wsDataProviderConstructor, tokens.slice(1));

};

/**
 * Iterates through all registered data providers until the function
 *   evaluates to true
 * @param {function(epiviz.data.DataProvider)} func
 */
epiviz.data.DataProviderFactory.prototype.foreach = function(func) {
  for (var id in this._providers) {
    if (!this._providers.hasOwnProperty(id)) { continue; }
    if (func(this._providers[id])) { return; }
  }
};

/**
 * @returns {boolean}
 */
epiviz.data.DataProviderFactory.prototype.isEmpty = function() {
  //return !this._providers.length;
  return !this._size;
};

/**
 * @returns {number}
 */
epiviz.data.DataProviderFactory.prototype.size = function() {
  //return this._providers.length;
  return this._size;
};

/**
 * @param {string} id
 * @returns {epiviz.data.DataProvider}
 */
epiviz.data.DataProviderFactory.prototype.get = function(id) {
  if (id in this._providers) {
    return this._providers[id];
  }

  return null;
};

/**
 * @returns {epiviz.data.DataProvider}
 */
epiviz.data.DataProviderFactory.prototype.workspacesDataProvider = function() {
  return this._workspacesDataProvider;
};
