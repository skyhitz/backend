'use strict';

var cryptox = require('crypto');
var base58 = require('bs58');
/**
 * Passwordless is a node.js module for express that allows authentication and
 * authorization without passwords but simply by sending tokens via email or
 * other means. It utilizes a very similar mechanism as many sites use for
 * resetting passwords. The module was inspired by Justin Balthrop's article
 * "Passwords are Obsolete"
 * @constructor
 */
class Passwordless {
  _tokenStore = undefined;
  _userProperty = undefined;
  _deliveryMethods = {};
  _defaultDelivery = undefined;
  _allowTokenReuse = undefined;
  _skipForceSessionSave = undefined;
  init(tokenStore, options?) {
    options = options || {};
    if (!tokenStore) {
      throw new Error('tokenStore has to be provided');
    }

    this._tokenStore = tokenStore;
    this._userProperty = options.userProperty ? options.userProperty : 'user';
    this._allowTokenReuse = options.allowTokenReuse;
    this._skipForceSessionSave = options.skipForceSessionSave ? true : false;
  }
  _generateToken(randomBytes?) {
    randomBytes = randomBytes || 16;
    return function () {
      var buf = cryptox.randomBytes(randomBytes);
      return base58.encode(buf);
    };
  }
}

export default new Passwordless();
