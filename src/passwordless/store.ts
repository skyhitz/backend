const bcrypt = require('bcrypt');

import { passwordlessIndex } from '../algolia/algolia';

/**
 * Constructor of TokenStore
 * prefix used for the TokenStore entries in the algolia database (default: 'pwdless:')
 * @constructor
 */
export class TokenStore {
  _database = 0;

  /**
   * Checks if the provided token / user id combination exists and is
   * valid in terms of time-to-live. If yes, the method provides the
   * the stored referrer URL if any.
   * @param  {String}   token to be authenticated
   * @param  {String}   uid Unique identifier of a user
   * @param  {Function} callback in the format (error, valid, referrer).
   * In case of error, error will provide details, valid will be false and
   * referrer will be null. If the token / uid combination was not found
   * found, valid will be false and all else null. Otherwise, valid will
   * be true, referrer will (if provided when the token was stored) the
   * original URL requested and error will be null.
   */
  async authenticate(token, uid, callback) {
    if (!token || !uid || !callback) {
      throw new Error('TokenStore:authenticate called with invalid parameters');
    }

    let obj: any = await passwordlessIndex.getObject(uid);
    if (!obj) {
      return callback(null, false, null);
    }
    if (Date.now() > obj.ttl) {
      return callback(null, false, null);
    }

    bcrypt.compare(token, obj.token, function (err, res) {
      if (err) {
        callback(err, false, null);
      } else if (res) {
        callback(null, true, obj.origin);
      } else {
        callback(null, false, null);
      }
    });
  }

  /**
   * Stores a new token / user ID combination or updates the token of an
   * existing user ID if that ID already exists. Hence, a user can only
   * have one valid token at a time
   * @param  {String}   token Token that allows authentication of _uid_
   * @param  {String}   uid Unique identifier of an user
   * @param  {Number}   msToLive Validity of the token in ms
   * @param  {String}   originUrl Originally requested URL or null
   * @param  {Function} callback Called with callback(error) in case of an
   * error or as callback() if the token was successully stored / updated
   */
  async storeOrUpdate(token, uid, msToLive, originUrl, callback) {
    if (!token || !uid || !msToLive || !callback || !isNumber(msToLive)) {
      throw new Error(
        'TokenStore:storeOrUpdate called with invalid parameters'
      );
    }

    bcrypt.hash(token, 10, async function (err, hashedToken) {
      if (err) {
        return callback(err);
      }

      originUrl = originUrl || '';
      try {
        await passwordlessIndex.saveObject({
          objectID: uid,
          token: hashedToken,
          origin: originUrl,
          ttl: Date.now() + msToLive,
        });
        callback();
      } catch (e) {
        callback(err);
      }
    });
  }

  /**
   * Invalidates and removes a user and the linked token
   * @param  {String}   user ID
   * @param  {Function} callback called with callback(error) in case of an
   * error or as callback() if the uid was successully invalidated
   */
  async invalidateUser(uid, callback) {
    if (!uid || !callback) {
      throw new Error(
        'TokenStore:invalidateUser called with invalid parameters'
      );
    }

    try {
      await passwordlessIndex.deleteObject(uid);

      callback();
    } catch (e) {
      callback(e);
    }
  }
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
