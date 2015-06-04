/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 3/30/14
 * Time: 9:33 PM
 */

goog.provide('epiviz.ui.controls.DataTable');

/**
 * @param {jQuery} container
 * @param {Array.<epiviz.ui.controls.DataTable.Column>} columns
 * @param {Iterable.<T>} rows
 * @param {function(T, epiviz.ui.controls.DataTable.Column): number|string} rowParser
 * @param {boolean} [multiselect]
 * @param {boolean} [showColumnSelector]
 * @constructor
 * @extends {epiviz.ui.controls.Control}
 * @template T
 */
epiviz.ui.controls.DataTable = function(container, columns, rows, rowParser, multiselect, showColumnSelector) {
  // Call superclass constructor
  epiviz.ui.controls.Control.call(this, container);

  /**
   * @type {Array.<epiviz.ui.controls.DataTable.Column>}
   * @private
   */
  this._columns = columns;

  /**
   * @type {Iterable.<T>}
   * @private
   */
  this._rows = rows;

  /**
   * @type {Array.<T>}
   * @private
   */
  this._rowsArray = [];

  var self = this;
  this._rows.foreach(function(row) { self._rowsArray.push(row); });

  /**
   * @type {function(T, epiviz.ui.controls.DataTable.Column): number|string}
   * @private
   */
  this._rowParser = rowParser;

  /**
   * @type {boolean}
   * @private
   */
  this._multiselect = multiselect || false;

  /**
   * @type {boolean}
   * @private
   */
  this._showColumnSelector = showColumnSelector || false;

  /**
   * @type {?jQuery}
   * @private
   */
  this._table = null;

  /**
   * @type {?jQuery}
   * @private
   */
  this._columnSelector = null;

  /**
   * @type {Array.<number>}
   * @private
   */
  this._selectedIndices = [];

  /**
   * @type {Object.<number, boolean>}
   * @private
   */
  this._selectedIndicesMap = {};

  // Helper members used for selection

  /**
   * @type {?Array.<HTMLElement>}
   * @private
   */
  this._selectList = null;

  /**
   * @type {?Array.<HTMLElement>}
   * @private
   */
  this._deselectList = null;

  /**
   * @type {?HTMLElement}
   * @private
   */
  this._lastSelection = null;
};

/**
 * Copy methods from upper class
 */
epiviz.ui.controls.DataTable.prototype = epiviz.utils.mapCopy(epiviz.ui.controls.Control.prototype);
epiviz.ui.controls.DataTable.constructor = epiviz.ui.controls.DataTable;

/**
 * @enum {string}
 */
epiviz.ui.controls.DataTable.ColumnType = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean'
};

