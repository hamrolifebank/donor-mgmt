const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('mongoose').Types;
const slugify = require('slugify');
const { TextUtils, ERR } = require('../../utils');
const { SendMail, TEMPLATES } = require('../../utils/mailer');

const EventModel = require('./event.model');
const ConsentModel = require('../donor/consent.model');
const UserController = require('../user/user.controllers');
const DonorController = require('../donor/donor.controllers');
const ConsentController = require('../donor/consent.controller');

const splitBloodInfo = blood_info => {
	let rh_factor = blood_info.match(/\+|-/);
	rh_factor = rh_factor[0].toString();
	const group = blood_info.replace(/\+|-/, '');
	return (blood_info = {
		group,
		rh_factor,
	});
};

const Event = {
	async add(payload, options) {
		const slug = slugify(moment(payload.date).format('YYYY-MM-DD-') + payload.name, {
			remove: /[*+~.()'"#!:@]/g,
			replacement: '-',
			lower: true,
		});
		Object.assign(payload, {
			slug,
			owner: options.currentUser,
			created_by: options.currentUser,
			updated_by: options.currentUser,
			team: payload.team,
		});
		const event = new EventModel(payload);
		return event.save();
	},

	list({ limit, start, search = null, org_id }) {
		let query = {};
		if (search) {
			const regex = new RegExp(TextUtils.escapeRegex(search), 'gi');
			query = {
				name: {
					$regex: regex,
				},
			};
		}

		if (org_id) {
			query.beneficiary = org_id;
		}

		const page = parseInt(start) / parseInt(limit) + 1;

		let total;
		return new Promise((resolve, reject) => {
			EventModel.count(query)
				.then(c => (total = c))
				.then(d => EventModel.find(query).populate('beneficiary').skip(start).limit(limit).sort({ date: -1 }))
				.then(events =>
					resolve({
						total,
						limit,
						start,
						page,
						data: events,
					}),
				)
				.catch(e => reject(e));
		});
	},

	getById(eventId) {
		return EventModel.findById(eventId);
	},

	async createAndSendCertificates(eventId) {
		const event = await this.get(eventId);
		if (!event) throw new Error('Event does not exist.');

		const consents = await ConsentController.listByEvent(eventId, true);
		const data = [];
		consents.forEach(c => {
			if (c.is_completed && !c.certificate) {
				data.push({
					consentId: c._id,
					name: c.donor.name,
					email: c.donor.email || 'noemail',
					date: moment(event.date).format('D MMM YYYY'),
					webhook: `${appUrl}/api/v1/consents/${c._id}/certificate`,
				});
			}
		});

		if (data.length) {
			try {
				const res = await HulaakService.createAndSendCertificates(data);
				await ConsentController.setCertificateProcessing(data.map(d => d.consentId));
				return res.data;
			} catch (e) {
				return e.response.data.message;
			}
		}
		return [];
	},

	update(eventId, payload) {
		EventModel.findByIdAndUpdate(
			{
				_id: eventId,
			},
			{
				$set: payload,
			},
			{
				new: true,
			},
		)
			.then(d => d)
			.catch(e => e);
	},

	async getEventUsers(eventId) {
		const event = await EventModel.findById(eventId)
			.populate('owner', { password: 0 })
			.populate('acl.user', { password: 0 });
		const acl = _.clone(event.acl);
		acl.push({ eventRole: 'owner', user: event.owner });
		return acl;
	},

	async addEventUsers(eventId, userId, eventRole) {
		if (eventRole != 'admin' && eventRole != 'editor') eventRole = 'reader';
		const event = await EventModel.findById(eventId);
		if (!event) throw ERR.EVENT_NOEXISTS;

		if (event.owner.toString() == userId) return event;

		const acl = _.clone(event.acl);
		let user = _.remove(acl, a => a.user.toString() == userId);

		if (user.length > 0) {
			user = user[0];
			if (user.user.toString() == event.owner.toString() || user.eventRole == eventRole) {
				acl.push(user);
				event.acl = acl;
				return event;
			}
		}
		user = { user: userId, eventRole };
		acl.push(user);
		event.acl = acl;
		return event.save();
	},

	async inviteUsers(eventId, payload) {
		let user = await UserController.getByUsername(payload.email);
		if (!user) {
			user = await UserController.createUsingEmail({
				name: payload.name,
				email: payload.email,
			});
		}
		if (!user) throw ERR.USER_NOEXISTS;
		return this.addUser(eventId, user._id, payload.eventRole);
		// TODO link data and send email
	},

	async getRegisterOption({ eventId, user_id }) {
		const currentEventVerification = await this.checkCurrentEvent(eventId);
		if (!currentEventVerification) return false;
		const userRegisterCheck = await this.checkUserRegistered(eventId, user_id);
		if (userRegisterCheck) return false;
		return true;
	},
	async checkUserRegistered(eventId, userId) {
		const user = await UserController.getLean(userId);
		if (!user) return null;
		if (!user.donor) return null;
		const consent = await ConsentModel.findOne({ event: eventId, donor: user.donor });
		if (!consent) return null;
		return user;
	},
	async checkCurrentEvent(eventId) {
		const eventTeam = await TeamModel.findOne({ current_event: ObjectId(eventId) });
		if (!eventTeam) return false;
		if (moment(eventTeam.current_event).diff(moment(), 's') >= 0) return false;
		return true;
	},

	async checkEventValid(eventId) {
		const event = await this.getById(eventId);
		if (moment(event.date).isAfter() || moment(event.date).isSame()) return true;
		return false;
	},

	async checkEventExists(eventId) {
		const event = await Event.getById(eventId);
		if (!event) return false;
		return true;
	},

	async checkUserRegisteredToEvent({ userId, eventId }) {
		const donor = await DonorController.Donor.getByUserId(userId);
		if (!donor.event) return false;
		if (donor.event == eventId) return true;
		return false;
	},

	async register(eventId, payload) {
		try {
			if (!(await this.checkEventExists(eventId))) throw ERR.EVENT_NOEXISTS;
			if (!(await this.checkEventValid(eventId))) throw ERR.EVENT_EXPIRED;
			if (await this.checkUserRegisteredToEvent({ eventId, userId: payload.userId })) {
				throw ERR.EVENT_ALREADY_REGISTERED;
			}

			const donor = await DonorController.Donor.getByUserId(payload.userId);
			const updateFields = {
				event: eventId,
				updated_by: payload.userId,
			};

			const updatedDonor = await DonorController.Donor.update(donor._id, updateFields);
			return updatedDonor;
		} catch (e) {
			throw e;
		}
	},

	async checkBloodBagExists({ bag_number, event_id }) {
		let regex = '';
		if (bag_number) {
			regex = new RegExp(TextUtils.escapeRegex(bag_number), 'gi');
		} else {
			return false;
		}
		const bloodBagVerification = await ConsentModel.aggregate([
			{
				$match: {
					event: ObjectId(event_id),
				},
			},
			{
				$match: {
					'blood_info.bag_number': { $regex: regex },
				},
			},
		]);
		return !!bloodBagVerification.length;
	},
	async checkTubeIdExists({ tube_id, event_id }) {
		let query = {};
		tube_id = tube_id || null;
		if (tube_id) {
			query = {
				'blood_info.tube_id': tube_id,
			};
		} else {
			return false;
		}

		const tubeIdVerification = await ConsentModel.aggregate([
			{
				$match: {
					event: ObjectId(event_id),
				},
			},
			{
				$match: query,
			},
		]);

		return !!tubeIdVerification.length;
	},
};

module.exports = {
	Event,
	add: req => Event.add(req.payload, req.tokenData),
	list: req => Event.list(req.query),
	getById: req => Event.getById(req.params.EventId),
	createAndSendCertificates: req => {
		const { action } = req.query;
		if (action === 'generate') Event.createAndSendCertificates(req.params.eventId);
		else return { message: 'Not implemented. Send action...' };
	},
	update: req => {
		const created_by = req.tokenData.user_id;
		const updated_by = req.tokenData.User_id;
		const payload = {
			...req.payload,
			created_by,
			updated_by,
		};
		return Event.update(req.params.eventId, payload);
	},
	getEventUsers: req => Event.getEventUsers(req.params.id),
	addEventUsers: req => Event.addEventUsers(req.params.id, req.payload.user_id, req.payload.event_role),
	inviteUsers: req => Event.inviteUsers(req.params.eventId, req.payload),
	listEventWithDetails: req => {
		const limit = parseInt(req.query.limit) || 20;
		const start = parseInt(req.query.start) || 0;
		const search = req.query.search || null;
		const isComplete = req.query.is_complete == 'true' || false;
		const { eventId } = req.params;
		return ConsentController.listByEventWithDetails({
			limit,
			start,
			search,
			eventId,
			isComplete,
		});
	},
	getRegisterOption: req => Event.getRegisterOption({ eventId: req.params.id, user_id: req.tokenData.user_id }),
	register: req => Event.register(req.params.id, req.payload),
	check: async req => {
		let result = false;
		const event_id = req.params.id;
		if (!req.query.for) {
			result = false;
		} else if (req.query.for == 'bloodbag') {
			const bag_number = req.query.bag_no == 'undefined' ? null : req.query.bag_no;
			result = await Event.checkBloodBagExists({
				bag_number,
				event_id,
			});
		} else if (req.query.for == 'tubeid') {
			const tube_id = req.query.tube_id == 'undefined' ? null : req.query.tube_id;
			result = await Event.checkTubeIdExists({
				tube_id,
				event_id,
			});
		}
		return result;
	},
};
