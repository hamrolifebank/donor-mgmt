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
			address: Joi.string(),
			wallet_address: Joi.string(),
			wallet_backup: Joi.object(),
			blood_group: Joi.string(),
			gender: Joi.string(),
			is_donor: Joi.boolean(),
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
			picture: Joi.string().optional().allow(''),
			roles: Joi.array().items(Joi.string()),
			serviceId: Joi.string().optional().allow(''),
			googleId: Joi.string().optional().allow(''),
			is_donor: Joi.boolean().optional().allow(''),
			imageUrl: Joi.string().optional().allow(''),
			address: Joi.string().optional().allow(''),
			gender: Joi.string().optional().allow(''),
			wallet_address: Joi.string().optional().allow(''),
			blood_group: Joi.string().optional().allow(''),
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
			address: Joi.string().optional().allow(''),
			gender: Joi.string().optional().allow(''),
			bloodGroup: Joi.string().optional().allow(''),
			service: Joi.string(),
			serviceId: Joi.string(),
			tokenData: Joi.string(),
			socialData: Joi.object().optional().allow(''),
			imageUrl: Joi.string().optional().allow(''),
			walletAddress: Joi.string(),
			isDonor: Joi.boolean(),
		}),
	},
};
