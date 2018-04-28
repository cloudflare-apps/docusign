addEventListener('fetch', event => {
    event.respondWith(handleDocusignInstall(event.request))
  })
  
  async function handleDocusignInstall(request) {
    if (request.method !== "POST") return new Response('This route is for POST requests only', {status: 401})
    const text = await request.text()
    const json = JSON.parse(text)
    const {token} = json.authentications.account.token
    const headers = {headers: {'Authorization': `Bearer ${token}`}}
  
    if (json.event === "option-change:account") {
      let accountCall
      let accountAnswer
  
      try {
        accountCall = await fetch('https://account-d.docusign.com/oauth/userinfo', headers)
        accountAnswer = await accountCall.json()
      }
      catch (err) {
        return new Response('Error fetching from Docusign', {status: 500})
      }

      const accountId = accountAnswer.accounts[0].account_id
      const baseUri = accountAnswer.accounts[0].base_uri
      const accountIds = []
      const accountNames = {}
      const baseUris = {}
      accountAnswer.accounts.forEach(account => {
        accountIds.push(account.account_id)
        accountNames[account.account_id] = account.account_name
        baseUris[account.account_id] = account.base_uri
      })
      json.install.schema.properties.docusignAccount = {
        type: 'string',
        default: accountIds[0],
        title: 'Docusign Accounts',
        enum: accountIds,
        enumNames: accountNames
      }
      json.install.options.docusignAccount = accountIds[0]
      json.install.options.baseUris = baseUris
    
      let powerformCall
      let powerformAnswer
  
      try {
        powerformCall = await fetch(`${baseUri}/restapi/v2/accounts/${accountId}/powerforms`, headers)
        powerformAnswer = await powerformCall.json()
      }
      catch(err) {
        return new Response('Error fetching from Docusign', {status: 500})
      }
      const powerformIds = []
      const powerformNames = {}
      powerformAnswer.powerForms.forEach(powerform => {
        powerformIds.push(powerform.powerFormId)
        powerformNames[powerform.powerFormId] = powerform.templateName
      })
      json.install.schema.properties.powerform = {
        type: 'string',
        default: powerformIds[0],
        title: 'Powerform',
        enum: powerformIds,
        enumNames: powerformNames
      }
      json.install.options.powerform = powerformIds[0]
      json.install.options.powerformUrl = powerformAnswer.powerForms[0].powerFormUrl
      json.install.options.powerformName = powerformAnswer.powerForms[0].templateName
  
    } else if (json.event === "option-change:docusignAccount") {
      const accountId = json.install.options.docusignAccount
      const baseUri = json.install.options.baseUris[accountId]
      let powerformCall
      let powerformAnswer
  
      try {
        powerformCall = await fetch(`${baseUri}/restapi/v2/accounts/${accountId}/powerforms`, headers)
        powerformAnswer = await powerformCall.json()
      }
      catch(err) {
        return new Response('Error fetching from Docusign', {status: 500})
      }
  
      const powerformIds = []
      const powerformNames = {}
  
      powerformAnswer.powerForms.forEach(powerform => {
        powerformIds.push(powerform.powerFormId)
        powerformNames[powerform.powerFormId] = powerform.templateName
      })
      json.install.schema.properties.powerform = {
        type: 'string',
        default: powerformIds[0],
        title: 'Powerform',
        enum: powerformIds,
        enumNames: powerformNames
      }
      json.install.options.powerform = powerformIds[0]
      json.install.options.powerformUrl = powerformAnswer.powerForms[0].powerFormUrl
      json.install.options.powerformName = powerformAnswer.powerForms[0].templateName
  
    } else if (json.event === "option-change:powerform") {
      const accountId = json.install.options.docusignAccount
      const baseUri = json.install.options.baseUris[accountId]      
      const powerformId = json.install.options.powerform
      let powerformCall
      let powerformAnswer
      
      try {
        powerformCall = await fetch(`${baseUri}/restapi/v2/accounts/${accountId}/powerforms/${powerformId}`, headers)
        powerformAnswer = await powerformCall.json()
      }
      catch(err) {
        return new Response('Error fetching from Docusign', {status: 500})
      }
  
      json.install.options.powerformUrl = powerformAnswer.powerFormUrl
      json.install.options.powerformName = powerformAnswer.templateName
    }
      return new Response(JSON.stringify(json), {status: 200})
  }