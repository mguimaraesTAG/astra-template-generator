const { Connection } = require('jsforce')
const { randomElement } = require('./util')

module.exports = async () => {
  const user = process.env.SALESFORCE_USERNAME
  const password = `${process.env.SALESFORCE_PASSWORD}${process.env.SALESFORCE_TOKEN}`
  const loginUrl = process.env.SALESFORCE_URL
  const connection = new Connection({ loginUrl })

  await connection.login(user, password)

  return {
    connection,
    async getFundsWithPurchasingEntities() {
      const results = await this.connection.query(
        `select Id, Name, (select Id, Name, Purchasing_Entity_Short_Name__c from Purchasing_Entities__r) from Fund__c`
      )
      return results.records.map(fund => {
        const purchEntities = fund.Purchasing_Entities__r?.records ?? []
        return { ...fund, Purchasing_Entities__r: purchEntities }
      })
    },
    async getProperties(pmPropertyIds) {
      // let props = []
      // const eigthPartIndex = Math.ceil(pmPropertyIds.length / 8);
      // for (var i = 0; i < 8; i++) {
      //   if (i === 7) {
      //     const lastPart = await this.getPropertyByIdsRange(pmPropertyIds);
      //     if(lastPart) props = [...props, ...lastPart]
      //     continue;
      //   }
      //   const part = await this.getPropertyByIdsRange(pmPropertyIds.splice(-eigthPartIndex));
      //   if(part) props = [...props, ...part]
      // }
      // return props;
      return await this.getPropertyByIdsRange(pmPropertyIds);
    },
    async getOwners(pmPropertyIds) {
      // let props = []
      // const eigthPartIndex = Math.ceil(pmPropertyIds.length / 8);
      // for (var i = 0; i < 8; i++) {
      //   if (i === 7) {
      //     const lastPart = await this.getOwnerByPropertyIdsRange(pmPropertyIds);
      //     if(lastPart) props = [...props, ...lastPart]
      //     continue;
      //   }
      //   const part = await this.getOwnerByPropertyIdsRange(pmPropertyIds.splice(-eigthPartIndex));
      //   if(part) props = [...props, ...part]
      // }
      // return props;
      return await this.getOwnerByPropertyIdsRange(pmPropertyIds);
    },
    async getOwnerByPropertyIdsRange(propertyId) {
      const result = await this.connection.query(
        `select Id, Property__c, Name, Purchase_Price__c, Fund__r.Name, Purchasing_Entity__r.Name, Property__r.Id, Property__r.Vendor_Property_Id__c from Owner__c where Property__r.Vendor_Property_Id__c in (${propertyId.map(v => `'${v}'`).join(', ')})`
      )
      if (result?.records?.length > 0) return result.records;
    },
    async getPropertyByIdsRange(propertyId) {
      const result = await this.connection.query(
        `select Id, Vendor_Property_Id__c, Purchase_Price__c, Fund__c, Purchasing_Entity__c from Property__c WHERE Id not in (select Property__c from Owner__c) and Vendor_Property_Id__c in (${propertyId.map(v => `'${v}'`).join(', ')})`
      )
      if (result?.records?.length > 0) return result.records;
    },
    randomAssetCo(funds, fundName) {
      const fund = funds.find(fund => fund.Name === fundName)
      return fund ? randomElement(fund.Purchasing_Entities__r)?.Name : null
    },
    async getPropertiesForTemplate(pmRecords) {
      const pmCopy1 = [...pmRecords]
      console.log(pmRecords)
      const owners = await this.getOwners(pmCopy1)
      const properties = await this.getProperties(pmRecords)
      const funds = await this.getFundsWithPurchasingEntities()
      const dateOfSale = new Date()

      const recordsFromOwners = !owners ? [] : owners.map(o => {
        const sellingFund = o.Fund__r?.Name ?? 'Vaca Morada'
        const purchasingFund = sellingFund == 'Vaca Morada' ? 'ASFRP' : 'Vaca Morada'
        if (o?.Property__r) {
          return {
            assetId: o.Property__r.Vendor_Property_Id__c,
            dateOfSale,
            sellingFund,
            sellingAssetCo: o.Purchasing_Entity__r?.Name ?? this.randomAssetCo(funds, sellingFund),
            purchasingFund,
            purchasingAssetCo: this.randomAssetCo(funds, purchasingFund),
            purchasePrice: o.Purchase_Price__c ?? 300000,
          }
        }
      })
      const recordsFromProperties = !properties ? [] : properties.map(p => {
        const sellingFund = p.Fund__c ?? 'Vaca Morada'
        const purchasingFund = sellingFund == 'Vaca Morada' ? 'ASFRP' : 'Vaca Morada'
        return {
          assetId: p?.Vendor_Property_Id__c,
          dateOfSale,
          sellingFund,
          sellingAssetCo: p.Purchasing_Entity__c ?? this.randomAssetCo(funds, sellingFund),
          purchasingFund,
          purchasingAssetCo: this.randomAssetCo(funds, purchasingFund),
          purchasePrice: p.Purchase_Price__c ?? 300000,
        }
      })

      return [...recordsFromOwners, ...recordsFromProperties].map(record => {
        return {
          ...record,
          acquisitionCosts: 1,
          remainingRepairs: 1,
          uwRent: 1,
          uwOtherRent: 1,
          uwRentConcessions: 1,
          uwAnnualTaxes: 1,
          uwAnnualHoa: 1,
          uwAnnualInsurance: 1,
          uwOccupancyPercentage: 1,
          uwCreditLoss: 1,
          uwMaintenance: 1,
          uwTurnover: 1,
          uwPropMgmtFees: 1,
          uwLeasingFees: 1,
        }
      }).filter(v => v.assetId)
    },
  }
}
