const validators = require('./event.validators');
const controllers = require('./event.controllers');

const routes = {
	add: ['POST', '', 'Add event'],
	list: ['GET', '', 'List all events'],
	getById: ['GET', '/{eventId}', 'Get event by ID'],
	createAndSendCertificates: ['GET', '/{eventId}/certificates', 'Create and send certificates'],
	update: ['PUT', '/{eventId}', 'Update an Event'],
	getEventUsers: ['GET', '/{eventId}/users', 'Get users registered to an event'],
	addEventUsers: ['POST', '/{eventId}/users', 'Add users to an event'],
	inviteUsers: ['POST', '/{eventId}/invite', 'Invite users to an event'],
	listEventWithDetails: ['GET', '/{eventId}/donors', 'Get event details'],
	getRegisterOption: ['GET', '/{eventId}/register', 'Get register options'],
	register: ['POST', '/{id}/register', 'Register anyone to an event'],
	unregister: ['POST', '/{id}/unregister', 'Un-Register user from an event'],
	check: ['GET', '/{eventId}/check', 'Check bloodbag or tubeID'],
};

/**
 * Register the routes
 * @param {object} app Application.
 */
function register(app) {
	app.register({
		name: 'events',
		routes,
		validators,
		controllers,
	});
}

module.exports = register;
