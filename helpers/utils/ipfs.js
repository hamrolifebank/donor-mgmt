const IPFS = require('ipfs-http-client');
const config = require('config');
// const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
const ipfs = new IPFS({ host: config.get('services.ipfs.gateway'), port: 5001, protocol: 'http' });

module.exports = ipfs;
