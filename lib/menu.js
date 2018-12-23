/**
 * Handlers for menu
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const tokens = require('./tokens');

// Menu handler module
let menu = {};

/**
 * @api {get} /menu Get menu items
 * @apiName GetMenu
 * @apiGroup Menu
 * 
 * @apiHeader {string} token Valid Token ID
 * 
 * @apiSuccess {array} pizzas Pizza list
 * 
 * @apiError missingFields Missing required field.
 * @apiError missingToken Missing required token in header or token is invalid.
 * @apiError (Error 5xx) menuError Could not load menu.
 */
menu.get = (data, callback) => {
  // Check that the email is valid
  const email = helpers.isValidEmail(data.queryStringObject.email) ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Get the menu
        _data.read('', 'menu', (err, menuData) => {
          if (!err && menuData) {
            callback(200, menuData);
          } else {
            callback(500, { 'Error': 'Could not load menu' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Export the module
module.exports = menu;