const auth = require('./user/auth.routes');
const role = require('./user/role.routes');
const user = require('./user/user.routes');
const donor = require('./donor/donor.routes');
const event = require('./events/event.routes');
const organization = require('./organization/organization.routes');

module.exports = {
	auth,
	role,
	user,
	donor,
	event,
	organization,
};
