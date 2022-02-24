const validators = require('./user.validators');
const controllers = require('./user.controllers');
const { USER } = require('../../constants/permissions');

const routes = {
	add: ['POST', '', 'Add a new user', [USER.WRITE, USER.ADMIN]],
	list: ['GET', '', 'List all users', [USER.READ, USER.ADMIN]],
	login: ['POST', '/login', 'Login using username and password'],
	register: ['POST', '/register', 'Register new User'],
	findById: ['GET', '/{id}', 'Find a user by id', [USER.READ, USER.ADMIN]],
	update: ['POST', '/{id}', 'Update user data', [USER.WRITE, USER.ADMIN]],
	updateStatus: ['PATCH', '/{id}/status', 'Make user active or inactive', [USER.WRITE, USER.ADMIN]],
	addRoles: ['PATCH', '/{id}/roles', 'Add roles to a user', [USER.WRITE, USER.ADMIN]],
	removeRoles: ['DELETE', '/{id}/roles', 'Remove roles from user', [USER.WRITE, USER.ADMIN]],
	forgotPassword: ['POST', '/forgot_password', 'Forgot Password'],
	verifyResetToken: ['GET', '/password_reset/{token}', 'Verify Token'],
	resetPassword: ['POST', '/{id}/reset_password', 'Reset Password'],
	changePassword: ['POST', '/{id}/change_password', 'Change Password'],
};

/**
 * Register the routes
 * @param {object} app Application.
 */
function register(app) {
	app.register({
		name: 'users',
		routes,
		validators,
		controllers,
	});
}

module.exports = register;
