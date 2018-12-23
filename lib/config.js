/**
 * Create and export configuration variables
 * 
 */

// Container for all the environments
let environments = {};

// Staging environment (default)
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsSecret',
    'stripe_key': 'sk_test_7nkUHJDgfHf0vPyayd72mwO9',
    'mailgun': {
        'from_email': 'postmaster@sandboxa7d580c15f294f249c83e4ba2e4c190b.mailgun.org',
        'api_key': '963b1ffda576da8ae81d7ba96f1efad1-52cbfb43-910f841b',
    },
    'templateGlobals': {
        'appName': 'Uptime checker',
        'companyName': 'NotARealCompany',
        'yearCreated': '2019',
        'baseUrl': 'http://localhost:3000/'
    }
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret',
    'stripe_key': 'sk_test_7nkUHJDgfHf0vPyayd72mwO9',
    'mailgun': {
        'from_email': 'postmaster@sandboxa7d580c15f294f249c83e4ba2e4c190b.mailgun.org',
        'api_key': '963b1ffda576da8ae81d7ba96f1efad1-52cbfb43-910f841b',
    },
    'templateGlobals': {
        'appName': 'Uptime checker',
        'companyName': 'NotARealCompany',
        'yearCreated': '2019',
        'baseUrl': 'http://localhost:3000/'
    }
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV)  == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments['staging'];

// Export the module
module.exports = environmentToExport;