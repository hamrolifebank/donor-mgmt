const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('mongoose').Types;

const DonorModel = require('./donor.model');

const splitBloodInfo = blood_info => {
	let rh_factor = blood_info.match(/\+|-/);
	rh_factor = rh_factor[0].toString();
	const group = blood_info.replace(/\+|-/, '');
	return (blood_info = {
		group,
		rh_factor,
	});
};

const Donor = {
	async add() {
		let donor = null;
		const teams = payload.team ? ObjectId(payload.team) : null;

		payload.blood_group = payload.blood_group || null;
		if (typeof payload.blood_group === 'string') {
			const blood_info = splitBloodInfo(payload.blood_group);
			delete payload.blood_group;
			payload.blood_info = blood_info;
		} else if (!payload.blood_group) {
			delete payload.blood_group;
		} else {
			payload.blood_info = payload.blood_group;
			delete payload.blood_group;
		}

		if (payload.id) {
			donor = await this.update(payload.id, payload);
		} else {
			const obj = new DonorModel(payload);
			donor = await obj.save();
		}

		return this.addTeam({ teams, donor_id: donor._id });
	},
	async update(id, payload) {
		if (await this.checkBloodVerification(id)) {
			delete payload.blood_group;
		}
		payload.updated_by = ObjectId(`${payload.updated_by}`);
		payload.blood_group = payload.blood_group ? payload.blood_group : null;
		if (!payload.blood_info) {
			if (typeof payload.blood_group === 'string') {
				const blood_info = splitBloodInfo(payload.blood_group);
				delete payload.blood_group;
				payload.blood_info = blood_info;
			} else if (!payload.blood_group) {
				delete payload.blood_group;
			} else {
				payload.blood_info = payload.blood_group;
				delete payload.blood_group;
			}
		}

		payload.blood_group = payload.blood_info.group + payload.blood_info.rh_factor;
		return DonorModel.findOneAndUpdate(
			{ _id: ObjectId(id) },
			{ $addToSet: { donations_legacy: payload.last_donated_date }, $set: payload },
			{ new: true },
		);
	},

	async get(id) {
		return DonorModel.findById(id);
	},

	getByPhone(phone) {
		return DonorModel.findOne({ phone });
	},

	getByName(name) {
		return DonorModel.findOne({ name });
	},

	remove(id) {
		return new Promise((resolve, reject) => {
			DonorModel.remove({
				_id: id,
			})
				.then(d => resolve(d))
				.catch(e => reject(e));
		});
	},

	async list({ limit, start, group, phone, name, address, gender }) {
		const page = parseInt(start) / parseInt(limit) + 1;
		let query = {};
		if (group) {
			query = {
				blood_group: group,
			};
		}
		// query.blood_info = { group: group.split(/([-+])/g)[0], rh_factor: group.split(/([-+])/g)[1] };
		if (phone) query.phone = new RegExp(TextUtils.escapeRegex(phone), 'gi');
		if (name) query.name = new RegExp(TextUtils.escapeRegex(name), 'gi');
		if (address) query.address = new RegExp(TextUtils.escapeRegex(address), 'gi');
		if (gender) query.gender = new RegExp(TextUtils.escapeRegex(gender), 'gi');

		return new Promise((resolve, reject) => {
			DonorModel.aggregate([
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
						last_contacted_date: 1,
						donations_legacy: 1,
						geo_location: 1,
						updated_at: 1,
						created_at: 1,
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
							// start,
							// page
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
	},
};

module.exports = {
	Donor,
	add: req => Donor.add(req.payload),
	list: req => Donor.list(req.query),
	get: req => Donor.get(req.params.id),
	findByPhone: req => Donor.getByPhone(req.query.phone),
	findByName: req => Donor.getByName(req.query.name),
	update: req => Donor.update(req.params.id, req.payload),
	remove: req => Donor.remove(req.params.id),
};
