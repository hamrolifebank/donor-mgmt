const { ObjectId } = require('mongoose').Types;

const ConsentModel = require('./consent.model');
const DonorController = require('./donor.controller');
const { TextUtils } = require('../../utils');

class Controller {
	constructor() {}

	async save(payload, options) {
		payload.event = ObjectId(payload.event);
		payload.team = ObjectId(payload.team);

		// Save Donor Info
		let donor = {
			...payload.donor_info,
			event: payload.event,
			donations: [payload.event],
			created_by: options.currentUser,
			updated_by: options.currentUser,
			teams: payload.team,
		};

		if (donor.id) {
			const donorId = ObjectId(donor.id);
			donor = await DonorController.update(donorId, donor);
		} else {
			donor = await DonorController.add(donor);
		}

		// Save Consent
		payload.donor = donor._id;
		payload.blood_info = payload.blood_info || {};
		if (payload.blood_info.bag_number) {
			payload.is_completed = true;
			this.setComplete();
		}

		payload.updated_by = options.currentUser;
		if (payload.id) {
			return ConsentModel.findOneAndUpdate({ _id: payload.id }, payload, { new: true });
		}
		payload.created_by = options.currentUser;
		return ConsentModel.create(payload);
	}

	get(id) {
		return ConsentModel.findById(id);
	}

	async getWithDonorDetails(id) {
		const consent = await ConsentModel.aggregate([
			{
				$match: { _id: ObjectId(id) },
			},
			{
				$lookup: {
					from: 'donors',
					localField: 'donor',
					foreignField: '_id',
					as: 'donor',
				},
			},
			{
				$unwind: {
					path: '$donor',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'events',
					localField: 'event',
					foreignField: '_id',
					as: 'event',
				},
			},
			{
				$unwind: {
					path: '$event',
					preserveNullAndEmptyArrays: true,
				},
			},
		]);
		if (consent.length > 0) return consent[0];
		null;
	}

	listByEvent(eventId, populateDonor = false) {
		if (populateDonor) return ConsentModel.find({ event: ObjectId(eventId) }).populate('donor');
		return ConsentModel.find({ event: ObjectId(eventId) });
	}

	async listByEventWithDetails({ start = 0, limit = 1, search = null, eventId, isComplete = false }) {
		let query = {};
		if (search) {
			const $regex = new RegExp(TextUtils.escapeRegex(search), 'gi');
			query = {
				$or: [
					{
						'donor.name': { $regex },
					},
					{
						'blood_info.bag_number': { $regex },
					},
				],
			};
		}

		const matchedData = await ConsentModel.aggregate([
			{
				$match: {
					event: ObjectId(eventId),
					is_completed: isComplete,
				},
			},
			{
				$lookup: {
					from: 'donors',
					localField: 'donor',
					foreignField: '_id',
					as: 'donor',
				},
			},
			{
				$unwind: {
					path: '$donor',
					preserveNullAndEmptyArrays: true,
				},
			},
			{ $match: query },
			{
				$addFields: {
					revisedBloodBag: '$blood_info.bag_number',
				},
			},
			// {
			//   $pr
			// },
			{
				$facet: {
					data: [
						{
							$sort: {
								created_at: -1,
							},
						},
						{
							$skip: parseInt(start),
						},
						{
							$limit: parseInt(limit),
						},
					],
					total: [
						{
							$group: {
								_id: null,
								count: {
									$sum: 1,
								},
							},
						},
					],
				},
			},
		]);

		let data = [];
		let total = 0;
		if (matchedData[0].data.length > 0) {
			data = matchedData[0].data;
			total = matchedData[0].total[0].count;
			for (const d in data) {
				if (data[d].blood_info) {
					if (data[d].blood_info.bag_number) {
						const bloodBag = data[d].blood_info.bag_number.replace(/\D/g, '');
						data[d].revisedBloodBag = bloodBag;
					}
				}
			}
		}
		return {
			data,
			total,
			limit,
			start,
			page: Math.round(start / total) + 1,
		};
	}

	setComplete(id) {
		console.log('---- Consent Complete Implementation Code ------');
	}

	setCertificateProcessing(ids) {
		if (!Array.isArray(ids)) ids = [ids];
		return ConsentModel.updateMany({ _id: { $in: ids } }, { certificate: 'processing' });
	}

	updateCertificateUrl(id, url) {
		return ConsentModel.findByIdAndUpdate(id, { certificate: url });
	}
}

module.exports = new Controller();
