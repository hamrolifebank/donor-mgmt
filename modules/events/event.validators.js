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
			currentPage: Joi.number(),
			total: Joi.number(),
			totalPages: Joi.number(),
		}),
	},
	getById: {
		params: Joi.object({ eventId: GooseJoi.id('Enter Event ID') }),
	},
	register: {
		params: GooseJoi.id('Enter Event ID'),
		payload: Joi.object({
			walletAddress: Joi.string(),
			userId: Joi.objectId(),
			serviceId: Joi.string(),
			name: Joi.string(),
			phone: Joi.string(),
			email: Joi.string().email().required(),
			address: Joi.string().optional().allow(''),
			bloodGroup: Joi.string().optional().allow(''),
			gender: Joi.string().optional().allow(''),
			imageUrl: Joi.string().optional().allow(''),
			isDonor: Joi.boolean(),
		}),
	},
};