epiviz.ui.controls.DataTable.prototype.initialize = function() {
  this._container.append('<div class="epiviz-data-table"><table style="width: 100%!important;"><thead></thead><tbody></tbody><tfoot></tfoot></table></div>');
  this._table = this._container.find('table');
  var thead = this._table.find('thead');
  var tfoot = this._table.find('tfoot');
  var tbody = this._table.find('tbody');

  var headFootContent = sprintf('<tr><th>%s</th></tr>', this._columns.join('</th><th>'));
  thead.append(headFootContent);
  tfoot.append(headFootContent);

  var self = this;
  this._rows.foreach(
    /** @param {T} row */
    function(row) {
      var rowHtml = '';
      for (var i = 0; i < self._columns.length; ++i) {
        rowHtml += sprintf('<td>%s</td>', self._rowParser(row, self._columns[i]));
      }
      tbody.append(sprintf('<tr>%s</tr>', rowHtml));
    });

  var j;
  var columnFilterTypes = new Array(this._columns.length);
  for (j = 0; j < this._columns.length; ++j) {
    columnFilterTypes[j] = {
      type: 'text',
      bRegex: true,
      bSmart: true
    };
  }

  this._table.dataTable({
    bJQueryUI: true,
    sDom: '<"H"lfr>Tt<"F"ip>',
    oTableTools: {
      //'sSwfPath': 'src/jquery/DataTables-1.9.4/extras/TableTools/media/swf/copy_csv_xls_pdf.swf',
      sRowSelect: this._multiselect ? 'multi' : 'single',
      aButtons: [],

      fnPreRowSelect: function(e, nodes, isSelect) { return self._preRowSelect(this, e, nodes, isSelect); },
      fnRowSelected:  function(nodes) { return self._select(this, nodes); },
      fnRowDeselected: function(nodes) { return self._select(this, nodes); }
    }
  }).columnFilter({ aoColumns: columnFilterTypes });

  var visibleIndex = -1;
  for (j = 0; j < this._columns.length; ++j) {
    if (this._columns[j].isVisible) { ++visibleIndex; }
    this._table.fnSetColumnVis(j, this._columns[j].isVisible);
    if (!this._columns[j].defaultFilter) { continue; }
    this._table.fnFilter(this._columns[j].defaultFilter, j, true, true);
    this._table
      .find('tfoot')
      .find(sprintf('th:eq(%s)', visibleIndex))
      .find('input')
      .removeClass('search_init')
      .val(this._columns[j].defaultFilter);
  }

  // Hack
  this._container.find('.ui-buttonset').first().attr('style', 'position: absolute!important;');

  if (this._showColumnSelector) {
    var colSelectorCls = 'epiviz-data-table-column-selector';
    this._container.find('.fg-toolbar').first().append(sprintf(
      '<div style="float: right; margin-right: 5px;">' +
        '<label>Selected Columns: </label>' +
        '<select class="%s" multiple="multiple" style="">' +
          '<option value="-1">All</option>' +
        '</select>' +
      '</div>', colSelectorCls));

    this._columnSelector = this._container.find('.' + colSelectorCls);
    for (var i = 0; i < this._columns.length; ++i) {
      var option = sprintf('<option value="%s"%s%s>%s</option>',
        i,
        this._columns[i].isVisible ? ' selected="selected"' : '',
        this._columns[i].isFixed ? ' disabled="disabled"' : '',
        this._columns[i].name);

      this._columnSelector.append(option);
    }

    this._columnSelector.dropdownchecklist({
      width: '80px',
      firstItemChecksAll: true,
      onComplete: function(selector) { self._selectColumns(selector); }
    });
  }
};

/**
 * @returns {Array.<number>}
 */
epiviz.ui.controls.DataTable.prototype.selectedIndices = function() {
  return this._selectedIndices || [];
};

/**
 * @returns {Array.<T>}
 */
epiviz.ui.controls.DataTable.prototype.selectedRows = function() {
  if (!this._selectedIndices) { return []; }

  var result = new Array(this._selectedIndices.length);
  for (var i = 0; i < this._selectedIndices.length; ++i) {
    result[i] = this._rowsArray[this._selectedIndices[i]];
  }

  return result;
};

/**
 * @param {TableTools} tableTools
 * @param {jQuery.Event} e
 * @param {Array.<HTMLElement>} nodes
 * @param {boolean} isSelect
 * @returns {boolean}
 * @private
 */
epiviz.ui.controls.DataTable.prototype._preRowSelect = function(tableTools, e, nodes, isSelect) {
  if (e) {
    this._selectList = this._deselectList = null;
    if (e.shiftKey && nodes.length == 1) {
      this._deselectList = tableTools.fnGetSelected();
      if (!this._lastSelection) { this._lastSelection = nodes[0]; }
      this._selectList = this._getRangeOfRows(this._lastSelection, nodes[0]);
    } else {
      this._lastSelection = nodes[0];
      if (!e.ctrlKey && !e.metaKey) {
        this._deselectList = tableTools.fnGetSelected();
        if (!isSelect) {
          this._selectList = nodes;
        }
      }
    }
  }
  return true;
};

/**
 * @param {HTMLElement} fromNode
 * @param {HTMLElement} toNode
 * @returns {?Array.<HTMLElement>}
 * @private
 */
