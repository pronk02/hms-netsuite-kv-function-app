import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import dotenv from "dotenv";
dotenv.config();

const credential = new DefaultAzureCredential();
const vaultName = "netsuite-oauth1-kv";
const url = `https://${vaultName}.vault.azure.net`;
const kvClient = new SecretClient(url, credential);
const apiAccessToken = "apiAccessToken";

interface ISecrets {
    apiAccessToken: string;
}

async function getSecrets(): Promise<ISecrets> {
    const token = await (await kvClient.getSecret(apiAccessToken)).value;
    console.log(`Latest version of the secret ${apiAccessToken}: `, token);

    return {
        apiAccessToken: token,
    };
    //const specificSecret = await client.getSecret(apiAccessToken, { version: latestSecret.properties.version! });
    //console.log(`The secret ${apiAccessToken} at the version ${latestSecret.properties.version.value!}: `, specificSecret);
}

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    context.log("HTTP trigger function processed a request.");
    const secrets = await getSecrets() //req.query.name || (req.body && req.body.name);
    const responseMessage = secrets
        ? `The secrets are: ${JSON.stringify(secrets)}.
        This HTTP triggered function executed successfully.`
        : `This HTTP triggered function executed successfully.`;

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage,
    };
};

export default httpTrigger;
