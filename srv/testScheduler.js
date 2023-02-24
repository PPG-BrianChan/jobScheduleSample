const { executeHttpRequest, getDestination, destinationForServiceBinding } = require('@sap-cloud-sdk/core');
const { executeJobHttpRequest } = require('./libs/schedulerFunction')
const { executeHttpRequest_customDestination } = require('./libs/customDestinationFunction')

//VCAP
const vcap_services = JSON.parse(process.env.VCAP_SERVICES)
const schedulerCredentials = vcap_services.jobscheduler[0].credentials
const schedulerUAA = schedulerCredentials.uaa
const instanceName = vcap_services.jobscheduler[0].instance_name
const clientID = schedulerUAA.clientid;
const clientSecret = schedulerUAA.clientsecret;
const schedulerHost = schedulerCredentials.url
const authEndPoint = schedulerUAA.url;

module.exports = async function (srv) {
    srv.on('scheduled_function', async (req) => {
        const date = new Date();
        console.log('Scheduled function triggered at: ', date);
        const res = req._.req.res;
        res.status(202).send('Accepted async job, but long-running operation still running.')
        // doActionUpdateJob(req.headers)
        // await doTestActionUpdateJob(req.headers)
        setTimeout(async () => {
            await executeUpdateWithLib(req.headers);
            // await doTestActionUpdateJob(req.headers)
        }, 5000);
    })

    const doTestActionUpdateJob = async function (headers) {
        const httpconfig = {
            method: "GET",
            url: "/scheduler/jobs"
        }
        const resp = await executeHttpRequest_customDestination("testScheduler-job-service", httpconfig)
        console.log(resp.data);
    }

    const executeUpdateWithLib = async function (headers) {
        // const jobID = headers['x-sap-job-id']
        // const scheduleID = headers['x-sap-job-schedule-id']
        // const runID = headers['x-sap-job-run-id']

        //Test Data
        const jobID = '7776286'
        const scheduleID = 'fefdf76d-0698-43a6-8729-d6ba0a668c93'
        const runID = '14650216-44b3-43aa-aa78-fe171bceb4f7'
        console.log(`Retrieved Job ID: ${jobID}; ScheduleID: ${scheduleID}; RunID: ${runID}`)
        const jobUpdateMessage = JSON.stringify({
            "success": true,
            "message": "Long running operation completed"
        })
        const url = `/scheduler/jobs/${jobID}/schedules/${scheduleID}/runs/${runID}`;
        console.log("Posting to host: ", url)

        const httpconfig = {
            method: "PUT",
            url: url,
            data: jobUpdateMessage,
            // headers: {
            //     "Content-Type": "application/json"
            // }
        }
        try {
            const result = await executeHttpRequest_customDestination(
                instanceName,
                httpconfig,
            )
            console.log("Update successful")
        }
        catch (error) {
            if (error.response) {
                // console.log("Encountered error :" + error.response.data)
                console.log("Encountered error :" + JSON.stringify(error.response.data, null, 2));
            } else if
                (error.message) {
                console.log("Encountered error:" + error.message);
            } else if
                (error.data) {
                console.log("Encountered error:" + error.data);
            } else
                console.log("Error");
        }
    }
}

    // const doActionUpdateJob = async function (headers) {
    //     try {
    //         const jwtToken = await getJwtToken();
    //         await executeUpdate(headers, jwtToken);
    //     }
    //     catch (error) {
    //         if (error.message) {
    //             console.log("Encountered error:" + error.message);
    //         }
    //     }
    // }

    // const getJwtToken = async function () {
    //     return new Promise((resolve, reject) => {
    //         setTimeout(async () => {
    //             const tokenCredentials = new URLSearchParams({
    //                 grant_type: "client_credentials",
    //                 client_id: clientID,
    //                 client_secret: clientSecret,
    //             });
    //             try {
    //                 const response = await executeHttpRequest(
    //                     { url: authEndPoint + "/oauth/token" },
    //                     {
    //                         method: "POST",
    //                         data: tokenCredentials,
    //                         headers: {
    //                             "Content-Type": "application/x-www-form-urlencoded",
    //                         },
    //                     },
    //                 );
    //                 resolve(response.data.access_token)
    //             }
    //             catch (error) {
    //                 reject(error);
    //             }
    //         }, 5000)
    //     })
    // }

    // const executeUpdate = async function (headers, jwtToken) {
    //     const jobID = headers['x-sap-job-id']
    //     const scheduleID = headers['x-sap-job-schedule-id']
    //     const runID = headers['x-sap-job-run-id']
    //     const host = headers['x-sap-scheduler-host']
    //     console.log(`Retrieved Job ID: ${jobID}; ScheduleID: ${scheduleID}; RunID: ${runID}; Host: ${host}`)
    //     const jobUpdateMessage = JSON.stringify({
    //         "success": true,
    //         "message": "Long running operation completed"
    //     })
    //     const url = host + `/scheduler/jobs/${jobID}/schedules/${scheduleID}/runs/${runID}`;
    //     console.log("Posting to host: ", url)
    //     try {
    //         const result = await executeHttpRequest(
    //             { url: url },
    //             {
    //                 method: "PUT",
    //                 headers: {
    //                     "Authorization": "Bearer " + jwtToken,
    //                     "Content-Type": "application/json"
    //                 },
    //                 data: jobUpdateMessage
    //             },
    //         )
    //         console.log("Update successful with return:", result.data)
    //     }
    //     catch (error) {
    //         if (error.message) {
    //             console.log("Encountered error:" + error.message);
    //         } else if
    //             (error.data) {
    //             console.log("Encountered error:" + error.data);
    //         } else
    //             console.log("Error");
    //     }
    // }