epiviz.ui.controls.DataTable.prototype._getRangeOfRows = function(fromNode, toNode) {
  var
    fromPos = this._table.fnGetPosition(fromNode),
    toPos = this._table.fnGetPosition(toNode),
    oSettings = this._table.fnSettings(),
    fromIndex = $.inArray(fromPos, oSettings.aiDisplay),
    toIndex = $.inArray(toPos, oSettings.aiDisplay),
    result = [];

  if (fromIndex >= 0 && toIndex >= 0) {
    for (var i = Math.min(fromIndex, toIndex); i <= Math.max(fromIndex, toIndex); ++i) {
      var dataIndex = oSettings.aiDisplay[i];
      result.push(oSettings.aoData[dataIndex].nTr);
    }
  }
  return (result.length > 0) ? result : null;
};

/**
 * @param {TableTools} tableTools
 * @param {Array.<HTMLElement>} nodes
 * @returns {boolean}
 * @private
 */
epiviz.ui.controls.DataTable.prototype._select = function(tableTools, nodes) {
  var nodeList;
  if (this._deselectList) {
    nodeList = this._deselectList;
    this._deselectList = null;
    tableTools.fnDeselect(nodeList);
  }
  if (this._selectList) {
    nodeList = this._selectList;
    if (!this._multiselect && nodeList.length > 0) {
      nodeList = [nodeList[nodeList.length - 1]];}
    this._selectList = null;
    tableTools.fnSelect(nodeList);
  }

  var selection = tableTools.fnGetSelected();

  // We want to maintain order of selected indices, so we'll remove from the
  // _selectedIndices member the indices that have been deselected, and
  // add the new ones.

  var selectedIndices = new Array(selection.length);
  var selectedIndicesMap = {};

  var i;
  for (i = 0; i < selection.length; ++i) {
    selectedIndices[i] = this._table.fnGetPosition(selection[i]);
    selectedIndicesMap[selectedIndices[i]] = true;
  }

  // Remove indices corresponding to deselected nodes
  for (i = 0; i < this._selectedIndices.length; ++i) {
    if (!selectedIndicesMap[this._selectedIndices[i]]) {
      delete this._selectedIndicesMap[this._selectedIndices[i]];
      this._selectedIndices.splice(i, 1);
      --i;
    }
  }

  // Add indices corresponding to newly selected nodes
  for (i = 0; i < selectedIndices.length; ++i) {
    if (!this._selectedIndicesMap[selectedIndices[i]]) {
      this._selectedIndicesMap[selectedIndices[i]] = true;
      this._selectedIndices.push(selectedIndices[i]);
    }
  }

  return true;
};

/**
 * @param selector
 * @private
 */
epiviz.ui.controls.DataTable.prototype._selectColumns = function(selector) {
  var selectedIndices = {}, i;
  for(i = 0; i < selector.options.length; ++i) {
    if (selector.options[i].selected && selector.options[i].value) {
      selectedIndices[parseInt(selector.options[i].value)] = true;
    }
  }

  for (i = 0; i < this._columns.length; ++i) {
    this._table.fnSetColumnVis(i, selectedIndices[i] || this._columns[i].isFixed);
  }
};

goog.provide('epiviz.ui.controls.DataTable.Column');

/**
 * @param {string} id
 * @param {string} name
 * @param {epiviz.ui.controls.DataTable.ColumnType} type
 * @param {boolean} [isHidden]
 * @param {boolean} [isFixed]
 * @param {string} [defaultFilter]
 * @constructor
 * @struct
 */
epiviz.ui.controls.DataTable.Column = function(id, name, type, isHidden, isFixed, defaultFilter) {
  this.id = id;
  this.name = name;
  this.type = type;
  this.isVisible = !(isHidden);
  this.isFixed = isFixed || false;
  this.defaultFilter = defaultFilter || '';
};

/**
 * @returns {string}
 */
epiviz.ui.controls.DataTable.Column.prototype.toString = function() { return this.name; };
