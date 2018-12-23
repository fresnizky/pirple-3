/**
 * Handlers for cart
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const tokens = require('./tokens');

// Cart handler module
let cart = {};

/**
 * @api {post} /cart Create cart adding items to cart
 * @apiName PostCart
 * @apiGroup Cart
 * 
 * @apiParam {string} email Email
 * @apiParam  {array} items Array of item objects to add to the cart. They must include type and size. qty defaults to 1
 * 
 * @apiHeader {string} token Token ID
 * 
 * @apiSuccess {string} email User email
 * @apiSuccess {string} id Cart ID
 * @apiSuccess {array} items Item list, each with type, size, qty and subtotal
 * @apiSuccess {number} total Total amount of cart
 * 
 * @apiError missingFields Missing Required Fields.
 * @apiError missingToken Missing required token in header or token is invalid.
 * @apiError invalidItems Invalid items in item list.
 * @apiError (Error 5xx) storeError Could not save the cart.
 */
cart.post = (data, callback) => {
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const items = (data.payload.items && typeof data.payload.items == 'object' && data.payload.items instanceof Array && data.payload.items.length > 0) ? data.payload.items : false;

  // Check the required fields 
  if (email && items) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Create the cart object
        let cart = {
          'id': helpers.createRandomString(10),
          'email': email,
          'items': [],
          'total': 0
        };

        // Get the menu
        _data.read('', 'menu', (err, menuData) => {
          if (!err && menuData) {
            let invalidItems = [];
            // Validate each of the items
            items.forEach((item) => {
              if ((item.type && typeof item.type == 'string') && (item.size && typeof item.size == 'string')) {
                if (menuData.pizzas[item.type] && menuData.pizzas[item.type].price[item.size]) {
                  // Validate qty and calculate subtotal
                  let qty = (item.qty && typeof item.qty == 'number' && item.qty % 1 === 0 && item.qty >= 1) ? item.qty : 1;
                  let subtotal = qty * menuData.pizzas[item.type].price[item.size];
                  cart.items.push({
                    'type': item.type,
                    'size': item.size,
                    'qty': qty,
                    'subtotal': subtotal
                  });

                  // Add subtotal to cart total
                  cart.total += subtotal;
                } else {
                  invalidItems.push(item);  
                }
              } else {
                invalidItems.push(item);
              }
            });
            if (!invalidItems.length) {
              // Save the cart
              _data.create('cart', cart.id, cart, (err) => {
                if (!err) {
                  callback(200, cart);
                } else {
                  callback(500, { 'Error': 'Could not save the cart.' });
                }
              });
            } else {
              callback(403, { 
                'Error': 'Invalid items in item list',
                'invalidItems': invalidItems
              });
            }
          } else {
            callback(500, { 'Error': 'Could not load menu' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required Fields' });
  }
};

/**
 * @api {get} /cart Get items from cart
 * @apiName GetCart
 * @apiGroup Cart
 * 
 * @apiParam {string} email Email
 * @apiParam {string} id Cart ID
 * 
 * @apiHeader {string} token Token ID
 * 
 * @apiSuccess {string} email User email
 * @apiSuccess {string} id Cart ID
 * @apiSuccess {array} items Item list, each with type, size, qty and subtotal
 * @apiSuccess {number} total Total amount of cart
 * 
 * @apiError missingFields Missing Required Fields.
 * @apiError missingToken Missing required token in header or token is invalid.
 * @apiError invalidCart Could not find the specified cart.
 * @apiError invalidCartForUser Cart does not belong to the user.
 */
cart.get = (data, callback) => {
  // Check the required fields are valid
  const email = helpers.isValidEmail(data.queryStringObject.email) ? data.queryStringObject.email.trim() : false;
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;
  if (email && id) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Retrieve the cart
        _data.read('cart', id, (err, cartData) => {
          if (!err && cartData) {
            // Verify that the cart corresponds to the user
            if (email == cartData.email) {
              callback(200, cartData);
            } else {
              callback(401, { 'Error': 'Cart does not belong to the user' });
            }
          } else {
            callback(400, { 'Error': 'Could not find the specified cart' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required Fields' });
  }
};

/**
 * @api {put} /cart Modify items in cart. If item qty is 0 or less it's removed from the cart
 * @apiName PutCart
 * @apiGroup Cart
 * 
 * @apiParam {string} email Email
 * @apiParam {string} id Cart ID
 * @apiParam  {array} items Array of item objects to add or edit to the cart. They must include type and size. qty defaults to 1, and can be negative
 * 
 * @apiHeader {string} token Token ID
 * 
 * @apiSuccess {object} cart Cart object
 * @apiSuccess {string} cart.email User email
 * @apiSuccess {string} cart.id Cart ID
 * @apiSuccess {array} cart.items Item list, each with type, size, qty and subtotal
 * @apiSuccess {number} cart.total Total amount of cart
 * @apiSuccess {array} invalidObjects Invalid objects array
 * 
 * @apiError missingFields Missing Required Fields.
 * @apiError missingToken Missing required token in header or token is invalid.
 * @apiError cartNotFound Could not find the specified cart.
 * @apiError invalidUserForCart Cart does not belong to the user.
 * @apiError invalidItems Invalid items in item list.
 * @apiError (Error 5xx) storeError Could not save the cart.
 * @apiError (Error 5xx) menuError Could not load menu.
 * @apiError (Error 5xx) cartUpdateError Could not update cart.
 */
cart.put = (data, callback) => {
  // Check the required fields are valid
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 10 ? data.payload.id.trim() : false;
  const items = (data.payload.items && typeof data.payload.items == 'object' && data.payload.items instanceof Array && data.payload.items.length > 0) ? data.payload.items : false;

  if (email && id && items) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Retrieve the cart
        _data.read('cart', id, (err, cartData) => {
          if (!err && cartData) {
            // Verify that the cart corresponds to the user
            if (email == cartData.email) {
              // Get the menu
              _data.read('', 'menu', (err, menuData) => {
                if (!err && menuData) {
                  let invalidItems = [];
                  // Validate each of the items and qty
                  items.forEach((item) => {
                    if ((item.type && typeof item.type == 'string') && (item.size && typeof item.size == 'string') && (item.qty && typeof item.qty == 'number' && item.qty % 1 === 0)) {
                      // Check if item exist in cart
                      let cartItemIdx = cartData.items.findIndex((cartItem) => { 
                        return cartItem.type == item.type && cartItem.size == item.size;
                      });
                      if (cartItemIdx > -1) {
                        // Update cart qty for item
                        cartData.items[cartItemIdx].qty += item.qty;

                        // Remove item from cart if qty equals 0
                        if (cartData.items[cartItemIdx].qty == 0) {
                          cartData.items.splice(cartItemIdx, 1);
                        }
                       } else {
                        invalidItems.push(item);
                      }
                    } else {
                      invalidItems.push(item);
                    }
                  });
                  // Update if there are at least some valid items
                  if (!invalidItems || invalidItems.length < items.length) {
                    _data.update('cart', id, cartData, (err) => {
                      if (!err) {
                        callback(200, { 'cart': cartData, 'invalidItems': invalidItems });
                      } else {
                        callback(500, { 'Error': 'Could not update cart' });
                      }
                    })
                  } else {
                    callback(403, { 
                      'Error': 'Invalid items in item list',
                      'invalidItems': invalidItems
                    });
                  }
                } else {
                  callback(500, { 'Error': 'Could not load menu' });
                }
              });
            } else {
              callback(401, { 'Error': 'Cart does not belong to the user' });
            }
          } else {
            callback(400, { 'Error': 'Could not find the specified cart' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required Fields' });
  }
};

/**
 * @api {delete} /cart Delete cart
 * @apiName DeleteCart
 * @apiGroup Cart
 * 
 * @apiParam {string} email Email
 * @apiParam {string} id Cart ID
 * 
 * @apiHeader {string} token Token ID
 * 
 * @apiError missingFields Missing Required Fields.
 * @apiError missingToken Missing required token in header or token is invalid.
 * @apiError cartNotFound Could not find the specified cart.
 * @apiError invalidUserForCart Cart does not belong to the user.
 * @apiError (Error 5xx) cartDeleteError Could not delete cart.
 */
cart.delete = (data, callback) => {
  // Check the required fields are valid
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 10 ? data.payload.id.trim() : false;

  if (email && id && items) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Retrieve the cart
        _data.read('cart', id, (err, cartData) => {
          if (!err && cartData) {
            // Verify that the cart corresponds to the user
            if (email == cartData.email) {
              _data.delete('cart', id, (err) => {
                if (!err) { 
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Could not delete cart' });
                }
              });
            } else {
              callback(401, { 'Error': 'Cart does not belong to the user' });
            }
          } else {
            callback(400, { 'Error': 'Could not find the specified cart' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required Fields' });
  }
}

// Export the module
module.exports = cart;