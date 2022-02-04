const Joi = require('joi');

module.exports = {
	add: {
		payload: Joi.object({
			name: Joi.string().required(),
			phone: Joi.string().required().example('014223232 / 9841232323'),
			contacts: Joi.array().items(Joi.string).example('014223232 / 9841232323'),
			email: Joi.string().example('hello@gmail.com'),
			address: Joi.string().example('Kathmandu'),
			dob: Joi.date().example('21/12/1998'),
			gender: Joi.string().example('M / F / O'),
			blood_info: Joi.object({
				group: Joi.string().example('A / B / AB / O'),
				rh_factor: Joi.string().example('- / +'),
				is_verified: Joi.boolean().example('true / false'),
				verified_date: Joi.date().example('1/1/2002'),
			}),
			last_donated_date: Joi.date().example('21/12/1998'),
			donationsLegacy: Joi.array().items(Joi.date()),
			geo_location: Joi.object({
				longitude: Joi.number(),
				latitude: Joi.number(),
			}),
			source: Joi.string(),
			extras: Joi.object(),
		}),
	},
};
