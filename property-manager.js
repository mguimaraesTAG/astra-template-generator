
module.exports = () => {
    const { NtlmClient } = require('axios-ntlm');
    
    const getPropertyIdsFromPM = async () => {
        let credentials = {
            username: process.env.PM_API_USERNAME,
            password: process.env.PM_API_PASSWORD,
            domain: process.env.PM_API_DOMAIN
        }
        
        let config = {
            baseURL: process.env.PM_API_URL,
            method: 'get'
        }
        
        let client = NtlmClient(credentials, config)
        
        client.defaults.headers = {
            accept: 'application/json',
            prefer: 'return=representation',
        }
        try {
            let resp = await client.get('/msr_homes')
            return resp?.data?.value.map(v => v.msr_propertyid);
        }
        catch (err) {
            console.log(err)
            console.log("Failed")
        }
    }
    return {
        getPropertyIdsFromPM
    }
}
