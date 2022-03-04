const ethers = require('ethers');
const config = require('config');
const { User, Role } = require('../../modules');
const { ERR } = require('./error');

const CheckSignature = async (data, signature) => ethers.utils.verifyMessage(data, signature);

const checkValidUser = async walletAddress => {
	const user = await User.getByWallet(walletAddress);
	return user;
};

const checkPermissions = (user_perm, access_perm) => user_perm.some(v => access_perm.indexOf(v) !== -1);

const checkUserPermissions = async ({ user, routePermissions }) => {
	const roles = { user };

	if (!roles || !roles.length) throw ERR.UNAUTHORIZED;
	let userPermissions = [];

	userPermissions = await Promise.all(
		roles.map(async role => {
			const rolePermissions = await Role.getUserPermsInternal(role);
			return [...rolePermissions];
		}),
	);
	userPermissions = [].concat(...userPermissions);

	const hasPerms = checkPermissions(userPermissions, routePermissions);
	return hasPerms;
};

const CheckAuthSignature = async req => {
	const signatureWithData = req.headers.auth_signature;
	if (!signatureWithData) throw ERR.AUTH_SIGNATURE_NO_DATA;
	const [data, signature] = signatureWithData.split('.');

	const dateDiff = parseInt(Date.now() / 1000 - parseInt(data));
	if (dateDiff > config.get('app.signatureValidityMinutes')) throw ERR.SIGNATURE_EXPIRED;

	const address = await CheckSignature(data, signature);
	const user = await checkValidUser(address);
	console.log('address:', address, 'user:', user);
	if (!user) throw ERR.AUTH_FAIL;

	return { address, user };
};

const CheckDataSignature = async req => {
	const signatureWithData = req.headers.data_signature;
	if (!signatureWithData) throw ERR.DATA_SIGNATURE_NO_DATA;
	const [data, signature] = signatureWithData.split('.');

	const address = await CheckSignature(data, signature);
	const user = await checkValidUser(address);
	if (!user) throw ERR.AUTH_FAIL;

	return { address, user };
};

const handleSecureRequest = async (routePermissions, req) => {
	console.log('SECURE req payload', req.payload);

	if (routePermissions.length === 0) return true;

	let authSignDigest;
	let dataSignDigest;
	let isAllowed = false;

	if (req.method === 'get' || req.method === 'delete') {
		authSignDigest = await CheckAuthSignature(req);
		isAllowed = await checkUserPermissions({ user: authSignDigest.user, routePermissions });
		req.currentUser = authSignDigest.address;
		return isAllowed;
	}

	authSignDigest = await CheckAuthSignature(req);
	dataSignDigest = await CheckDataSignature(req);
	if (authSignDigest.address !== dataSignDigest.address) throw ERR.SIGNATURE_NO_MATCH;
	isAllowed = await checkUserPermissions({ user: authSignDigest.user, routePermissions });
	req.currentUser = authSignDigest.address;
	return isAllowed;
};

const Secure = async (routePermissions, req) => handleSecureRequest(routePermissions, req);

module.exports = Secure;
