# Chatbot UI

Chatbot UI is an open source chat UI for AI models.

![Chatbot UI](./public/screenshots/screenshot-0402023.jpg)

## Updates

Chatbot UI will be updated over time.

Expect frequent improvements.

**Next up:**

- [ ] Sharing
- [ ] "Bots"

## Deploy

**Docker**

Build locally:

```shell
docker build -t chatgpt-ui .
docker run -e OPENAI_API_KEY=xxxxxxxx -p 3000:3000 chatgpt-ui
```


## Running Locally

**1. Clone Repo**

```bash
git clone https://github.com/Patrick-Davis-MSFT/chatbot-ui.git
```

**2. Install Dependencies**

```bash
npm i
```

**3. Provide OpenAI API Key**

Create a .env.local file in the root of the repo with your OpenAI API Key:

```bash
OPENAI_API_KEY=YOUR_KEY
```

> You can set `OPENAI_API_HOST` where access to the official OpenAI host is restricted or unavailable, allowing users to configure an alternative host for their specific needs.

> Additionally, if you have multiple OpenAI Organizations, you can set `OPENAI_ORGANIZATION` to specify one.

**4. Run App**

```bash
npm run dev
```

**5. Use It**

You should be able to start chatting.

## Configuration

When deploying the application, the following environment variables can be set:

| Environment Variable              | Default value                  | Description                                                                                                                               |
| --------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| OPENAI_API_KEY                    |                                | The default API key used for authentication with OpenAI. Set this to a fake value when using APIM.                                                                                   |
| OPENAI_API_HOST                   | `https://api.openai.com`       | The base url, for Azure use `https://<endpoint>.openai.azure.com`. If using APIM enter the URI of the APIM instance. When using APIM set to the APIM URL for the Azure Open AI.|
| OPENAI_API_TYPE                   | `openai`                       | The API type, options are `openai` or `azure`                                                                                             |
| OPENAI_API_VERSION                | `2023-03-15-preview`           | Only applicable for Azure OpenAI                                                                                                          |
| AZURE_DEPLOYMENT_ID               |                                | Needed when Azure OpenAI, Ref [Azure OpenAI API](https://learn.microsoft.com/zh-cn/azure/cognitive-services/openai/reference#completions) |
| OPENAI_ORGANIZATION               |                                | Your OpenAI organization ID                                                                                                               |
| DEFAULT_MODEL                     | `gpt-3.5-turbo`                | The default model to use on new conversations, for Azure use `gpt-35-turbo`                                                               |
| NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT | [see here](utils/app/const.ts) | The default system prompt to use on new conversations                                                                                     |
| NEXT_PUBLIC_DEFAULT_TEMPERATURE   | 1                              | The default temperature to use on new conversations                                                                                       |
| GOOGLE_API_KEY                    |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| GOOGLE_CSE_ID                     |                                | See [Custom Search JSON API documentation][GCSE]                                                                                          |
| AZURE_APIM_KEY | | Required if using APIM. Use the subscription key if needed.
| NODE_TLS_REJECT_UNAUTHORIZED | | Set to `0` if using a self signed cert to prevent TLS errors.|

If you do not provide an OpenAI API key with `OPENAI_API_KEY`, users will have to provide their own key.

If you don't have an OpenAI API key, you can get one [here](https://platform.openai.com/account/api-keys).

## To deploy to push to an Azure Container Registry
<i>Required</i>: Local version of Docker and an Azure subscription. 

1. Deploy a Web app as a Standard web app. Either using the included bicep (future)
    1. When deploying through the Azure Portal, select the following options
        1. Operating System: Linux
        1. App Service Plan: Standard B1 or higher depending on usage
        1. Docker Container instance
        1. VNET integration needed to the Associated APIM
        1. Do not enable CI/CD through  the webapp
    1. You will need the following information
        1. The Azure Container Registry URL 
        1. The ACR Username and password
        1. The Website configuration pramerter
1. After deploying turn on the Integrated Authentication using Azure Active Directory as the authentication provider. 
    * To limit the application to particular users...
        1. Go to the Application Registration Overview Page
        1. Click the link in "<i>Managed Application in Overview Page</i>"
        1. Go to <i>Properties</i> in the Enterprise Application blade
        1. Set "<i>Assignment required?</i>" to <i>Yes</i>
    * After setting this the user or groups need to be added to the <i>User and groups</i> list in the Enterprise Application under Azure Active Directory
1. Login to the Azure Container Registry `docker login <container-url-lowercase>`
1. Build the docker image locally `docker build -t azuregovchat-ui .`
1. Tag the docker image locally `docker tag azuregovchat-ui [container-reg-name].azurecr.io/azuregovchat-ui`
1. Push the image to the ACR `docker image push [container-reg-name].azurecr.io/azuregovchat-ui`
1. Go to the webapp and Update the following configuration parameters
    * AZURE_APIM_KEY (if using APIM to front AOAI)
    * AZURE_DEPLOYMENT_ID (The name of the deployment in AOAI)
    * OPENAI_API_HOST (The host URI for AOAI)
    * OPENAI_API_KEY (Required to be not null and can be `false` if using AOAI through APIM otherwise use the AOAI API Key)
    * OPENAI_API_TYPE = `azure` (Required for Azure)
    * NODE_TLS_REJECT_UNAUTHORIZED = `0` (Not needed if the backend certs are from a source with a valid certificate)
1. Go to the <i>Deployment Center</i>
1. Set the settings to 
    * Source: Container Registry
    * Container Type: Single Container
    * Registry Source: Azure Container Registry
    * Subscription: The ACR subscription
    * Authentication: The best choice for your needs
    * Registry: The container registry name created for this effort
    * Image: azurechat-ui
    * Tag: the appropriate tag
    * Pull Image over VNET: or the best choice for your needs
    * Continuous Deployment: Off
    * Webhook URL: Default Value

## Contact

If you have any questions, feel free to reach out to Mckay on [Twitter](https://twitter.com/mckaywrigley).

[GCSE]: https://developers.google.com/custom-search/v1/overview
