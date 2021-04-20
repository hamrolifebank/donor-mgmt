class PatientException extends Error {
	constructor(message) {
		super();
		this.message = message;
		this.code = 400;
		this.name = 'patientException';
	}
}

module.exports = PatientException;
