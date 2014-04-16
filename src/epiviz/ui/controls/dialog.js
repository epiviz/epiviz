/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 10/19/13
 * Time: 2:03 PM
 */

goog.provide('epiviz.ui.controls.Dialog');

/**
 * @param {string} title
 * @param {Object.<string, function>} handlers
 * @constructor
 */
epiviz.ui.controls.Dialog = function(title, handlers) {
  /**
   * @type {jQuery}
   * @protected
   */
  this._container = $('#dialogs');

  /**
   * @type {string}
   * @protected
   */
  this._title = title;

  /**
   * @type {string}
   * @protected
   */
  this._id = epiviz.ui.controls.Dialog.generateId();

  /**
   * @type {Object.<string, Function>}
   * @protected
   */
  this._handlers = handlers;

  this._container.append(sprintf('<div id="%s" title="%s" style="display: none;"></div>', this._id, this._title));

  /**
   * @type {jQuery}
   * @protected
   */
  this._dialog = null;
};

/**
 * @type {number}
 * @private
 */
epiviz.ui.controls.Dialog._nextIdIndex = 0;

/**
 * @returns {string}
 */
epiviz.ui.controls.Dialog.generateId = function() {
  return sprintf('dialog-%s', epiviz.utils.generatePseudoGUID(5));
};

/**
 */
epiviz.ui.controls.Dialog.prototype.show = function() {};
