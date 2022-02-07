const { ObjectId } = require('mongoose').Types;
const { TextUtils } = require('../../utils');
const DonorModel = require('./donor.model');

class service {
	findEligibleDonors(group, address, name, gender, donorids, limit, start) {
		if (!donorids) {
			donorids = [];
		}
		let query = {};
		if (group) {
			query = {
				blood_group: group,
			};
		}

		if (group && address) {
			const regex = new RegExp(TextUtils.escapeRegex(address), 'gi');
			query = {
				blood_group: group,
				address: {
					$regex: regex,
				},
			};
		}

		if (group && name) {
			const regex = new RegExp(TextUtils.escapeRegex(name), 'gi');
			query = {
				blood_group: group,
				name: {
					$regex: regex,
				},
			};
		}

		if (group && gender) {
			const regex = new RegExp(TextUtils.escapeRegex(gender), 'gi');
			query = {
				blood_group: group,
				gender: {
					$regex: regex,
				},
			};
		}

		const mainIds = [];
		const newArray = Array.prototype.concat.apply([], donorids);
		for (let j = 0; j <= newArray.length; j++) {
			mainIds.push(ObjectId(newArray[j]));
		}

		return new Promise((resolve, reject) => {
			DonorModel.aggregate([
				{ $match: { _id: { $nin: mainIds } } },
				{
					$project: {
						name: 1,
						address: 1,
						phone: 1,
						email: 1,
						age: 1,
						gender: 1,
						dob: 1,
						blood_group: {
							$concat: ['$blood_info.group', '$blood_info.rh_factor'],
						},
						blood_info: 1,
						last_donated_date: 1,
						geo_location: 1,
						updated_at: 1,
						created_at: 1,
						donations_total: {
							$size: '$donations',
						},
					},
				},
				{
					$match: query,
				},
				{
					$sort: {
						name: 1,
					},
				},
				{
					$facet: {
						data: [
							{
								$skip: start,
							},
							{
								$limit: limit,
							},
						],
						summary: [
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
			])
				.then(d => {
					if (d[0].summary.length > 0) {
						resolve({
							total: d[0].summary[0].count,
							limit,
							data: d[0].data,
						});
					} else {
						resolve({
							total: 0,
							limit,
							data: [],
						});
					}
				})
				.catch(e => reject(e));
		});
	}
}

module.exports = new service();
