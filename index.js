require('dotenv').config()
const initSalesforce = require('./salesforce')
const { convertToWorkbook } = require('./template')
const fs = require('fs')
const initPm = require('./property-manager')
async function go() {
  const salesforce = await initSalesforce()
  const pm = await initPm();
  const pmProperties = await pm.getPropertyIdsFromPM();
  const records = await salesforce.getPropertiesForTemplate(pmProperties)
  const workbook = convertToWorkbook(records)

  await fs.promises.writeFile('output/transfer.xlsx', workbook)
}

go()
