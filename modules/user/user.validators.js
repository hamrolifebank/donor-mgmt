const Joi = require('joi-oid');

module.exports = {
	list: {},
	add: {
		payload: Joi.object({
			name: Joi.string(),
			email: Joi.string(),
			phone: Joi.string().example('9800000000'),
			password: Joi.string(),
			roles: Joi.array().items(Joi.string()),
			picture: Joi.string(),
		}).label('User'),
	},
	login: {
		payload: Joi.object({
			username: Joi.string().example('example@example.com'),
			password: Joi.string().example('password'),
			loginBy: Joi.string().example('email phone'),
		}),
	},
	register: {
		payload: Joi.object({
			name: Joi.string().required(),
			email: Joi.string().example('example@example.com').allow(''),
			phone: Joi.string().example('9800000000').required(),
			password: Joi.string().example('password').required(),
			picture: Joi.string(),
		}),
	},
	findById: {
		params: Joi.object({
			id: Joi.objectId(),
		}),
	},
	update: {
		params: Joi.object({
			id: Joi.objectId(),
		}),
		payload: Joi.object({
			name: Joi.string(),
			email: Joi.string().example('example@example.com'),
			phone: Joi.string().example('9800000000'),
			picture: Joi.string(),
			roles: Joi.array().items(Joi.string()),
		}).label('User'),
	},
	removeRoles: {
		params: Joi.object({
			id: Joi.objectId(),
		}),
		payload: Joi.object({
			roles: Joi.string(),
		}),
	},
	addRoles: {
		params: Joi.object({
			id: Joi.objectId(),
		}),
		payload: Joi.object({
			roles: Joi.string().example('Farmer/Trader/Agro-Trader'),
		}),
	},
	updateStatus: {
		params: Joi.object({
			id: Joi.objectId(),
		}),
		payload: Joi.object({
			status: Joi.string(),
		}),
	},
	forgotPassword: {
		payload: Joi.object({
			username: Joi.string(),
		}),
	},
	verifyResetToken: {
		params: Joi.object({
			token: Joi.string(),
		}),
	},
	resetPassword: {
		params: Joi.object({
			id: Joi.objectId(),
		}),
		payload: Joi.object({
			password: Joi.string(),
			notify: Joi.string(),
		}),
	},
	changePassword: {
		params: Joi.object({
			id: Joi.objectId(),
		}),
		payload: Joi.object({
			oldPassword: Joi.string(),
			newPassword: Joi.string(),
		}),
	},
	verifyOTP: {
		payload: Joi.object({
			otp: Joi.string(),
			otpDetails: Joi.object({
				id: Joi.objectId(),
				check: Joi.string(),
				timestamp: Joi.date(),
			}),
		}),
	},
	googleLogin: {
		payload: Joi.object({
			name: Joi.string(),
			email: Joi.string(),
			phone: Joi.string(),
			address: Joi.string(),
			gender: Joi.string(),
			bloodGroup: Joi.string(),
			service: Joi.string(),
			serviceId: Joi.string(),
			tokenData: Joi.string(),
			socialData: Joi.object(),
			imageUrl: Joi.string(),
			walletAddress: Joi.string(),
		}),
	},
};
