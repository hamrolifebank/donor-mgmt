const mongoose = require('mongoose');
const RSUser = require('rs-user');
const otpGenerator = require('otp-generator');
const { ERR } = require('../../helpers/utils/error');

const { DataUtils } = require('../../helpers/utils');
const messenger = require('../../helpers/utils/messenger');
const smsService = require('../../helpers/utils/sms');
const { Role } = require('./role.controllers');
const OtpModel = require('../otp/otp.model');

const fnCreateSchema = (schema, collectionName) => {
	const userSchema = mongoose.Schema(schema, {
		collection: collectionName,
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	});

	// userSchema.index({ geo_location: '2dsphere' });
	return userSchema;
};

const User = new RSUser.User({
	mongoose,
	messenger,
	smsService,
	controllers: {
		role: Role,
	},
	schema: {
		user_token: String,
		token_expiration: Number,
	},
	fnCreateSchema,
});

const controllers = {
	User,
	async addRoles(request) {
		const userId = request.params.id;
		const { roles } = request.payload;
		const isValid = await Role.isValidRole(roles);
		if (!isValid) throw Error('role does not exist');
		return User.addRoles({ user_id: userId, roles });
	},

	list({ start, limit, sort, filter, paging = true }) {
		const query = [];
		if (filter) query.push({ $match: filter });
		query.push(
			{
				$addFields: { full_name: { $concat: ['$name.first', ' ', '$name.last'] } },
			},
			{
				$unset: ['password'],
			},
		);
		sort = sort || { 'name.first': 1 };

		if (paging) {
			return DataUtils.paging({
				start,
				limit,
				sort,
				model: User.model,
				query,
			});
		}

		query.push({ $sort: sort });
		return User.model.aggregate(query);
	},

	async login(request) {
		return User.authenticate(request.payload);
	},

	async findById(request) {
		return User.model.findById(request.params.id).select('-password');
	},

	async findByRoles(role) {
		return User.model.find({ roles: role }).select('-password');
	},

	async update(request) {
		const res = await User.update(request.params.id, request.payload);
		return res;
	},

	async removeRoles(request) {
		const userId = request.params.id;
		const { roles } = request.payload;
		const isValid = await Role.isValidRole(roles);
		if (!isValid) throw Error('role does not exist');
		return User.removeRole({ user_id: userId, roles });
	},

	async updateStatus(request) {
		const userId = request.params.id;
		let { status } = request.payload;
		status = status === 'true';
		return User.changeStatus(userId, status);
	},

	async add(request) {
		const data = request.payload;
		const checkPhone = await User.model.findOne({ phone: data.phone });
		if (checkPhone) throw ERR.PHONE_EXISTS;
		if (data.email) {
			const checkEmail = await User.model.findOne({ email: data.email });
			if (checkEmail) throw ERR.EMAIL_EXISTS;
		}
		try {
			const user = await User.create(data);
			return user;
		} catch (e) {
			return e;
		}
	},

	async auth(request) {
		try {
			const token = request.query.access_token || request.headers.access_token || request.cookies.access_token;
			const { user, permissions } = await User.validateToken(token);

			return {
				user,
				permissions,
			};
		} catch (e) {
			throw Error(`ERROR: ${e}`);
		}
	},

	register(request) {
		return controllers.add(request);
	},

	async forgotPassword(request) {
		const { username } = request.payload;
		const loginBy = username.includes('@') ? 'email' : 'phone';
		if (loginBy === 'email') {
			const checkEmail = await User.model.findOne({ email: username });
			if (!checkEmail) throw ERR.EMAIL_NOEXISTS;
		}
		if (loginBy === 'phone') {
			const checkPhone = await User.model.findOne({ phone: username });
			if (!checkPhone) throw ERR.PHONE_NOEXISTS;
		}
		return new Promise((resolve, reject) => {
			User.PasswordManager.forgotPassword(username, loginBy)
				.then(d => {
					resolve(d);
				})
				.catch(e => reject(e));
		});
	},

	resetPassword(request) {
		const userId = request.params.id;
		const { password, notify } = request.payload;
		return new Promise((resolve, reject) => {
			User.PasswordManager.resetPassword(userId, password, notify)
				.then(d => resolve(d))
				.catch(e => reject(e));
		});
	},

	verifyResetToken(request) {
		const { token } = request.params;
		return new Promise((resolve, reject) => {
			User.model
				.findOne({ user_token: token })
				.then(u => {
					const date = new Date();
					const expiresIn = date.setDate(date.getDate() + 1);
					if (u.token_expiration <= expiresIn) {
						resolve(u);
					} else {
						resolve({ msg: 'Token is expired' });
					}
				})
				.catch(e => reject(e));
		});
	},

	changePassword(request) {
		const userId = request.params.id;
		const { oldPassword, newPassword } = request.payload;
		return new Promise((resolve, reject) => {
			User.PasswordManager.changePassword(userId, oldPassword, newPassword)
				.then(d => resolve(d))
				.catch(e => reject(e));
		});
	},

	addMinutesToDate(date, minutes) {
		return new Date(date.getTime() + minutes * 60000);
	},

	dates: {
		convert(d) {
			return d.constructor === Date
				? d
				: d.constructor === Array
				? new Date(d[0], d[1], d[2])
				: d.constructor === Number
				? new Date(d)
				: d.constructor === String
				? new Date(d)
				: typeof d === 'object'
				? new Date(d.year, d.month, d.date)
				: NaN;
		},

		compare(a, b) {
			return isFinite((a = this.convert(a).valueOf())) && isFinite((b = this.convert(b).valueOf()))
				? (a > b) - (a < b)
				: NaN;
		},
	},

	async generateOTP(req) {
		const { email, otpLength, otpValidTime } = req.payload;
		const now = new Date();
		const otp = otpGenerator.generate(otpLength, {
			lowerCaseAlphabets: false,
			upperCaseAlphabets: false,
			specialChars: false,
		});

		const expirationTime = controllers.addMinutesToDate(now, otpValidTime);
		const payload = { otp, expiration_date: expirationTime };
		try {
			const otpResponse = await OtpModel.create(payload);

			const otpDetails = {
				timestamp: now,
				check: 'email',
				id: otpResponse._id,
			};

			await messenger.sendOtp({
				email,
				otp,
				template: 'OTP_SEND',
				otpValidTime,
			});

			return otpDetails;
		} catch (error) {
			return error;
		}
	},

	async verifyOTP(req) {
		try {
			const now = new Date();
			const { otp, otpDetails } = req.payload;
			const otpResponse = await OtpModel.findOne({ _id: otpDetails.id });
			if (otpResponse !== null) {
				if (otp === otpResponse.otp) {
					if (otpResponse.verified !== true) {
						if (controllers.dates.compare(otpResponse.expiration_date, now) === 1) {
							await OtpModel.findByIdAndUpdate(otpResponse._id, { verified: true });
							return { status: 'success', message: 'OTP Matched' };
						}
						throw { status: 'failure', message: 'OTP has expired' };
					} else {
						throw { status: 'failure', message: 'OTP has already been used' };
					}
				} else {
					throw { status: 'failure', message: "OTP doesn't match" };
				}
			} else {
				throw { status: 'failure', message: 'Bad Request' };
			}
		} catch (e) {
			throw e;
		}
	},
};

module.exports = controllers;
