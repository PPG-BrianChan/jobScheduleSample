import { executeHttpRequest, HttpResponse, HttpRequestConfig } from "@sap-cloud-sdk/http-client";
import {
    Service,
    ServiceBindingTransformFunction,
    Destination,
    getClientCredentialsToken,
    decodeJwt
} from "@sap-cloud-sdk/connectivity";

export async function executeHttpRequest_customDestination<T extends HttpRequestConfig>(
    destinationName: string,
    requestConfig: T
): Promise<HttpResponse> {
    try {
        const resp = await executeHttpRequest({
            destinationName: destinationName,
            serviceBindingTransformFn: _serviceBindingTransformFn
        },
            requestConfig
        )
        return resp;
    }
    catch (error: any) {
        throw error;
    }
}

/**
 * Manually retrieves service to identify the right service url
 * Service credentials have to be massaged before passing in to getClientCredentialsToken
 * This is due to the function is built to handle only specific services ONLY
 * The parameter service can be used to retrieve token 
 */
const _serviceBindingTransformFn: ServiceBindingTransformFunction = async (
    service: Service
): Promise<Destination> => {
    // const services: Service[] = xsenv.filterServices({ instance_name: service.name });
    // const selectedService: Service = services[0]
    //selectedService and parameter service are usually the same instance.
    //However, url can be different due to internal massaging functionalities.
    //E.g. In the case of job scheduler, we should take url from selectedService.
    var serviceUrl = service.credentials.url;

    //Temp service used to generate token
    const tempService: Service = service;
    tempService.credentials = tempService.credentials.uaa

    const token = (await getClientCredentialsToken(tempService))
    return _buildClientCredentialsDestination(
        token.access_token,
        serviceUrl,
        service.name
    );
};

function _buildClientCredentialsDestination(
    token: string,
    url: string,
    name: string
): Destination {
    const expiresIn = Math.floor(
        (decodeJwt(token).exp! * 1000 - Date.now()) / 1000
    ).toString(10);
    return {
        url,
        name,
        authentication: 'OAuth2ClientCredentials',
        authTokens: [
            {
                value: token,
                type: 'bearer',
                expiresIn,
                http_header: { key: 'Authorization', value: `Bearer ${token}` },
                error: null
            }
        ]
    };
}