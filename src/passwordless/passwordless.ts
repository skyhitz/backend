'use strict';

var url = require('url');
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

  _redirectWithSessionSave(req, res, next, target) {
    if (!req.session || this._skipForceSessionSave) {
      return res.redirect(target);
    } else {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        } else {
          res.redirect(target);
        }
      });
    }
  }

  acceptToken(options?) {
    var self = this;
    options = options || {};
    return function (req, res, next) {
      if (!self._tokenStore) {
        throw new Error(
          'Passwordless is missing a TokenStore. Are you sure you called passwordless.init()?'
        );
      }

      var tokenField = options.tokenField ? options.tokenField : 'token';
      var uidField = options.uidField ? options.uidField : 'uid';

      var token = req.query[tokenField],
        uid = req.query[uidField];
      if (!token && !uid && options.allowPost) {
        if (!req.body) {
          throw new Error(
            'req.body does not exist: did you require middleware to accept POST data (such as body-parser) before calling acceptToken?'
          );
        } else if (req.body[tokenField] && req.body[uidField]) {
          token = req.body[tokenField];
          uid = req.body[uidField];
        }
      }

      if ((options.failureFlash || options.successFlash) && !req.flash) {
        throw new Error(
          'To use failureFlash, flash middleware is required such as connect-flash'
        );
      }

      if (token && uid) {
        self._tokenStore.authenticate(
          token,
          uid.toString(),
          function (error, valid, referrer) {
            if (valid) {
              var success = function () {
                req[self._userProperty] = uid;
                if (req.session) {
                  req.session.passwordless = req[self._userProperty];
                }
                if (options.successFlash) {
                  req.flash('passwordless-success', options.successFlash);
                }
                if (options.enableOriginRedirect && referrer) {
                  // next() will not be called
                  return self._redirectWithSessionSave(
                    req,
                    res,
                    next,
                    referrer
                  );
                }
                if (options.successRedirect) {
                  // next() will not be called, and
                  // enableOriginRedirect has priority
                  return self._redirectWithSessionSave(
                    req,
                    res,
                    next,
                    options.successRedirect
                  );
                }
                next();
              };

              // Invalidate token, except allowTokenReuse has been set
              if (!self._allowTokenReuse) {
                self._tokenStore.invalidateUser(uid, function (err) {
                  if (err) {
                    next('TokenStore.invalidateUser() error: ' + error);
                  } else {
                    success();
                  }
                });
              } else {
                success();
              }
            } else if (error) {
              next('TokenStore.authenticate() error: ' + error);
            } else if (options.failureFlash) {
              req.flash('passwordless', options.failureFlash);
              next();
            } else {
              next();
            }
          }
        );
      } else {
        next();
      }
    };
  }

  restricted(options) {
    var self = this;
    return function (req, res, next) {
      if (req[self._userProperty]) {
        return next();
      }

      // not authorized
      options = options || {};
      if (options.failureRedirect) {
        var queryParam = '';
        if (options.originField) {
          var parsedRedirectUrl = url.parse(options.failureRedirect),
            queryParam = '?';
          if (parsedRedirectUrl.query) {
            queryParam = '&';
          }
          queryParam +=
            options.originField + '=' + encodeURIComponent(req.originalUrl);
        }

        if (options.failureFlash) {
          if (!req.flash) {
            throw new Error(
              'To use failureFlash, flash middleware is requied such as connect-flash'
            );
          } else {
            req.flash('passwordless', options.failureFlash);
          }
        }

        self._redirectWithSessionSave(
          req,
          res,
          next,
          options.failureRedirect + queryParam
        );
      } else if (options.failureFlash) {
        throw new Error('failureFlash cannot be used without failureRedirect');
      } else if (options.originField) {
        throw new Error('originField cannot be used without failureRedirect');
      } else {
        self._send401(res, 'Provide a token');
      }
    };
  }

  logout(options) {
    var self = this;
    return function (req, res, next) {
      if (req.session && req.session.passwordless) {
        delete req.session.passwordless;
      }
      if (req[self._userProperty]) {
        self._tokenStore.invalidateUser(req[self._userProperty], function () {
          delete req[self._userProperty];
          if (options && options.successFlash) {
            if (!req.flash) {
              return next(
                'To use successFlash, flash middleware is requied such as connect-flash'
              );
            } else {
              req.flash('passwordless-success', options.successFlash);
            }
          }
          next();
        });
      } else {
        next();
      }
    };
  }

  _generateNumberToken(max) {
    var buf = cryptox.randomBytes(4);
    return Math.floor(buf.readUInt32BE(0) % max).toString();
  }

  sessionSupport() {
    var self = this;
    return function (req, res, next) {
      if (!req.session) {
        throw new Error(
          'sessionSupport requires session middleware such as expressSession'
        );
      } else if (req.session.passwordless) {
        req[self._userProperty] = req.session.passwordless;
      }
      next();
    };
  }

  requestToken(getUserID, options) {
    var self = this;
    options = options || {};

    return function (req, res, next) {
      var sendError = function (statusCode, authenticate?) {
        if (options.failureRedirect) {
          if (options.failureFlash) {
            req.flash('passwordless', options.failureFlash);
          }
          self._redirectWithSessionSave(
            req,
            res,
            next,
            options.failureRedirect
          );
        } else {
          if (statusCode === 401) {
            self._send401(res, authenticate);
          } else {
            res.status(statusCode).send();
          }
        }
      };

      if (!self._tokenStore) {
        throw new Error(
          'Passwordless is missing a TokenStore. Are you sure you called passwordless.init()?'
        );
      }

      if (!req.body && !options.allowGet) {
        throw new Error(
          'req.body does not exist: did you require middleware to accept POST data (such as body-parser) before calling acceptToken?'
        );
      } else if (
        !self._defaultDelivery &&
        Object.keys(self._deliveryMethods).length === 0
      ) {
        throw new Error(
          'passwordless requires at least one delivery method which can be added using passwordless.addDelivery()'
        );
      } else if ((options.successFlash || options.failureFlash) && !req.flash) {
        throw new Error(
          'To use failureFlash or successFlash, flash middleware is required such as connect-flash'
        );
      } else if (options.failureFlash && !options.failureRedirect) {
        throw new Error('failureFlash cannot be used without failureRedirect');
      }

      var userField = options.userField ? options.userField : 'user';
      var deliveryField = options.deliveryField
        ? options.deliveryField
        : 'delivery';
      var originField = options.originField ? options.originField : null;

      var user, delivery, origin;
      if (req.body && req.method === 'POST') {
        user = req.body[userField];
        delivery = req.body[deliveryField];
        if (originField) {
          origin = req.body[originField];
        }
      } else if (options.allowGet && req.method === 'GET') {
        user = req.query[userField];
        delivery = req.query[deliveryField];
        if (originField) {
          origin = req.query[originField];
        }
      }

      var deliveryMethod = self._defaultDelivery;
      if (delivery && self._deliveryMethods[delivery]) {
        deliveryMethod = self._deliveryMethods[delivery];
      }

      if (typeof user === 'string' && user.length === 0) {
        return sendError(401, 'Provide a valid user');
      } else if (!deliveryMethod || !user) {
        return sendError(400);
      }

      getUserID(
        user,
        delivery,
        function (uidError, uid) {
          if (uidError) {
            next(
              new Error('Error on the user verification layer: ' + uidError)
            );
          } else if (uid) {
            var token;
            try {
              if (
                deliveryMethod.options.numberToken &&
                deliveryMethod.options.numberToken.max
              ) {
                token = self._generateNumberToken(
                  deliveryMethod.options.numberToken.max
                );
              } else {
                token = (
                  deliveryMethod.options.tokenAlgorithm || this._generateToken()
                )();
              }
            } catch (err) {
              next(new Error('Error while generating a token: ' + err));
            }
            var ttl = deliveryMethod.options.ttl || 60 * 60 * 1000;

            self._tokenStore.storeOrUpdate(
              token,
              uid.toString(),
              ttl,
              origin,
              function (storeError) {
                if (storeError) {
                  next(new Error('Error on the storage layer: ' + storeError));
                } else {
                  deliveryMethod.sendToken(
                    token,
                    uid,
                    user,
                    function (deliveryError) {
                      if (deliveryError) {
                        next(
                          new Error(
                            'Error on the deliveryMethod delivery layer: ' +
                              deliveryError
                          )
                        );
                      } else {
                        if (!req.passwordless) {
                          req.passwordless = {};
                        }
                        req.passwordless.uidToAuth = uid;
                        if (options.successFlash) {
                          req.flash(
                            'passwordless-success',
                            options.successFlash
                          );
                        }
                        next();
                      }
                    },
                    req
                  );
                }
              }
            );
          } else {
            sendError(401, 'Provide a valid user');
          }
        },
        req
      );
    };
  }

  addDelivery(name, sendToken?, options?) {
    // So that add can be called with (sendToken [, options])
    var defaultUsage = false;
    if (typeof name === 'function') {
      options = sendToken;
      sendToken = name;
      name = undefined;
      defaultUsage = true;
    }
    options = options || {};

    if (
      typeof sendToken !== 'function' ||
      typeof options !== 'object' ||
      (name && typeof name !== 'string')
    ) {
      throw new Error('Passwordless.addDelivery called with wrong parameters');
    } else if (
      (options.ttl && typeof options.ttl !== 'number') ||
      (options.tokenAlgorithm &&
        typeof options.tokenAlgorithm !== 'function') ||
      (options.numberToken &&
        (!options.numberToken.max ||
          typeof options.numberToken.max !== 'number'))
    ) {
      throw new Error('One of the provided options is of the wrong format');
    } else if (options.tokenAlgorithm && options.numberToken) {
      throw new Error(
        'options.tokenAlgorithm cannot be used together with options.numberToken'
      );
    } else if (this._defaultDelivery) {
      throw new Error(
        'Only one default delivery method shall be defined and not be mixed up with named methods. Use named delivery methods instead'
      );
    } else if (defaultUsage && Object.keys(this._deliveryMethods).length > 0) {
      throw new Error(
        'Default delivery methods and named delivery methods shall not be mixed up'
      );
    }

    var method = {
      sendToken: sendToken,
      options: options,
    };
    if (defaultUsage) {
      this._defaultDelivery = method;
    } else {
      if (this._deliveryMethods[name]) {
        throw new Error(
          'Only one named delivery method with the same name shall be added'
        );
      } else {
        this._deliveryMethods[name] = method;
      }
    }
  }

  _send401(res, authenticate) {
    res.statusCode = 401;
    if (authenticate) {
      res.setHeader('WWW-Authenticate', authenticate);
    }
    res.end('Unauthorized');
  }

  _generateToken(randomBytes) {
    randomBytes = randomBytes || 16;
    return function () {
      var buf = cryptox.randomBytes(randomBytes);
      return base58.encode(buf);
    };
  }
}

export default new Passwordless();
