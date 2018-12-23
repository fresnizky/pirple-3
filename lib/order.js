/**
 * Handlers for order
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const tokens = require('./tokens');

// Order handler module
let order = {};

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
 * @apiError cartNotFound Could not find the specified cart.
 * @apiError cartUserError Cart does not belong to the user.
 * @apiError userNotFound User not found.
 * @apiError paymentError There was an error processing the payment.
 * @apiError emailError There was an error sending confirmation email.
 * @apiError (Error 5xx) hashError Could not hash the user\'s email.
 */
cart.post = (data, callback) => {
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const cartId = typeof (data.payload.cartId) == 'string' && data.payload.cartId.trim().length == 10 ? data.cartId.id.trim() : false;

  if (email && cartId) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Retrieve the cart
        _data.read('cart', cartId, (err, cartData) => {
          if (!err && cartData) {
            // Verify that the cart corresponds to the user
            if (email == cartData.email) {
              // Hash the user email
              const hashedEmail = helpers.hash(email);
              if (hashedEmail) {
                // Retrieve user data
                _data.read('users', hashedEmail, (err, userData) => {
                  if (!err && userData) {
                    // Try to pay using stripe
                    helpers.stripeCharge(cartData.total, (err) => {
                      if (!err) {
                        // Send email using MailGun
                        helpers.sendMailGunEmail(`${userData.firstName} ${userData.lastName}`, email, `Order ${cartId} ready`, 'Your order is ready.', (err) => {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(400, { 'Error': 'There was an error sending confirmation email' });
                          }
                        });
                      } else {
                        callback(400, { 'Error': 'There was an error processing the payment' });
                      }
                    });
                  } else {
                    callback(404, { 'Error': 'User not found' });
                  }
                });
              } else {
                callback(500, { 'Error': 'Could not hash the user\'s email' });
              }
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