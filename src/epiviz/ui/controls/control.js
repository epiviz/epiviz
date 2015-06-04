/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/17/13
 * Time: 11:38 AM
 */

goog.provide('epiviz.ui.controls.Control');

/**
 * @param {jQuery} container
 * @param {string} [title]
 * @param {string} [id]
 * @constructor
 */
epiviz.ui.controls.Control = function(container, title, id) {
  /**
   * @type {jQuery}
   * @protected
   */
  this._container = container;

  /**
   * @type {string}
   * @private
   */
  this._title = title || '';

  /**
   * @type {string}
   * @private
   */
  this._id = id || epiviz.utils.generatePseudoGUID(6);
};

/**
 */
epiviz.ui.controls.Control.prototype.initialize = function() {};

/**
 * @returns {string}
 */
epiviz.ui.controls.Control.prototype.id = function() { return this._id; };

/**
 * @returns {string}
 */
epiviz.ui.controls.Control.prototype.title = function() { return this._title; };
