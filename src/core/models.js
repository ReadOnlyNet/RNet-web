'use strict';

const getenv = require('getenv');
const DataFactory = require('@rnet.cf/datafactory');
// const DataFactory = require('../../../RNet-datafactory');

require('dotenv').config({ silent: true });

const dbString = getenv('CLIENT_MONGO_URL', 'localhost');

if (!dbString) {
	throw new Error('Missing environment variable CLIENT_MONGO_URL.');
}

const db = new DataFactory({
	dbString,
	logger: {
		level: getenv('CLIENT_LOGLEVEL', 'info'),
		sentry: {
			level: getenv('SENTRY_LOGLEVEL', 'error'),
			dsn: process.env.SENTRY_DSN || null,
		},
	},
});

// const models = db.models;
// models.mongoose = db.mongoose;
// models.Schema = db.Schema;

module.exports = db;
