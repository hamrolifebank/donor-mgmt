const config = require('config');

const axios = require('axios');

const smsApi = config.get('services.sparrow_sms.url');
const token = config.get('services.sparrow_sms.token');
const handlebars = require('handlebars');

const SmsStatus = config.get('services.sparrow_sms.active');
const fs = require('fs');

const Templates = {
	create_user: {
		from: 'KrishiPath',
		html: `${__dirname}/../../assets/sms_templates/create_user.html`
	},
	forgot: {
		from: 'KrishiPath',
		html: `${__dirname}/../../assets/sms_templates/forgot.html`
	},
	reset_password: {
		from: 'KrishiPath',
		html: `${__dirname}/../../assets/sms_templates/reset_password.html`
	},
	meteorological_report: {
		from: 'KrishiPath',
		html: `${__dirname}/../../assets/sms_templates/meteorological_report.html`
	},
	product_added: {
		from: 'KrishiPath',
		html: `${__dirname}/../../assets/sms_templates/product_added.html`
	},
	request_added: {
		from: 'KrishiPath',
		html: `${__dirname}/../../assets/sms_templates/request_added.html`
	},
	order_added: {
		from: 'KrishiPath',
		html: `${__dirname}/../../assets/sms_templates/order_added.html`
	}
};

class SMS {
	constructor() {}

	getTemplate(name) {
		return Templates[name];
	}

	getHtmlBody(name, data) {
		const template = this.getTemplate(name);
		if (!template) return null;

		const text = fs.readFileSync(template.html, { encoding: 'utf-8' });
		const hTemplate = handlebars.compile(text);
		return hTemplate(data);
	}

	async send(payload) {
		const me = this;
		const template = this.getTemplate(payload.template);
		if (!template) throw new Error('No template is defined');
		if (!payload.to) throw new Error('No receipent was specified');
		if (SmsStatus) {
			await axios.post(smsApi, {
				params: {
					token,
					from: template.from,
					to: payload.to,
					text: me.getHtmlBody(payload.template, payload.data)
				}
			});
		}
	}
}

module.exports = new SMS();
