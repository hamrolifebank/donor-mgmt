const { Role } = require('./user/role.controllers');
const { User } = require('./user/user.controllers');
const { Donor } = require('./donor/donor.controllers');
const { Event } = require('./events/event.controllers');
const { Organization } = require('./organization/organization.controllers');

module.exports = {
	Role,
	User,
	Donor,
	Event,
	Organization,
};
