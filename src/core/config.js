/* eslint-disable object-curly-spacing */
/* eslint-disable quote-props */
'use strict';

const path = require('path');
const getenv = require('getenv');
const pkg = require('../../package.json');

const basePath = path.resolve(path.join(__dirname, '..'));

require('dotenv').config({ silent: true });

/**
 * Base configuration object
 * @name config
 * @type {{
 *      name: string,
 *      author: string,
 *      version: string,
 *      lib: string,
 *      poweredBy: string,
 *      prefix: string,
 *      sudopref: string,
 *      contributors: [object]
 *      mentions: [object]
 *      test: boolean,
 *      beta: boolean,
 *      invite: string,
 *      shardCountOverride: number,
 *      logLevel: string
 *      youtubeKey: string,
 *      cryptkey: string,
 *      defaultPermissions: string,
 *      pkg: object,
 *      testGuilds: [string],
 *      betaGuilds: [string]
 *      paths: object,
 *      client: object,
 *      site: object,
 *      redis: object,
 *      api: object,
 *      sentry: object,
 *      emojis: object,
 *      carbon: object,
 *      dbots: object,
 *      announcements: object,
 *      automod: object,
 *      permissions: object,
 *      servers: [string]
 * }}
 */
const config = {
	name:      'RNet',
	author:    'ROM™™#3500',
	version:   pkg.version,
	lib:       'eris',
	poweredBy: 'RNet',
	prefix:    '?',
	sudopref:  '$',
	test:      getenv.bool('CLIENT_TEST', false),
	beta:      getenv.bool('CLIENT_BETA', false),
	staging:   getenv.bool('CLIENT_STAGING', false),
	isPremium: getenv.bool('CLIENT_PREMIUM', false),
	invite:    getenv('CLIENT_INVITE', 'https://discord.gg/Z95zhhCgt9'),
	logLevel:  getenv('CLIENT_LOGLEVEL', 'info'),
	cryptkey:  getenv('CRYPT_KEY', ''),
	defaultPermissions: '2134207679',
	pkg: pkg,
	overseers: [
		'393847930039173131',
	],
	testGuilds: [
		'538530739017220107',
	],
	betaGuilds: [],
	avatar: 'images/rnet-v2-300.jpg',
	state: getenv('CLIENT_STATE', 2),
	servers: { 'prod01': 'Titan', 'prod02': 'Atlas', 'prod03': 'Pandora'},
	clustersPerServer: 32,
	shardsPerCluster: 6,
};

/**
 * Directory path configruation
 * @name config.paths
 * @type {{
 *      base: string,
 *      controllers: string,
 *      uploads: string,
 *      models: string,
 *      modules: string,
 *      commands: string,
 *      ipc: string,
 *      views: string,
 *      public: string,
 *      images: string
 * }}
 */
config.paths = {
	base:        basePath,
	controllers: path.join(basePath, 'controllers'),
	images:      path.join(basePath, '..', 'public/images'),
	public:      path.join(basePath, '..', 'public'),
	views:       path.join(basePath, '..', 'views'),
};

/**
 * Client configuration
 * @name config.client
 * @type {{
 *      id: string,
 *      secret: string,
 *      token: string,
 *      admin: string,
 *      game: string,
 *      ws: {
 *          url: string,
 *          timeout: number
 *      },
 *      fetchAllUsers: boolean,
 *      disableEveryone: boolean,
 *      maxCachedMessages: number,
 *      messageLogging: boolean,
 * }}
 */
config.client = {
	id:     getenv('CLIENT_ID', ''),
	secret: getenv('CLIENT_SECRET', ''),
	// token:  getenv('CLIENT_TOKEN', ''),
	game: 	getenv('CLIENT_GAME', '?help'),
	userid: getenv('CLIENT_USER_ID', '550869101170655233'),
	admin:  getenv('ADMIN_ID', ''),
	cache: {
		limit: getenv('CLIENT_CACHE_LIMIT', 60000),
	},
	ws: {
		port: getenv('CLIENT_WS_PORT', 5000),
		url: getenv('CLIENT_WS_URLS', 'ws://localhost:5000').split('|'),
		timeout: 5000,
	},
};

config.snowgate = {
	host: getenv('SNOWGATE_HOST', 'http://localhost.com:4096'),
	token: getenv('SNOWGATE_TOKEN', ''),
};

config.braintree = {
  merchantId: getenv('BRAINTREE_MERCHANT_ID', ''),
  publicKey: getenv('BRAINTREE_PUBLIC_KEY', ''),
  privateKey: getenv('BRAINTREE_PRIVATE_KEY', ''),
  sandbox: getenv.bool('BRAINTREE_SANDBOX', false),
};

/**
 * Site configuration
 * @name config.site
 * @type {{
 *      host: string,
 *      port: number,
 *      listen_port: number,
 *      secret: string,
 *      statusChannel: string,
 *      statusMessage: string
 * }}
 */
