/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 1/6/2015
 * Time: 1:50 PM
 */

goog.provide('epiviz.ui.controls.CodeControl');

/**
 * @param {jQuery} container
 * @param {string} [title]
 * @param {string} [id]
 * @param {Object} [targetObject]
 * @constructor
 * @extends {epiviz.ui.controls.Control}
 */
epiviz.ui.controls.CodeControl = function(container, title, id, targetObject) {
  // Call superclass constructor
  epiviz.ui.controls.Control.call(this, container, title, id);

  /**
   * @type {Object}
   * @protected
   */
  this._targetObj = targetObject;

  /**
   * @type {string}
   * @protected
   */
  this._text = '// TODO: Your code here\n';
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.CodeControl.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Control.prototype);
epiviz.ui.controls.CodeControl.constructor = epiviz.ui.controls.CodeControl;

epiviz.ui.controls.CodeControl.prototype.initialize = function() {};

/**
 */
epiviz.ui.controls.CodeControl.prototype.save = function() {};

/**
 */
epiviz.ui.controls.CodeControl.prototype.revert = function() {};

/**
 * @returns {string}
 */
epiviz.ui.controls.CodeControl.prototype.text = function() { return this._text; };

/**
 * @returns {*}
 */
epiviz.ui.controls.CodeControl.prototype.result = function() { return null; };
