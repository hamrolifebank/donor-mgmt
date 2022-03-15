const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const ConsentSchema = mongoose.Schema(
	{
		donor: { type: ObjectId, required: true, ref: 'Donor' },
		event: { type: ObjectId, required: true, ref: 'Event' },
		donor_info: {
			id: { type: ObjectId, ref: 'Donor' },
			phone: { type: String, required: true },
			name: { type: String, required: true },
			dob: Date,
			gender: { type: String, required: true, enum: ['M', 'F', 'O'] },
			email: String,
			last_donated_date: Date,
			address: String,
			blood_group: String,
		},
		medical_info: {},
		blood_info: {},
		questions: {},
		certificate: {
			location: String,
			email_sent: Date,
			hulaak_id: ObjectId,
		},
		is_completed: { type: Boolean, required: true, default: false },
		created_by: { type: ObjectId, ref: 'User' },
		updated_by: { type: ObjectId, ref: 'User' },
		is_imported: { type: Boolean, default: false },
	},
	{
		collection: 'consents',
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	},
);

module.exports = mongoose.model('Consent', ConsentSchema);