config.site = {
	host:        getenv('SITE_HOST', 'http://localhost.com'),
	port:        getenv('SITE_PORT', 80),
	listen_port: getenv('SITE_LISTEN_PORT', 8000),
	secret:      getenv('SITE_SECRET', ''),
	recaptcha_site_key: getenv('RECAPTCHA_SITE_KEY', ''),
	recaptcha_secret_key: getenv('RECAPTCHA_SECRET_KEY', ''),
};

config.premium = {
	client: {
		id:     getenv('PREMIUM_CLIENT_ID', ''),
		secret: getenv('PREMIUM_CLIENT_SECRET', ''),
		token:  getenv('PREMIUM_CLIENT_TOKEN', ''),
		game: 	getenv('PREMIUM_CLIENT_GAME', 'https://rnet.cf | ?help'),
		userid: getenv('PREMIUM_CLIENT_USER_ID', ''),
	},
	site: {
		host:        getenv('PREMIUM_SITE_HOST', 'http://localhost.com'),
		port:        getenv('PREMIUM_SITE_PORT', 80),
		listen_port: getenv('PREMIUM_SITE_LISTEN_PORT', 8000),
		secret:      getenv('PREMIUM_SITE_SECRET', ''),
	},
};

config.paypal = {
	liveHost: 'paypal.com',
	sandboxHost: 'sandbox.paypal.com',
	pdtToken: getenv('PDT_TOKEN', null),
};

/**
 * Redis configuration
 * @name config.redis
 * @type {{
 *      host: string,
 *      port: number,
 *      auth: string
 * }}
 */
config.redis = {
	host: getenv('CLIENT_REDIS_HOST', 'localhost'),
	port: getenv('CLIENT_REDIS_PORT', 6379),
	auth: process.env.CLIENT_REDIS_AUTH && process.env.CLIENT_REDIS_AUTH.length ? process.env.CLIENT_REDIS_AUTH : null,
};

/**
 * API configuration
 * @name config.api
 * @type {{ baseurl: string }}
 */
config.api = { baseurl: 'https://discordapp.com/api' };

/**
 * Sentry configuration
 * @name config.sentry
 * @type {{ dsn: string, logLevel: string }}
 */
config.sentry = {
	dsn: process.env.SENTRY_DSN,
	logLevel: getenv('SENTRY_LOGLEVEL', 'error'),
};

/**
 * Emojis configuration
 * @name config.emojis
 * @type {{ error: string, success: string }}
 */
config.emojis = {
	success: ':ok_hand:',
	error:   ':fire:',
};

/**
 * Announcement default configuration
 * @name config.announcements
 * @type {{
 *      joinMessage: string,
 *      leaveMessage: string,
 *      banMessage: string
 * }}
 */
config.announcements = {
	joinMessage:  '_**{user} has joined.**_',
	leaveMessage: '_**{user} has left.**_',
	banMessage:   '_**{user} was banned.**_ :hammer:',
};

/**
 * Automod default configuration
 * @nane config.automod
 * @type {{ badwords: [string] }}
 */
config.automod = {
	badwords: [
		'fuck', 'nigg', 'fuk', 'cunt', 'cnut', 'bitch',
		'dick', 'd1ck', 'pussy', 'asshole', 'b1tch',
		'b!tch', 'blowjob', 'cock', 'c0ck',
	],
};

/**
 * Minio configuration
 * @name config.minio
 * @type {{ access_key: string, secret_key: string }}
 */
config.minio = {
	access_key: process.env.MINIO_ACCESS_KEY,
	secret_key: process.env.MINIO_SECRET_KEY,
};

/**
 * Permissions constants
 */
config.permissions = {
	// general
	createInstantInvite: 1 << 0,
	kickMembers:         1 << 1,
	banMembers:          1 << 2,
	administrator:       1 << 3,
	manageChannels:      1 << 4,
	manageChannel:       1 << 4,
	manageServer:        1 << 5,
	changeNickname:      1 << 26,
	manageNicknames:     1 << 27,
	manageRoles:         1 << 28,
	managePermissions:   1 << 28,
	// text
	readMessages:        1 << 10,
	sendMessages:        1 << 11,
	sendTTSMessages:     1 << 12,
	manageMessages:      1 << 13,
	embedLinks:          1 << 14,
	attachFiles:         1 << 15,
	readMessageHistory:  1 << 16,
	mentionEveryone:     1 << 17,
	// voice
	voiceConnect:        1 << 20,
	voiceSpeak:          1 << 21,
	voiceMuteMembers:    1 << 22,
	voiceDeafenMembers:  1 << 23,
	voiceMoveMembers:    1 << 24,
	voiceUseVAD:         1 << 25,
};

module.exports = config;
