const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const Schema = mongoose.Schema(
	{
		donor_no: { type: String }, // HLB001
		name: { type: String, required: true },
		phone: { type: String, required: true },
		contacts: [{ phone: String, _id: false }],
		email: { type: String },
		address: { type: String },
		dob: { type: Date },
		gender: {
			type: String,
			required: true,
			enum: ['M', 'F', 'O', 'U'],
			default: 'U',
		},
		blood_info: {
			group: { type: String, enum: ['A', 'B', 'O', 'AB', ''] },
			rh_factor: { type: String, enum: ['+', '-'] },
			is_verified: { type: Boolean, required: true, default: false },
			verified_date: { type: Date },
		},
		last_donated_date: { type: Date },
		donations_legacy: [{ date: Date, site: String }],
		geo_location: {
			longitude: Number,
			latitude: Number,
		},
		source: {
			name: String,
		},
		extras: {},
		user_id: { type: ObjectId, ref: 'User' },
		created_by: { type: ObjectId, ref: 'User' },
		updated_by: { type: ObjectId, ref: 'User' },
	},
	{
		collection: 'donors',
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	},
);

module.exports = mongoose.model('Donor', Schema);
