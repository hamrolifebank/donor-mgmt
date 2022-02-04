const Joi = require('joi');
const GooseJoi = require('../../helpers/utils/goosejoi');

module.exports = {
	add: {
		payload: Joi.object({
			name: Joi.string().required(),
			phone: Joi.string().required().example('014223232 / 9841232323'),
			contacts: Joi.array().items(Joi.string()),
			email: Joi.string().allow('').example('hello@gmail.com'),
			address: Joi.string().allow('').example('Kathmandu'),
			dob: Joi.date().allow(''),
			gender: Joi.string().allow('').example('M / F / O'),
			blood_info: Joi.object({
				group: Joi.string().example('A / B / AB / O'),
				rh_factor: Joi.string().example('- / +'),
				is_verified: Joi.boolean().required().default(false),
				verified_date: Joi.date(),
			}).allow(''),
			last_donated_date: Joi.date().allow(''),
			donationsLegacy: Joi.array().items(Joi.date()).allow(''),
			geo_location: Joi.object({
				longitude: Joi.number(),
				latitude: Joi.number(),
			}).allow(''),
			source: Joi.string().allow(''),
			extras: Joi.object().allow(''),
		}).label('Donor'),
	},

	list: {
		query: Joi.object({
			start: Joi.number().example(0),
			limit: Joi.number().example(20),
			group: Joi.string().example('A+'),
			phone: Joi.string().example('9823838333'),
			name: Joi.string(),
			address: Joi.string(),
			gender: Joi.string().example('M / F / O'),
			single: Joi.boolean().default(false),
		}),
	},

	getById: {
		params: GooseJoi.id('Enter Donor ID'),
	},
};
