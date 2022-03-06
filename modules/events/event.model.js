const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const EventSchema = mongoose.Schema(
	{
		slug: { type: String, unique: true, required: true },
		name: { type: String, required: true },
		date: { type: Date, required: true },
		beneficiary: {
			type: ObjectId,
			ref: 'Organization',
			required: true,
		},
		location: { type: String },
		team: { type: ObjectId, required: true, ref: 'Team' },
		acl: [
			{
				eventRole: { type: String, $in: ['admin', 'editor', 'reader'], default: 'reader' },
				user: { type: ObjectId, ref: 'User' },
			},
		],
		owner: {
			type: ObjectId,
			required: true,
			ref: 'User',
		},
		registered_users: [{ type: ObjectId, ref: 'User' }],
		created_by: { type: ObjectId, ref: 'User' },
		updated_by: { type: ObjectId, ref: 'User' },
	},
	{
		collection: 'events',
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toObject: {
			virtuals: true,
		},
		toJSON: {
			virtuals: true,
		},
	},
);

module.exports = mongoose.model('Event', EventSchema);
