/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 11/5/2014
 * Time: 9:58 AM
 */

jsdom = require('jsdom');
fs = require('fs');
$ = require('jquery')(jsdom.jsdom('<html><body></body></html>').parentWindow);

//require('./lib/closure/goog/bootstrap/nodejs');

/** @type {string} */
var csv = fs.readFileSync('./tree.csv', {encoding: 'utf8'});

/** @type {Array.<Array.<string>>} */
var rows = csv.split('\n').filter(function(row) { return row.trim() != ''; }).map(function(row) {
  return row.trim().split(',');
});

var root = {};
rows.forEach(
  /** @param {Array.<string>} row */
  function(row) {
    var node = root;
    for (var i = 2; i < row.length; ++i) {
      if (!(row[i] in node)) {
        node[row[i]] = {};
      }
      node = node[row[i]];
    }
    node[row[0]] = {};
});

var jsonTree = {name: rows[0][1], size: 1, children: []};

function buildTree(node, jsonNode) {
  for (var child in node) {
    if (!node.hasOwnProperty(child)) { continue; }
    var jsonChild = {name: child, size: 1, children: []};
    jsonNode.children.push(jsonChild);
    buildTree(node[child], jsonChild);
  }
}

function addTreeMetadata(node) {
  if (node.depth == undefined) { node.depth = 0; }
  node.id = generatePseudoGUID(6);
  node.nchildren = node.children.length;
  node.selectionType = 2; // LEAVES
  if (!node.children.length) {
    node.nleaves = 1;
    return;
  }

  var nleaves = 0;
  for (var i = 0; i < node.children.length; ++i) {
    node.children[i].depth = node.depth + 1;
    node.children[i].parentId = node.id;
    addTreeMetadata(node.children[i]);
    nleaves += node.children[i].nleaves;
  }
  node.nleaves = nleaves;
}

function generatePseudoGUID(size) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';

  for (var i = 0; i < size; ++i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }

  return result;
}

buildTree(root, jsonTree);
addTreeMetadata(jsonTree);

console.log(JSON.stringify(jsonTree));
