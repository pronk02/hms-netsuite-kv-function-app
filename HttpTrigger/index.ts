import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { ISecrets } from "./types";
import dotenv from "dotenv";
dotenv.config();

const credential = new DefaultAzureCredential();

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    context.log("HTTP trigger function processed a request.");
    context.log("req.query: ", req.query);
    const nsEnvironment = req.query.environment;
    const secrets = await getSecrets(nsEnvironment);
    const response = secrets ? JSON.stringify(secrets) : `No secrets were returned.`;
    context.log("response: ", response);
    context.res = {
        body: response
    };

    async function getSecrets(nsEnvironment = "sandbox"): Promise<ISecrets | string> {
        if (nsEnvironment != "sandbox" && nsEnvironment != "production" && nsEnvironment != "") {
            return "The 'environment' paramater must be either 'sandbox' or 'production'."
        }
        const url = `https://${nsEnvironment == "production" ? "hms-netsuite-prod-kv" : "hms-netsuite-sandbox-kv"}.vault.azure.net`;
        const kvClient = new SecretClient(url, credential);
        const realm = (await kvClient.getSecret("realm")).value;
        return {
            tokenId: (await kvClient.getSecret("token-id")).value,
            tokenSecret: (await kvClient.getSecret("token-secret")).value,
            consumerKey: (await kvClient.getSecret("consumer-key")).value,
            consumerSecret: (await kvClient.getSecret("consumer-secret")).value,
            realm: realm,
            restServicesUrl: `https://${realm.replace("_", "-")}.suitetalk.api.netsuite.com`,
            resletUrl: `https://${realm.replace("_", "-")}.restlets.api.netsuite.com`
        };
    }
};

export default httpTrigger;
