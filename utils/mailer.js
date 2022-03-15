const nodemailer = require("nodemailer");
const config = require("config");
const handleBars = require("handlebars");
const fs = require("fs");
const transporter = nodemailer.createTransport(config.get("services.nodemailer"));

const TEMPLATES = {
  EVENT_SHARE: {
    from: '"Hamro LifeBank Team" <team@hamrolifebank.com>',
    subject: "Event Details",
    html: __dirname + "/../public/email_templates/share_event.htm"
  },
  REGISTER_EVENT: {
    from: '"Hamro LifeBank Team" <team@hamrolifebank.com>',
    subject: "Thank you for registering to donate blood",
    html: __dirname + "/../public/email_templates/event_register.htm"
  },
  SIGNUP_CREDENTIALS: {
    from: '"Hamro LifeBank Team" <team@hamrolifebank.com>',
    subject: "Your credentials to login for Donation app",
    html: __dirname + "/../public/email_templates/signup.html"
  }
};

const SendMail = ({ to, data, template }) => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      template.html,
      {
        encoding: "utf-8"
      },
      function(err, html) {
        if (err) reject(err);
        var hTemplate = handleBars.compile(html);
        var htmlToSend = hTemplate(data);

        if (data.subject) {
          template.subject = data.subject;
        }

        transporter
          .sendMail({
            from: template.from,
            subject: template.subject,
            to,
            html: htmlToSend
          })
          .then(d => resolve(d))
          .catch(e => reject(e));
      }
    );
  });
};

module.exports = {
  TEMPLATES,
  SendMail
};
