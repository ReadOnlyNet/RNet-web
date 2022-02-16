const config = require('./config');
const { init, Logger } = require('@rnet.cf/logger');

init(config);

module.exports = Logger;