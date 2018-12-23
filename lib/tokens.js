/**
 * Handlers for tokens
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Tokens handler module
let tokens = {};

/**
 * @api {post} /tokens Login user and get an auth token
 * @apiName PostTokens
 * @apiGroup Tokens
 * 
 * @apiParam {string} email Email
 * @apiParam {string} password Password
 * 
 * @apiSuccess {string} email User email
 * @apiSuccess {string} id Token
 * @apiSuccess {number} expires Timestamp of the expiration date of the token
 * 
 * @apiError missingFields Missing Required Fields.
 * @apiError userNotFound Could not find the specified user.
 * @apiError passwordError Password did not match the specified user stored password.
 * @apiError (Error 5xx) storeError Could not create the new token.
 */
tokens.post = (data, callback) => {
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    const hashedEmail = helpers.hash(email);

    // Lookup the user who matches that phone number
    _data.read('users', hashedEmail, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid create a new token with a random name, set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + (1000 * 60 * 60);
          const tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create the new token' });
            }
          });
        } else {
          callback(401, { 'Error': 'Password did not match the specified user stored password' });
        }
      } else {
        callback(400, { 'Error': 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required Fields' });
  }
};

/**
 * @api {get} /tokens Get Token data for Token ID
 * @apiName GetTokens
 * @apiGroup Tokens
 * 
 * @apiParam {string} id Token ID
 * 
 * @apiSuccess {string} email User email
 * @apiSuccess {string} id Token ID
 * @apiSuccess {number} expires Timestamp of the expiration date of the token
 * 
 * @apiError missingFields Missing required field.
 * @apiError userNotFound User not found.
 */
tokens.get = (data, callback) => {
  // Check that the id is valid
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { 'Error': 'User not found' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

/**
 * @api {put} /tokens Extends the expiration time of the Token
 * @apiName PutTokens
 * @apiGroup Tokens
 * 
 * @apiParam {string} id Token ID
 * @apiParam {boolean} expires Boolean flag
 * 
 * @apiError missingFields Missing Required fields or fields are invalid.
 * @apiError tokenNotFound The specified token does not exist.
 * @apiError tokenExpired The token has already expired and cannot be extended.
 * @apiError (Error 5xx) updateError Could not update the token expiration.
 */
tokens.put = (data, callback) => {
  const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  const extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to make sure the token isn't expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now.
          tokenData.expires = Date.now() + (1000 * 60 * 60);

          // Store the new updates
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not update the token expiration' });
            }
          });
        } else {
          callback(400, { 'Error': 'The token has already expired and cannot be extended' });
        }
      } else {
        callback(400, { 'Error': 'The specified token does not exist' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required fields or fields are invalid' });
  }
};

/**
 * @api {delete} /tokens Delete token, logging out user.
 * @apiName DeleteTokens
 * @apiGroup Tokens
 * 
 * @apiParam {string} id Token ID
 * @apiParam {boolean} expires Boolean flag
 * 
 * @apiError missingFields Missing required field.
 * @apiError tokenNotFound Could not find the specified token.
 * @apiError (Error 5xx) deleteError Could not delete the specified token.
 */
tokens.delete = (data, callback) => {
  // Check that the id number is valid
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete('tokens', id, (err, data) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the specified token' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not find the specified token' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Verify if a given token id is currently valid for a specified user
tokens.verifyToken = (id, email, callback) => {
  // Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check if the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Export the module
module.exports = tokens;