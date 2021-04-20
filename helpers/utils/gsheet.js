const { GoogleSpreadsheet } = require('google-spreadsheet');
const config = require('config');

const credsPath = '../../config/gsheet.json';

class GSheet {
	async getLiveStock() {
		this.doc = new GoogleSpreadsheet(config.get('services.gsheet.liveStock'));
		this.doc.useServiceAccountAuth(require(credsPath));
		await this.doc.loadInfo();
		const sheet = this.doc.sheetsByIndex[4];
		await sheet.loadHeaderRow();
		const rows = await sheet.getRows();
		const data = [];
		rows.map(el => {
			const objData = {};
			const len = data.length;
			objData.name = el.Livestock ? el.Livestock : '';
			objData.parasiteMgmt = [
				{
					internal: el.Internal || '',
					external: el.External || '',
					preventiveMeasure: el['Preventive measures'] || ''
				}
			];
			if (objData.name === '') {
				data[len - 1].parasiteMgmt.push({
					internal: el.Internal || '',
					external: el.External || '',
					preventiveMeasure: el['Preventive measures'] || ''
				});
			}
			objData.diseaseMgmt = [
				{
					diseaseName: el.Disease || '',
					symptoms: el.Symptom || '',
					preventiveMeasure: el['Preventive and control measures'] || ''
				}
			];
			if (objData.name === '') {
				data[len - 1].diseaseMgmt.push({
					diseaseName: el.Disease || '',
					symptoms: el.Symptom || '',
					preventiveMeasure: el['Preventive and control measures'] || ''
				});
			}
			objData.specialPractices = [
				{
					vaccine: el.Vaccine || '',
					deworming: el.Deworming || '',
					others: el.Others || ''
				}
			];
			if (objData.name === '') {
				data[len - 1].specialPractices.push({
					vaccine: el.Vaccine || '',
					deworming: el.Deworming || '',
					others: el.Others || ''
				});
			}
			data.push(objData);
		});
		const filteredData = data.filter(el => el.name !== '');
		return filteredData;
	}

	async getCropCalendar() {
		this.doc = new GoogleSpreadsheet(config.get('services.gsheet.cc'));
		this.doc.useServiceAccountAuth(require(credsPath));
		await this.doc.loadInfo();
		const sheet = this.doc.sheetsByIndex[0];
		await sheet.loadHeaderRow();
		const rows = await sheet.getRows();
		const data = [];
		console.log(rows);
		rows.map(el => {
			const objData = {};
			objData.name = el.name ? el.name : '';
			objData.type = el.type ? el.type : '';
			objData.variety = el.variety ? el.variety : '';
			objData.seedlingDays = el.seedlingDays ? el.seedlingDays : '';
			objData.maturity = el.maturity ? el.maturity : '';
			objData.seedlingPeriod = el.seedlingPeriod ? el.seedlingPeriod : '';
			objData.harvestingPeriod = el.harvestingPeriod ? el.harvestingPeriod : '';
			data.push(objData);
		});
		console.log(data);
		return data;
	}
}

module.exports = new GSheet();
