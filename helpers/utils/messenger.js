const nodemailer = require('nodemailer');
const config = require('config');

const host_url = config.get('app.url');
const handlebars = require('handlebars');
const fs = require('fs');

const transporter = nodemailer.createTransport(config.get('services.nodemailer'));

handlebars.registerHelper('host_url', () => host_url);

const Templates = {
	create_user: {
		from: '"ICT4D" <no-reply@rumsan.com>',
		subject: 'Welcome to ICT4D',
		html: `${__dirname}/../../assets/email_templates/create_user.html`,
	},
	forgot: {
		from: '"ICT4D" <no-reply@rumsan.com>',
		subject: 'Recover Forgot Password',
		html: `${__dirname}/../../assets/email_templates/forgot.html`,
	},
	reset_password: {
		from: '"ICT4D" <no-reply@rumsan.com>',
		subject: 'Reset Password',
		html: `${__dirname}/../../assets/email_templates/reset_password.html`,
	},
	meteorological_report: {
		from: '"ICT4D" <no-reply@rumsan.com>',
		subject: 'Meteorological Report',
		html: `${__dirname}/../../assets/email_templates/meteorological_report.html`,
	},
	product_added: {
		from: '"ICT4D" <no-reply@rumsan.com>',
		subject: 'New Product Added',
		html: `${__dirname}/../../assets/email_templates/product_added.html`,
	},
	request_added: {
		from: '"ICT4D" <no-reply@rumsan.com>',
		subject: 'New Request Added',
		html: `${__dirname}/../../assets/email_templates/request_added.html`,
	},
	order_added: {
		from: '"ICT4D" <no-reply@rumsan.com>',
		subject: 'You have received an order',
		html: `${__dirname}/../../assets/email_templates/order_added.html`,
	},
	SEND_OTP: {
		from: '"Hamro LifeBank Team" <team@hamrolifebank.com>',
		subject: 'OTP verification',
		html: `${__dirname}/../../public/email_templates/send_otp.html`,
	},
	SEND_PNEUMONICS: {
		from: '"Hamro LifeBank Team" <team@hamrolifebank.com>',
		subject: 'Backup Passcode',
		html: `${__dirname}/../../public/email_templates/send_pneumonics.html`,
	},
};

class Messenger {
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

		if (payload.subject) {
			template.subject = payload.subject;
		}
		return transporter.sendMail({
			from: template.from,
			subject: template.subject,
			to: payload.to,
			html: me.getHtmlBody(payload.template, payload.data),
		});
	}

	checkNotifyMethod(data) {
		if (data.email) return 'email';
		return 'sms';
	}

	async sendOtp({ email, otp, template: templateName, otpValidTime }) {
		try {
			const me = this;
			const template = this.getTemplate(templateName);
			if (!template) throw new Error('No template is defined');
			if (!email) throw new Error('No receipent was specified');

			const mailOptions = {
				from: template.from,
				subject: 'OTP Verification',
				to: email,
				html: me.getHtmlBody(templateName, { otp, otpValidTime }),
			};
			await transporter.sendMail(mailOptions);
			return 'Email sent successfully!';
		} catch (e) {
			return e;
		}
	}

	async sendPneumonics({ email, pneumonics, template: templateName }) {
		try {
			const me = this;
			const template = this.getTemplate(templateName);
			if (!template) throw new Error('No template is defined');
			if (!email) throw new Error('No receipent was specified');

			const mailOptions = {
				from: template.from,
				subject: 'Backup Passcode for HLB Donation App',
				to: email,
				html: me.getHtmlBody(templateName, { pneumonics }),
			};
			await transporter.sendMail(mailOptions);
			return 'Email sent successfully!';
		} catch (e) {
			return e;
		}
	}
}

module.exports = new Messenger();
