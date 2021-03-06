'use strict';

const superagent = require('superagent');
const Controller = require('../../core/Controller');
const db = require('../../core/models');
const minio = require('../../core/minio');
const utils = require('../../core/utils');
const sharp = require('sharp');
// const logger = require('../../core/logger');

class ServerListing extends Controller {
	constructor(bot) {
		super(bot);

		const basePath = '/api/server/:id/serverlisting';

		this.channelCache = new Map();
		this.channelCacheInterval = setInterval(this.clearCaches.bind(this), 10000);

		return {
			get: {
				method: 'get',
				uri: basePath,
				handler: this.get.bind(this),
			},
			update: {
				method: 'post',
				memoryUpload: true,
				uri: `${basePath}/update`,
				handler: this.update.bind(this),
			},
		};
	}

	clearCaches() {
		for (let [key, o] of this.channelCache) {
			if (Date.now() - o.cachedAt > 45000) {
				this.channelCache.delete(key);
			}
		}
	}

	_formatChannel(channel) {
		return utils.pick(channel, 'id', 'type', 'name', 'position', 'parentID');
	}

	async _getChannels(guildId) {
		const { snowClient: client } = this.bot;

		const channelCache = this.channelCache.get(guildId);
		let channels;

		if (channelCache) {
			channels = channelCache.channels || [];
		} else {
			channels = await client.guild.getGuildChannels(guildId);
			this.channelCache.set(guildId, {
				cachedAt: Date.now(),
				channels: channels || [],
			});
		}

		channels = channels || [];

		return channels.map(c => this._formatChannel(c))
			.sort((c1, c2) => (c1.position !== c2.position) ? c1.position - c2.position : c1.id - c2.id);
	}

	async resolveInvite(invite) {
		const match = invite.match(/https:\/\/(?:discord.gg|discordapp.com\/api\/invite|discordapp.com\/invite)\/([\w\d]+)/);
		let code;

		if (match && match.length > 1) {
			code = match[1];
		}

		if (!code) {
			return Promise.reject('Unable to resolve invite code.');
		}

		try {
			const response = await superagent.get(`https://discordapp.com/api/invite/${code}?with_counts=true`);
			if (response && response.body) {
				return response.body;
			}
			return Promise.reject(`Invite not found.`);
		} catch (err) {
			return Promise.reject('Invalid invite.');
		}
	}

	validateLinks(url, type) {
		const regexes = {
			youtube: /^(?:https|http):\/\/(?:[w]{3}\.)?youtube\.com\/(?:c\/|channel\/|user\/)?([a-zA-Z0-9-_]{1,})\/?$/,
			twitter: /^(?:https|http):\/\/(?:[w]{3}\.)?twitter\.com\/([a-zA-Z0-9_]{1,15})\/?$/,
			twitch: /^(?:https|http):\/\/(?:[w]{3}\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})\/?$/,
			reddit: /^(?:https|http):\/\/(?:[w]{3}\.)?reddit\.com\/r\/([a-zA-Z0-9_]{1,})\/?$/,
		};

