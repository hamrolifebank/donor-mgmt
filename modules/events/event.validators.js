const Joi = require('joi-oid');
const GooseJoi = require('../../helpers/utils/goosejoi');

module.exports = {
	add: {
		payload: Joi.object({
			name: Joi.string().required(),
			address: Joi.string().required(),
			date: Joi.date().required(),
			team: Joi.string(),
		}),
	},
	list: {
		query: Joi.object({
			limit: Joi.number(),
			start: Joi.number(),
			search: Joi.string(),
			org_id: GooseJoi.id(),
		}),
	},
	getById: {
		params: Joi.object({ eventId: GooseJoi.id('Enter Event ID') }),
	},
	register: {
		params: GooseJoi.id('Enter Event ID'),
		payload: Joi.object({
			wallet_address: Joi.string(),
			user_id: Joi.objectId(),
			googleId: Joi.string(),
			name: Joi.string(),
			phone: Joi.string(),
			email: Joi.string().email().required(),
			address: Joi.string(),
			bloodGroup: Joi.string(),
			gender: Joi.string(),
			imageUrl: Joi.string(),
		}),
	},
};
