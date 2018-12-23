/**
 * Handlers for users
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const tokens = require('./tokens');

// Users handlers module
let users = {};

/**
 * @api {post} /user Create a new User
 * @apiName PostUser
 * @apiGroup User
 * 
 * @apiParam {string} email Email
 * @apiParam {string} firstName First Name
 * @apiParam {string} lastName Last Name
 * @apiParam {string} address Address
 * @apiParam {string} password Password
 * 
 * @apiError missingFields Missing required fields.
 * @apiError emailExists A user with that email already exists.
 * @apiError (Error 5xx) storeError Could not create the new user.
 * @apiError (Error 5xx) hashPasswordError Could not hash the user's password.
 * @apiError (Error 5xx) hashEmailError Could not hash the user's email.
 */
users.post = (data, callback) => {
    // Check that all required fields are filled out
    const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  
    if (email && firstName && lastName && address && password) {
      // Hash the email
      const hashedEmail = helpers.hash(email);
      if (hashedEmail) {
        // Make sure that the user doesn't already exist
        _data.read('users', hashedEmail, (err, data) => {
          if (err) {
            // Hash the password
            const hashedPassword = helpers.hash(password);
  
            // Create the user object
            if (hashedPassword) {
              const userObject = {
                'firstName': firstName,
                'lastName': lastName,
                'email': email,
                'address': address,
                'hashedPassword': hashedPassword,
              };
  
              // Store the user
              _data.create('users', hashedEmail, userObject, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { 'Error': 'Could not create the new user' });
                }
              });
            } else {
              callback(500, { 'Error': 'Could not hash the user\'s password' });
            }
          } else {
            // User already exists
            callback(400, { 'Error': 'A user with that email already exists' });
          }
        });
      } else {
        callback(500, { 'Error': 'Could not hash the user\'s email' });
      }
    } else {
      callback(400, { 'Error': 'Missing required fields.' })
    }
  };
  
  /**
   * @api {get} /user Retrieve a User
   * @apiName GetUser
   * @apiGroup User
   * 
   * @apiParam {string} email Email
   * 
   * @apiHeader {string} token Valid Token ID
   * 
   * @apiSuccess {string} firstName First name of the User
   * @apiSuccess {string} lastName Last name of the User
   * @apiSuccess {string} email Email of the User
   * @apiSuccess {string} address Address of the User
   * 
   * @apiError missingFields Missing required field.
   * @apiError missingToken Missing required token in header or token is invalid.
   * @apiError userNotFound User not found.
   * @apiError (Error 5xx) hashEmailError Could not hash the user's email.
   */
  users.get = (data, callback) => {
    // Check that the email is valid
    const email = helpers.isValidEmail(data.queryStringObject.email) ? data.queryStringObject.email.trim() : false;
    if (email) {
      // Get the token from the headers
      const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  
      // Verify that the given token is valid for the email
      tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          // Hash the email
          const hashedEmail = helpers.hash(email);
          if (hashedEmail) {
            // Lookup the user
            _data.read('users', hashedEmail, (err, data) => {
              if (!err && data) {
                // Remove the hashed password from the user object before returning it to the request
                delete (data.hashedPassword);
                callback(200, data);
              } else {
                callback(404, { 'Error': 'User not found' });
              }
            });
          } else {
            callback(500, { 'Error': 'Could not hash the user\'s email' });
          }
        } else {
          callback(403, { 'Error': 'Missing required token in header or token is invalid' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required field' });
    }
  };
  
  /**
   * @api {put} /user Update a User
   * @apiName PutUser
   * @apiGroup User
   * 
   * @apiParam {string} email Email
   * @apiParam {string} [firstName] First Name
   * @apiParam {string} [lastName] Last Name
   * @apiParam {string} [address] Address
   * @apiParam {string} [password] Password
   * 
   * @apiHeader {string} token Valid Token ID
   * 
   * @apiError missingFields Missing required fields.
   * @apiError missingFieldsToUpdate Missing fields to update.
   * @apiError missingToken Missing required token in header or token is invalid.
   * @apiError userNotFound The specified user does not exists.
   * @apiError (Error 5xx) userUpdateError Could not update the user.
   * @apiError (Error 5xx) hashEmailError Could not hash the user's email.
   */
  users.put = (data, callback) => {
    // Check for the required field
    const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  
    // Check for the optional fields
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  
    // Error if the email is invalid
    if (email) {
      // Error if nothing is sent to update
      if (firstName || lastName || password || address) {
        // Get the token from the headers
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the email
        tokens.verifyToken(token, email, (tokenIsValid) => {
          if (tokenIsValid) {
            // Hash the email
            const hashedEmail = helpers.hash(email);
            if (hashedEmail) {
              // Lookup the user
              _data.read('users', hashedEmail, (err, userData) => {
                if (!err && userData) {
                  // Update the fields necessary
                  if (firstName) {
                    userData.firstName = firstName;
                  }
  
                  if (lastName) {
                    userData.lastName = lastName;
                  }
  
                  if (address) {
                    userData.address = address;
                  }
  
                  if (password) {
                    userData.hashedPassword = helpers.hash(password);
                  }
  
                  // Store the new updates
                  _data.update('users', hashedEmail, userData, (err) => {
                    if (!err) {
                      callback(200);
                    } else {
                      console.log(err);
                      callback(500, { 'Error': 'Could not update the user' });
                    }
                  })
                } else {
                  callback(400, { 'Error': 'The specified user does not exists' });
                }
              });
            } else {
              callback(500, { 'Error': 'Could not hash the user\'s email' });
            }
          } else {
            callback(403, { 'Error': 'Missing required token in header or token is invalid' });
          }
        });
      } else {
        callback(400, { 'Error': 'Missing fields to update' });
      }
    } else {
      callback(400, { 'Error': 'Missing required fields' });
    }
  };
  
  /**
   * @api {delete} /user Delete a User
   * @apiName DeleteUser
   * @apiGroup User
   * 
   * @apiParam {string} email Email
   * 
   * @apiHeader {string} token Valid Token ID
   * 
   * @apiError missingFields Missing required field.
   * @apiError missingToken Missing required token in header or token is invalid.
   * @apiError userNotFound Could not find the specified user.
   * @apiError (Error 5xx) userDeleteError Could not delete the specified user.
   * @apiError (Error 5xx) hashEmailError Could not hash the user's email.
   */
  users.delete = (data, callback) => {
    // Check that the email is valid
    const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
    if (email) {
      // Get the token from the headers
      const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
      // Verify that the given token is valid for the email
      tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          // Hash the email
          const hashedEmail = helpers.hash(email);
          if (hashedEmail) {
            // Lookup the user
            _data.read('users', hashedEmail, (err, data) => {
              if (!err && data) {
                _data.delete('users', hashedEmail, (err, data) => {
                  if (!err) {
                    // @TODO: Delete user related data
                    callback(200);
                  } else {
                    callback(500, { 'Error': 'Could not delete the specified user' });
                  }
                });
              } else {
                callback(400, { 'Error': 'Could not find the specified user' });
              }
            });
          } else {
            callback(500, { 'Error': 'Could not hash the user\'s email' });
          }
        } else {
          callback(403, { 'Error': 'Missing required token in header or token is invalid' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing required field' });
    }
  };
  
  // Export the module
  module.exports = users;