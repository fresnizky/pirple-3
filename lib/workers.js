/**
 * Worker related tasks
 */

// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');
const util = require('util');
const debug = util.debuglog('workers');

// Instantiate the workers object
let workers = {};

// Timer to execute the worker process one per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

// Rotate (compress) the log files
workers.rotateLogs = () => {
    // List all the (non compressed) log files
    _logs.list(false, (err, logs) => {
        if (!err && logs && logs.length) {
            logs.forEach((logName) => {
                // Compress the data to a different file
                const logId = logName.replace('.log', '');
                const newFileId = `${logId}-${Date.now()}`;
                _logs.compress(logId, newFileId, (err) => {
                    if (!err) {
                        // Truncate the log
                        _logs.truncate(logId, (err) => {
                            if (!err) {
                                debug("Success truncating logfile");
                            } else {
                                debug("Error truncating log file");
                            }
                        });
                    } else {
                        debug("Error compression one of the log files", err);
                    }
                });
            });
        } else {
            debug("Error: could not find any logs to rotate");
        }
    });
};

// Timer to execute the log rotation process one per day
workers.logRotationLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

// Init script
workers.init = () => {
    // Send to console in yellow
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

    // Compress all the logs immediatly
    workers.rotateLogs();

    // Call the compression loop so logs will be compressed later on
    workers.logRotationLoop();
}


// Export the workers object
module.exports = workers;