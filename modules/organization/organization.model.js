const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const OrgSchema = mongoose.Schema(
	{
		name: { type: String, required: true },
		phone: { type: String, required: true },
		address: { type: String, required: true },
		geo_location: {
			longitude: Number,
			latitude: Number,
		},
		consent_form: {
			html: String,
			style: String,
		},
		created_by: { type: ObjectId, ref: 'User' },
		updated_by: { type: ObjectId, ref: 'User' },
	},
	{
		collection: 'organizations',
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toObject: { virtuals: true },
		toJSON: { virtuals: true },
	},
);

OrgSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model('Organization', OrgSchema);
