const validators = require('./user.validators');
const controllers = require('./user.controllers');

const routes = {
	login: ['POST', '', 'Login using username and password'],
	auth: ['get', '', 'Get the token data']
};

/**
 * Register the routes
 * @param {object} app Application.
 */
function register(app) {
	app.register({
		name: 'auth',
		routes,
		validators,
		controllers
	});
}

module.exports = register;
