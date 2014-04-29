/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 2/15/14
 * Time: 5:01 PM
 */

goog.provide('epiviz.workspaces.UserManager');

/**
 * @param {epiviz.Config} config
 * @constructor
 */
epiviz.workspaces.UserManager = function(config) {
  /**
   * @type {epiviz.Config}
   * @private
   */
  this._config = config;
};

/**
 * @type {{loggedIn: boolean, name: ?string, oauthProvider: ?string}}
 */
epiviz.workspaces.UserManager.USER_STATUS = epiviz.workspaces.UserManager.USER_STATUS || {
  loggedIn: false,
  userData: null,
  oauthProvider: null
};

/**
 * Logs in if there is no user logged in or logs out the current user
 */
epiviz.workspaces.UserManager.prototype.toggleLogin = function() {
  if (!epiviz.workspaces.UserManager.USER_STATUS.loggedIn) {
    this._login();
  } else {
    this._logout();
  }
};

/**
 * Redirects to the login screen
 * @private
 */
epiviz.workspaces.UserManager.prototype._login = function() {
  var location = window.location.toString();
  if (location.length > 0) {
    location = encodeURIComponent(location);
  }

  var pathname = this._config.dataServerLocation + 'login.php';
  window.location = pathname + '?location=' + location;
};

/**
 * Logout
 * @private
 */
epiviz.workspaces.UserManager.prototype._logout = function() {
  var location = window.location.toString(); // window.location.search;
  if (location.length > 0) {
    // location = encodeURIComponent(location.substr(1));
    location = encodeURIComponent(location);
  }
  window.location = this._config.dataServerLocation + 'logout.php?logout&location=' + location;
};
