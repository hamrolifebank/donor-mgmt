const mongoose = require('mongoose');

const Schema = mongoose.Schema(
	{
		user: { type: String },
		otp: { type: String },
		expiration_date: { type: Date },
		verified: { type: Boolean, default: false },
	},
	{
		collection: 'otp',
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	},
);

module.exports = mongoose.model('otp', Schema);
