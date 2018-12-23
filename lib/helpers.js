/**
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

// Container for all the helpers
let helpers = {};

// Create a SHA256 hash
helpers.hash = (str) => {
    if (typeof (str) == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
    strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all the posible characters that could go in a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        let str = '';

        for (i = 1; i <= strLength; i++) {
            // Get random character from the possible characters
            let random = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

            // Append this character to the final string
            str += random;
        }

        // Return the final string
        return str;
    } else {
        return false;
    }
};

// Validate email address
helpers.isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/igm;
    if (email && typeof email == 'string') {
        if (email.trim().match(emailRegex)) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// Send an SMS message via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
    // Validate the parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false; 
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false; 

    if (phone && msg) {
        // Configure the request payload
        const payload = {
            'From': config.twilio.fromPhone,
            'To': `+1${phone}`,
            'Body': msg
        };

        // Stringify the payload
        const stringPayload = querystring.stringify(payload);
        // Configure the request details
        const requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            'auth': `${config.twilio.accountSid}:${config.twilio.authToken}`,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        const req = https.request(requestDetails, (res) => {
            // Grab the status of the sent request
            const status = res.statusCode;

            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback(`Status code returned was: ${status}`);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', (e) => {
            callback(e);
        });

        // Add the payload to the request
        req.write(stringPayload);
        // End the request
        req.end();
    } else {
        callback('Given parameters were missing or invalid', phone, msg);
    }
}

// Charge via Stripe
helpers.stripeCharge = (amount, callback) => {
    // Validate the parameters
    amount = typeof(amount) == 'number' && amount % 1 === 0 && amount > 0 ? amount : false; 

    if (amount) {
        // Configure the request payload. Amount is converted from dollars to cents
        const payload = {
            'amount': amount * 100,
            'currency': 'usd',
            'source': 'tok_mastercard'
        };

        // Stringify the payload
        const stringPayload = querystring.stringify(payload);
        // Configure the request details
        const requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.stripe.com',
            'method': 'POST',
            'path': '/v1/charges',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${config.stripe_key}`
            }
        };

        // Instantiate the request object
        const req = https.request(requestDetails, (res) => {
            // Grab the status of the sent request
            const status = res.statusCode;

            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback(`Status code returned was: ${status}`);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', (e) => {
            callback(e);
        });

        // Add the payload to the request
        req.write(stringPayload);
        // End the request
        req.end();
    } else {
        callback('Given parameters were missing or invalid', amount);
    }
}

// Send email via MailGun
helpers.sendMailGunEmail = (name, email, subject, text, callback) => {
    // Validate the parameters
    name = typeof(name) == 'string' && name.trim().length > 0 ? name.trim() : false;
    email = typeof(email) == 'string' && helpers.isValidEmail(email) ? email.trim() : false;
    subject = typeof(subject) == 'string' && subject.trim().length > 0 ? subject.trim() : false;
    text = typeof(text) == 'string' && text.trim().length > 0 ? text.trim() : false;

    if (name && email && subject && text) {
        // Configure the request payload
        const payload = {
            'from': `Pirple Delivery System <${config.mailgun.from_email}>`,
            'to': `${name} <${email}>`,
            'subject': subject,
            'text': text
        };

        // Stringify the payload
        const stringPayload = querystring.stringify(payload);
        // Configure the request details
        const requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.mailgun.net',
            'method': 'POST',
            'path': `/v3/sandboxa7d580c15f294f249c83e4ba2e4c190b.mailgun.org/messages`,
            'auth': `api:${config.mailgun.api_key}`,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        const req = https.request(requestDetails, (res) => {
            // Grab the status of the sent request
            const status = res.statusCode;

            // Callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback(`Status code returned was: ${status}`);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', (e) => {
            callback(e);
        });

        // Add the payload to the request
        req.write(stringPayload);
        // End the request
        req.end();
    } else {
        callback('Given parameters were missing or invalid', name, email, subject, text);
    }
}

// Export the module
module.exports = helpers;