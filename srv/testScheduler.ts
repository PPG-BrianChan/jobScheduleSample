import cds from "@sap/cds";
import { executeHttpRequest, HttpResponse, HttpRequestConfig } from "@sap-cloud-sdk/http-client";
import {
    Service,
    ServiceBindingTransformFunction,
    Destination,
    getClientCredentialsToken,
    decodeJwt
} from "@sap-cloud-sdk/connectivity";
const xsenv = require('@sap/xsenv');
import { AxiosError, AxiosResponse } from 'axios';

module.exports = class APIService extends cds.ApplicationService {
    async init() {
        this.on("scheduled_function", async function () {
            //Dev Data
            const jobID = '7776286'
            const scheduleID = 'fefdf76d-0698-43a6-8729-d6ba0a668c93'
            const runID = '14650216-44b3-43aa-aa78-fe171bceb4f7'
            console.log(`Retrieved Job ID: ${jobID}; ScheduleID: ${scheduleID}; RunID: ${runID}`)
            const jobUpdateMessage = JSON.stringify({
                "success": true,
                "message": "Long running operation completed"
            })
            const url = `/scheduler/jobs/${jobID}/schedules/${scheduleID}/runs/${runID}`;
            // End of dev data

            // Actual PUT run test
            const httpconfig: HttpRequestConfig = {
                method: "PUT",
                url: url,
                data: jobUpdateMessage,
                // headers: {
                //     "Content-Type": "application/json"
                // }
            }

            //Test of GET run
            // const httpconfig: HttpRequestConfig = {
            //     method: "GET",
            //     url: "/scheduler/jobs"
            // }
            try {
                const result = await executeHttpRequest_customDestination("testScheduler-job-service", httpconfig);
                if (result) {
                    console.log("Success with response:", result.data || result)
                }
            } catch (error: any) {
                // const parsedError = JSON.parse(error.message) as { code: string, detailedError: string, message:string, type:string };
                // // const parsedError = JSON.parse(error.message);
                if (error.response) {
                    console.log(((error as AxiosError).response as AxiosResponse).data)
                } else {
                    console.log((error as { message: string }).message)
                }
            }

        });
        await super.init();
    }
};

const _serviceBindingTransformFn: ServiceBindingTransformFunction = async (
    service: Service
): Promise<Destination> => {
    var serviceUrl = service.credentials.url

    //Temp service used to generate token
    const tempService: Service = service;
    tempService.credentials = tempService.credentials.uaa

    const token = (await getClientCredentialsToken(tempService))
    return buildClientCredentialsDestination(
        token.access_token,
        serviceUrl,
        service.name
    );
};

async function executeHttpRequest_customDestination<T extends HttpRequestConfig>(
    destinationName: string,
    requestConfig: T
): Promise<HttpResponse | any> {
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

function buildClientCredentialsDestination(
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