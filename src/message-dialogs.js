/**
 * Created by: Florin Chelaru
 * Date: 5/30/13
 * Time: 10:31 PM
 */

function MessageDialogs() {
  this._messageDialog = $('#message-dialog');
  this._questionDialog = $('#question-dialog');
  this._errorDialog = $('#error-dialog');

  this._callbackYes = null;
  this._callbackNo = null;

  this._messageDialog.dialog({
    autoOpen: false,
    width: '230',
    buttons: {
      "Ok": function() {
        $(this).dialog("close");
      }
    },
    resizable: false,
    modal:true
  });

  this._errorDialog.dialog({
    autoOpen: false,
    width: '230',
    buttons: {
      "Ok": function() {
        $(this).dialog("close");
      }
    },
    resizable: false,
    modal:true
  });

  var self = this;
  this._questionDialog.dialog({
    autoOpen: false,
    width: '230',
    buttons: {
      "Yes": function() {
        if (self._callbackYes && self._callbackYes()) {
          self._callbackYes = null;
          self._callbackNo = null;
          $(this).dialog("close");
        }
      },
      "No": function() {
        if (self._callbackNo && self._callbackNo()) {
          self._callbackYes = null;
          self._callbackNo = null;
          $(this).dialog("close");
        }
      }
    },
    resizable: false,
    modal:true
  });
}

$(function() {
  MessageDialogs.instance = new MessageDialogs();
});

MessageDialogs.prototype.info = function(message) {
  var messageContainer = this._messageDialog.find('.dialog-text');
  messageContainer.empty();
  messageContainer.append(message);

  this._messageDialog.dialog('open');
};

MessageDialogs.prototype.error = function(message) {
  var messageContainer = this._errorDialog.find('.dialog-text');
  messageContainer.empty();
  messageContainer.append(message);

  this._errorDialog.dialog('open');
};

MessageDialogs.prototype.question = function(message, callbackYes, callbackNo) {
  var messageContainer = this._questionDialog.find('.dialog-text');
  messageContainer.empty();
  messageContainer.append(message);

  this._callbackYes = callbackYes;
  this._callbackNo = callbackNo;

  this._questionDialog.dialog('open');
};
