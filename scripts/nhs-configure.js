const crypto = require('crypto')
const https = require('https')
const { execSync } = require('child_process');

const serviceName = process.argv[2];
const accountKey = process.argv[3];
const hotJarId = process.argv[4];
const instrumentationKey = process.argv[5];

setConfig()

async function setConfig(){

    try {

        //set expiry date for access tokens
        const tokensExpiryDate = new Date()
        tokensExpiryDate.setDate(tokensExpiryDate.getDate() + 14) //valid for 14 days

        //get Management API token        
        const managementApiAccessToken = createSharedAccessToken("integration", accountKey, tokensExpiryDate)

        //get storage connection string
        const settings = await sendRequestAsync({
            options: {
                host: `${serviceName}.management.azure-api.net`,
                path: "/tenant/settings?api-version=2018-01-01",
                method: "GET",
                headers: {
                    "Authorization" : managementApiAccessToken
                }            
            }
        })
        const blobStorageConnectionString = JSON.parse(settings.body).settings.PortalStorageConnectionString

        //generate sas url for blob storage
        const storageAccountName = blobStorageConnectionString.split(";")[1].split("=")[1]
        const storageExpiry = tokensExpiryDate.toISOString().substr(0,10)
        const execStorageSas = execSync(`az storage account generate-sas --expiry ${storageExpiry} --permissions rwdlacup --resource-types sco --services bfqt --connection-string "${blobStorageConnectionString}"`)
        const storageSas = JSON.parse(execStorageSas.toString())
        const blobStorageUrl = `https://${storageAccountName}.blob.core.windows.net?${storageSas}`


        //call configure.js
        var args = 
        [
            "node configure.js",
            `${serviceName}.management.azure-api.net`,
            `"${managementApiAccessToken}"`,
            `"${blobStorageUrl}"`,
            `"${blobStorageConnectionString}"`,
            `https://${serviceName}.developer.azure-api.net`,
            serviceName,
            hotJarId,
            instrumentationKey
        ]
        console.log(args)
        execSync(args.join(" "))
        
    }
    catch(error){
        console.log(error)
    }
}



function createSharedAccessToken(apimUid, apimAccessKey, expiryDate) {

    let expiry = expiryDate.toISOString().replace(/\d+.\d+Z/, "00.0000000Z")
    let expiryShort = expiryDate.toISOString().substr(0,16).replace(/[^\d]/g,'',)

    const signature = crypto.createHmac('sha512', apimAccessKey).update(`${apimUid}\n${expiry}`).digest('base64');
    const sasToken = `SharedAccessSignature ${apimUid}&${expiryShort}&${signature}`;

    return sasToken;
}

function sendRequestAsync(command) {

    return new Promise((resolve, reject) => {

        const request = https.request(command.options, (response) => {

            response.body = '';
            response.on('data', (chunk) => {
                response.body += chunk;
            });
            response.on('end', () => resolve(response));        
        });

        request.on('error', reject);
        request.end(command.data);
    });
}
