/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/8/14
 * Time: 1:08 PM
 */

goog.provide('epiviztest.TestManager');

/**
 * @param {Array.<epiviztest.TestSuite>} testSuites
 * @constructor
 */
epiviztest.TestManager = function(testSuites) {
  /**
   * @type {Array.<epiviztest.TestSuite>}
   * @private
   */
  this._testSuites = testSuites;
};

epiviztest.TestManager.prototype.initialize = function() {
  var testAccordion = $('#test-accordion');
  testAccordion.multiAccordion();
  testAccordion.multiAccordion('option', 'active', 'all');

  var testContainer = $('#test-container');

  testContainer.append(
    '<table id="test-results-table" style="width: 100%; max-width: 800px;"><thead><tr>' +
      '<th></th>' +
      '<th>Test Suite</th>' +
      '<th>Test Case</th>' +
      '<td><button id="test-run-all-button">Run all</button></td>' +
      '<th>Results</th>' +
      '<th>Running time</th>' +
    '</tr></thead></table>');
  var testResultsTable = $('#test-results-table');
  var runAllButton = $('#test-run-all-button');

  var self = this;
  for (var i = 0; i < this._testSuites.length; ++i) {
    var testCases = this._testSuites[i].getTestCases();
    for (var j = 0; j < testCases.length; ++j) {
      testResultsTable.append(sprintf('' +
        '<tr id="test-row-%s-%s">' +
          '<td class="test-icon-cell"></td>' +
          '<td class="test-suite-cell">%s</td>' +
          '<td class="test-case-cell">%s</td>' +
          '<td><button class="test-run-button">Run</button></td>' +
          '<td class="test-result-cell"></td>' +
          '<td class="test-run-time-cell"></td>' +
        '</tr>', this._testSuites[i].id(), testCases[j], this._testSuites[i].name(), testCases[j]));

      var runButton = $(sprintf('#test-row-%s-%s', this._testSuites[i].id(), testCases[j]))
        .find('.test-run-button');
      (function(testSuite, testCase) {
        runButton.button().click(function() {
          self._disableAllRunButtons();
          self._runTestCase(testSuite, testCase, function() {
            self._enableAllRunButtons();
          });
        });
      })(this._testSuites[i], testCases[j]);
    }
  }

  runAllButton.button().click(function() {
    self._runAllTestCases(function() {});
  });
};

/**
 * @param {epiviztest.TestSuite} testSuite
 * @param {string} testCase
 * @param {function} finishCallback
 * @private
 */
epiviztest.TestManager.prototype._runTestCase = function(testSuite, testCase, finishCallback) {
  var testRow = $(sprintf('#test-row-%s-%s', testSuite.id(), testCase));
  var testResultCell = testRow.find('.test-result-cell');
  var testRunTimeCell = testRow.find('.test-run-time-cell');
  var testIconCell = testRow.find('.test-icon-cell');

  testResultCell.empty();

  testRunTimeCell.empty();
  testRunTimeCell.append('Running...');

  var start = new Date().getTime();
  testSuite.runTestCase(testCase, testResultCell, function(result) {
    var end = new Date().getTime();
    var time = end - start;

    testRunTimeCell.empty();
    testRunTimeCell.append(sprintf('%sms', Globalize.format(time, 'n0')));

    testIconCell.empty();
    testIconCell.append(result ?
      '<span style="color: #3a983f;">PASSED</span>' :
      '<span style="color: #ab3637">FAILED</span>');

    result['testSuite'] = testSuite.name();
    result['testCase'] = testCase;

    if (finishCallback) { finishCallback(result); }
  });
};

/**
 * @param {function} [finishCallback]
 * @private
 */
epiviztest.TestManager.prototype._runAllTestCases = function(finishCallback) {

  if (!this._testSuites || !this._testSuites.length) { return; }

  var self = this;

  this._disableAllRunButtons();

  var nResults = 0;
  var allResults = {};

  // Run one test at a time
  var i = 0, j = -1;
  var testCases = this._testSuites[i].getTestCases();
  var iteration = function() {
    ++j;
    if (j >= testCases.length) {
      ++i; j = 0;
      if (i >= self._testSuites.length) {

        // Build CSV file
        var csvContent = '';
        var colname;

        // Header
        for (colname in allResults) {
          if (!allResults.hasOwnProperty(colname)) { continue; }
          csvContent += colname + ',';
        }
        csvContent += '\n';

        for (var r = 0; r < nResults; ++r) {
          for (var k = 0; ; ++k) {
            var hadData = false;
            for (colname in allResults) {
              if (!allResults.hasOwnProperty(colname)) { continue; }
              var content = '';
              var result = allResults[colname][r];
              if (result != undefined) {
                if (Array.isArray(result)) {
                  if (result.length > k) {
                    content = result[k];
                    hadData = true;
                  }
                } else {
                  content = result;
                }
              }
              csvContent += content + ',';
            }
            csvContent += '\n';
            if (!hadData) { break; }
          }
        }
        saveAs(
          new Blob([csvContent], {type: "text/plain;charset=" + window.document['characterSet']}),
          'test_results.csv'
        );

        self._enableAllRunButtons();
        if (finishCallback) { finishCallback(); }
        return;
      }
      testCases = self._testSuites[i].getTestCases();
    }

    self._runTestCase(self._testSuites[i], testCases[j], function(result) {
      for (var colname in result) {
        if (!result.hasOwnProperty(colname)) { continue; }
        if (!allResults[colname]) {
          allResults[colname] = new Array(nResults);
        }
        allResults[colname].push(result[colname]);
      }
      ++nResults;
      iteration();
    });
  };

  iteration();
};

epiviztest.TestManager.prototype._disableAllRunButtons = function() {
  // Disable run buttons
  $('#test-run-all-button').button('disable');
  for (var i = 0; i < this._testSuites.length; ++i) {
    var testCases = this._testSuites[i].getTestCases();
    for (var j = 0; j < testCases.length; ++j) {
      var runButton = $(sprintf('#test-row-%s-%s', this._testSuites[i].id(), testCases[j]))
        .find('.test-run-button');
      runButton.button('disable');
    }
  }
};

epiviztest.TestManager.prototype._enableAllRunButtons = function() {
  // Enable run buttons
  $('#test-run-all-button').button('enable');
  for (var i = 0; i < this._testSuites.length; ++i) {
    var testCases = this._testSuites[i].getTestCases();
    for (var j = 0; j < testCases.length; ++j) {
      var runButton = $(sprintf('#test-row-%s-%s', this._testSuites[i].id(), testCases[j]))
        .find('.test-run-button');
      runButton.button('enable');
    }
  }
};
