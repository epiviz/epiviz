/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 3/2/13
 * Time: 11:35 AM
 * To change this template use File | Settings | File Templates.
 */

/*
 * A helper static class used for multiple inheritance
 */
function Inheritance() {

}

Inheritance.add = function(subclass, superclass) {
  for (var method in superclass.prototype) {
    subclass.prototype[method] = superclass.prototype[method];
  }
};
