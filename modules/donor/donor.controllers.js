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
	async add(payload) {
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

	async addSingleVerified(payload) {
		let donor = null;
		let teams;
		const bloodGroupArr = ['A', 'B', 'AB', 'O', 'a', 'b', 'ab', 'o'];
		const rhArr = ['+', '-'];
		if (payload.team) {
			const org_detail = await TeamController.getByName(payload.team);
			const hamrolifebank_team_detail = await TeamController.getByName('Hamro LifeBank Donors Club');

			teams = org_detail.length > 0 ? ObjectId(org_detail[0]._id) : ObjectId(hamrolifebank_team_detail[0]._id);
		}

		payload.blood_group = payload.blood_group || null;
		if (typeof payload.blood_group === 'string') {
			const blood_info = splitBloodInfo(payload.blood_group);
			if (bloodGroupArr.includes(blood_info.group)) {
				delete payload.blood_group;
				payload.blood_info = blood_info;
			} else {
				throw payload;
			}
		} else if (!payload.blood_group) {
			throw payload;
			// delete payload.blood_group;
		} else if (bloodGroupArr.includes(blood_info.group) && rhArr.includes(blood_info.rh_factor)) {
			payload.blood_info = payload.blood_group;
			delete payload.blood_group;
		} else {
			throw payload;
		}

		const donor_data = await DonorModel.find({ phone: payload.phone });

		if (donor_data[0] && donor_data[0]._id) {
			donor = await this.updateVerified(ObjectId(donor_data[0]._id), payload);
			donor = donor.toJSON();
			donor.is_updated = true;
		} else {
			donor = await DonorModel.create(payload);
			donor = donor.toJSON();
			donor.is_updated = false;
		}

		if (teams !== null) {
			await this.addTeam({ donor_id: donor._id, teams });
		}

		if (!payload.is_report) return donor;
		if (donor.is_updated == true) {
			throw donor;
		} else {
			return donor;
		}
	},

	updateDonationLegacy(id) {
		DonorModel.updateOne(id, { $addToSet: { donations_legacy: new Date() } }, { new: true });
	},

	async checkBloodVerification(donorID) {
		// let blood_info = splitBloodInfo(blood_group);
		const donor = await DonorModel.findById(donorID);
		return !!donor.blood_info.is_verified;
	},

	async checkDonorVerificationByPhone(phone) {
		const donor = await DonorModel.find({ phone });
		return donor;
	},

	addTeam({ donor_id, teams }) {
		return DonorModel.findByIdAndUpdate(donor_id, { $addToSet: { teams } }, { new: true });
	},

	async getAgeRangeByTeam(id) {
		const donor = await DonorModel.aggregate([
			{
				$match: {
					teams: ObjectId(id),
				},
			},
		]);
		return donor;
	},

	save(payload) {
		if (payload.id) return this.update(payload.id, payload);
		return this.add(payload);
	},

	async getByUserId(userId) {
		const donor = await DonorModel.findOne({
			user_id: userId,
		});
		return donor;
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

		return DonorModel.findOneAndUpdate(
			{ _id: ObjectId(id) },
			payload.last_donated_date
				? { $addToSet: { donations_legacy: payload.last_donated_date }, $set: payload }
				: { $set: payload },
			{ new: true },
		);
	},

	async updateVerified(id, payload) {
		if (await this.checkBloodVerification(id)) {
			delete payload.blood_group;
		}

		payload.updated_by = ObjectId(`${payload.updated_by}`);
		return DonorModel.findOneAndUpdate({ _id: ObjectId(id) }, { payload }, { new: true });
	},

	async removeDonation(donorId, donationId) {
		const donor = await DonorModel.findById(donorId);
		const donations = donor.donations.filter(d => d.donation_id != donationId);
		const latest = _.maxBy(donations, o => o.date);
		donor.set({
			last_donated_date: latest.date,
			donations,
		});
		await donor.save();
		return donations;
	},

	async addDonation(donorId, donation) {
		donation.donation_id = mongoose.Types.ObjectId();
		if (!donation.date) {
			donation.date = new Date();
		} else {
			donation.date = new Date(donation.date);
		}
		if (moment().diff(moment(donation.date), 'days') < 0) throw ERR.DATE_FUTURE;

		const donor = await DonorModel.findById(donorId);
		const donations = donor.donations.concat(donation);
		const latest = _.maxBy(donations, o => o.date);
		donor.set({
			last_donated_date: latest.date,
			donations,
		});
		await donor.save();

		return donations;
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

	removeTeam({ team_id, donor_id }) {
		const payload = { teams: team_id };
		return DonorModel.findByIdAndUpdate(donor_id, { $pull: payload }, { new: true, password: 0 });
	},

	async listTeamDonors({ id, limit, start, name, group }) {
		let regex;
		if (name === null) {
			regex = '';
		} else {
			regex = new RegExp(TextUtils.escapeRegex(name), 'gi');
		}
		let matchfield = {};
		if (group) {
			matchfield = { blood_group: group };
		}
		const teamId = ObjectId(id);
		return DataUtils.paging({
			limit,
			start,
			sort: { created_at: -1 },
			model: DonorModel,
			query: [
				{
					$match: { teams: teamId },
				},
				{
					$match: {
						name: { $regex: regex },
					},
				},
				{ $match: {} },
				{
					$project: {
						name: 1,
						phone: 1,
						email: 1,
						blood_info: 1,
						blood_group: {
							$concat: ['$blood_info.group', '$blood_info.rh_factor'],
						},
						created_at: 1,
						updated_at: 1,
					},
				},
				{
					$match: matchfield,
				},
			],
		});
	},

	dispatch({ group, address, name, gender, donorids, limit, start }) {
		return DonorService.findEligibleDonors(group, address, name, gender, donorids, limit, start);
	},

	async addDonation(donorId, donation) {
		donation.donation_id = mongoose.Types.ObjectId();
		if (!donation.date) {
			donation.date = new Date();
		} else {
			donation.date = new Date(donation.date);
		}
		if (moment().diff(moment(donation.date), 'days') < 0) throw ERR.DATE_FUTURE;

		const donor = await DonorModel.findById(donorId);
		const donations = donor.donations.concat(donation);
		const latest = _.maxBy(donations, o => o.date);
		donor.set({
			last_donated_date: latest.date,
			donations,
		});
		await donor.save();

		return donations;
	},

	async removeDonation(donorId, donationId) {
		const donor = await DonorModel.findById(donorId);
		const donations = donor.donations.filter(d => d.donation_id != donationId);
		const latest = _.maxBy(donations, o => o.date);
		donor.set({
			last_donated_date: latest.date,
			donations,
		});
		await donor.save();
		return donations;
	},
};

module.exports = {
	Donor,
	add: req => Donor.add(req.payload),
	addSingleVerified: req => {
		const geo_location = {
			longitude: req.body.longitude || null,
			latitude: req.body.latitude || null,
		};
		const created_by = req.tokenData.user_id;
		const updated_by = req.tokenData.user_id;
		const body = {
			...req.payload,
			created_by,
			updated_by,
			geo_location,
		};
		return Donor.addSingleVerified(body);
	},
	list: req => {
		const { query } = req;
		const single = query.single || false;
		const start = query.start || 0;
		const limit = query.limit || 20;
		const group = query.group || null;
		const name = query.name || null;
		const phone = query.phone || null;
		const address = query.address || null;
		const gender = query.gender || null;

		if (single) {
			const results = {};
			if (phone) return Donor.getByPhone(phone);
			return results;
		}
		return Donor.list({
			query,
			start,
			limit,
			group,
			name,
			phone,
			address,
			gender,
		});
	},
	getById: req => Donor.get(req.params.id),
	getByPhone: req => Donor.getByPhone(req.query.phone),
	getByName: req => Donor.getByName(req.query.name),
	update: req => Donor.update(req.params.id, req.payload),
	remove: req => Donor.remove(req.params.id),
	addDonation: req => Donor.addDonation(req.params.id, req.payload),
	removeDonation: req => Donor.removeDonation(req.params.id.req.payload.donation_id),
	dispatch: req => {
		const limit = parseInt(req.payload.limit) || 25;
		const start = parseInt(req.payload.start) || 0;
		const group = req.payload.group || null;
		const address = req.payload.address || null;
		const name = req.body.payload || null;
		const gender = req.payload.gender || null;
		const donorids = req.payload.ids;
		return Donor.dispatch({
			group,
			address,
			name,
			gender,
			donorids,
			limit,
			start,
		});
	},
};