		const regex = regexes[type];
		return regex.test(url);
	}

	async get(bot, req, res) {
		try {
			const id = req.params.id;

			if (!id) {
				res.status(500).send('No id specified');
				return;
			}

			if (!id.match(/^([0-9]+)$/)) {
				res.status(500).send('Invalid id');
				return;
			}

			const coll = db.collection('serverlist_store');

			let [server, channels] = await Promise.all([
				coll.findOne({ id }),
				this._getChannels(id),
			]);

			let noInfoConfig = false;

			if (server && !server.name && (server.premium || server.featured)) {
				noInfoConfig = true;
			}

			if (!server || noInfoConfig) {
				const serverColl = db.collection('servers');
				const guildConfig = await serverColl.findOne({ _id: id });
				server = server || {};

				server.id = id;
				server.icon = guildConfig.iconURL;
				server.name = guildConfig.name;
				server.listed = false;
				server.borderColor = '#202020';
				server.description = 'A very interesting server';
			}

			const categoriesColl = db.collection('serverlist_categories');
			let categories = await categoriesColl.find({ disabled: false }, { _id: 0, name: 1 }).toArray();
			categories = categories.map((v) => v.name);

			res.send({ server, categories, channels });
		} catch (err) {
			res.status(500).send(err.message);
		}
	}

	async processAndUploadImage(fileKey, ogFileKey, bucket, buffer, vertical) {
		const width = vertical ? 242 : 238;
		const height = vertical ? 416 : 271;
		let blurBuffer = await sharp(buffer)
			.resize(width, height)
			.blur(3.5)
			.png({
				progressive: true,
				compressionLevel: 9,
			})
			.toBuffer();

		let ogBuffer = await sharp(buffer)
			.resize(width, height)
			.png({
				progressive: true,
				compressionLevel: 9,
			})
			.toBuffer();

		return new Promise((resolve, reject) => {
			minio.putObject(bucket, ogFileKey, ogBuffer, ogBuffer.size, (err, etag) => { });
			minio.putObject(bucket, fileKey, blurBuffer, blurBuffer.size, (err, etag) => {
				if (err) reject(err);
				resolve(etag);
			});
		});
	}

	async update(bot, upload, req, res) {
		req.uploadDir = `serverlisting/${req.params.id}`;
		upload.fields([{ name: 'backgroundImageVerticalFile' }, { name: 'backgroundImageFile' }])(req, res, async (err) => {
			if (err) {
				res.status(500).send(err.message);
				return;
			}

			try {
				let {
					inviteUrl,
					// borderColor,
					description,
					listed,
					tags,
					categories,
					links,
					defaultInviteChannel,
				} = req.body;

				tags = JSON.parse(tags);
				categories = JSON.parse(categories);
				links = JSON.parse(links);

				let {
					backgroundImageFile,
					backgroundImageVerticalFile,
				} = req.files;

				let icon;
				const id = req.params.id;

				listed = (listed === 'true');

				if (!defaultInviteChannel) {
					res.status(500).send('Pick a default invite channel');
					return;
				}

				if (!inviteUrl) {
					try {
						const { snowClient: client } = this.bot;
						const invite = await client.channel.createChannelInvite(defaultInviteChannel, { max_age: 0 });
						inviteUrl = `https://discord.gg/${invite.code}`;
					} catch (e) {
						res.status(500).send('Could not create an invite');
						return;
					}
				}

				if (!inviteUrl && listed) {
					res.status(500).send('Invalid invite');
					return;
				}

				try {
					const inviteInfo = await this.resolveInvite(inviteUrl);

					if (!inviteInfo) {
						res.status(500).send('Invalid invite');
						return;
					}

					if (inviteInfo && inviteInfo.guild.id !== id) {
						res.status(500).send('Invalid invite');
						return;
					}

					if (inviteInfo && inviteInfo.guild.icon) {
						icon = `https://cdn.discordapp.com/icons/${id}/${inviteInfo.guild.icon}.png?size=128`;
					}
				} catch (err) {
					res.status(500).send(err);
					return;
				}

				// if (borderColor) {
				// 	if (!/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(borderColor)) {
				// 		res.status(500).send('Invalid border color');
				// 		return;
				// 	}
				// }

				if (description) {
					if (description.length > 200) {
						res.status(500).send('Description too long');
						return;
					}
				} else {
					res.status(500).send('Please provide a description');
				}

				if (links && links.length > 0) {
					const errorMessages = {
						youtube: 'Invalid Youtube URL',
						twitter: 'Invalid Twitter URL',
						twitch: 'Invalid Twitch URL',
						reddit: 'Invalid Subreddit URL',
					};

					const validTypes = ['youtube', 'twitter', 'twitch', 'reddit'];

					links = links.filter((l) => validTypes.includes(l.type));

					const hasError = links.some((l) => {
						if (!this.validateLinks(l.url, l.type)) {
							res.status(500).send(errorMessages[l.type]);
							return true;
						}

						return false;
					});

					if (hasError) return;
				}

				let tagsFlattened;
				if (tags) {
					if (!Array.isArray(tags)) {
						res.status(500).send('Invalid tags');
						return;
					}

					if (tags.some((i) => typeof i !== 'string')) {
						res.status(500).send('Invalid tags');
						return;
					}
					tagsFlattened = tags.reduce((previousValue, currentValue) => `${previousValue} ${currentValue}`, '');
				}

				const categoriesColl = db.collection('serverlist_categories');
				let categoriesList = await categoriesColl.find({ disabled: false }, { _id: 0, name: 1 }).toArray();
				categoriesList = categoriesList.map((v) => v.name);

				let categoriesFlattened;
				if (categories) {
					if (!Array.isArray(categories)) {
						res.status(500).send('Invalid categories');
						return;
					}

					if (categories.some((i) => typeof i !== 'string')) {
						res.status(500).send('Invalid categories');
						return;
					}

					if (categories.some((i) => !categoriesList.includes(i))) {
						res.status(500).send('Invalid categories');
						return;
					}

					categoriesFlattened = categories.reduce((previousValue, currentValue) => `${previousValue} ${currentValue}`, '');
				}

				const serverColl = db.collection('servers');
				const guildConfig = await serverColl.findOne({ _id: id });

				if (!guildConfig || guildConfig.deleted) {
					res.status(500).send('RNet must be in the server to list it');
					return;
				}

				const coll = db.collection('serverlist_store');
				let server = await coll.findOne({ id });

				if (server && server.blacklisted) {
					res.status(500).send('This server has been blacklisted.');
					return;
				}

				const minioBucket = 'server-listing';
				if (server) {
					if ((server.premium || server.featured) && backgroundImageFile && backgroundImageFile.length > 0) {
						backgroundImageFile = backgroundImageFile[0];
						const fileKey = `${id}/regular/bg.png`;
						const ogFileKey = `${id}/regular/original.png`;

						await this.processAndUploadImage(fileKey, ogFileKey, minioBucket, backgroundImageFile.buffer, false);
						backgroundImageFile.key = fileKey;
					}

					if (server.featured && backgroundImageVerticalFile && backgroundImageVerticalFile.length > 0) {
						backgroundImageVerticalFile = backgroundImageVerticalFile[0];
						const fileKey = `${id}/vertical/bg.png`;
						const ogFileKey = `${id}/vertical/original.png`;

						await this.processAndUploadImage(fileKey, ogFileKey, minioBucket, backgroundImageVerticalFile.buffer, true);
						backgroundImageVerticalFile.key = fileKey;
					}
				}

				// Timestamp used for cache bursting
				const timestamp = (new Date()).getTime();
				const backgroundImage = backgroundImageFile && `https://s.dyno.gg/${minioBucket}/${backgroundImageFile.key}?cb=${timestamp}`;
				const backgroundImageVertical = backgroundImageVerticalFile && `https://s.dyno.gg/${minioBucket}/${backgroundImageVerticalFile.key}?cb=${timestamp}`;

				this.weblog(req, req.params.id, req.session.user, `Updated server listing information`);

				if (!server) {
					server = {
						id,
						icon: guildConfig.iconURL,
						name: guildConfig.name,
						memberCount: guildConfig.memberCount,
						// borderColor,
						description,
						listed,
						// backgroundImage,
						// backgroundImageVertical,
						categories,
						categoriesFlattened,
						tags,
						tagsFlattened,
						links,
						defaultInviteChannel,
						inviteUrl,
					};

					const webhookContent = {
						username: 'RNet Police',
						content: '',
						embed: 'hack to make snowtransfer work',
						embeds: [
							{
								title: guildConfig.name,
								description: description,
								image: {
									url: guildConfig.iconURL,
								},
								footer: {
									text: `Server ID: ${id} | User ID: ${req.session.user.id}`,
								},
							},
						],
					};
					this.client.webhook.executeWebhook('503474669232586752', 'qTtgBcyes3MpmVmvUNijKnibe0YZK0gfZdbriC6eHoFpltgTdymqyjAdFGdU9KqYpP3o', webhookContent);
					await coll.insert(server);
				} else {
					let setData = {};
					// setData.borderColor = borderColor || '#202020';
					setData.description = description;
					setData.listed = listed || false;
					setData.inviteUrl = inviteUrl;
					setData.tags = tags || undefined;
					setData.tagsFlattened = tagsFlattened || undefined;
					setData.categories = categories || undefined;
					setData.categoriesFlattened = categoriesFlattened || undefined;
					setData.links = links || undefined;
					setData.defaultInviteChannel = defaultInviteChannel || undefined;
					setData.name = guildConfig.name || undefined;
					setData.memberCount = guildConfig.memberCount;
					setData.icon = icon || undefined;

					if (backgroundImage) {
						setData.backgroundImage = backgroundImage;
					}
					if (backgroundImageVertical) {
						setData.backgroundImageVertical = backgroundImageVertical;
					}

					await coll.updateOne({ id }, { $set: setData });
				}
				res.status(200).end();
			} catch (err) {
				res.status(500).send(err.message);
			}
		});
	}
}

module.exports = ServerListing;
