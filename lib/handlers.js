/**
 * Request handlers
 */

// Dependencies
const users = require('./users');
const tokens = require('./tokens');
const menu = require('./menu');
const cart = require('./cart');
const order = require('./order');

// Define all the handlers
let handlers = {};

// Users handler
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = users;

// Tokens handler
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = tokens;

// Menu handler
handlers.menu = (data, callback) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the menu methods
handlers._menu = menu;

// Cart handler
handlers.cart = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._cart[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the cart methods
handlers._cart = cart;

// Order handler
handlers.order = (data, callback) => {
  const acceptableMethods = ['post', 'get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._order[data.method](data, callback);
  } else {
    callback(405);
  }
}; 

// Container for all the cart methods
handlers._order = order;


// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Export the module
module.exports = handlers;