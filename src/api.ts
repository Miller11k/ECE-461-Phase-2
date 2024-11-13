// import axios from 'axios';
// import * as dotenv from 'dotenv';
// import * as fs from 'fs';
// import { uploadFile } from './S3Connect'; // Update to the correct path
// import * as path from 'path';

// dotenv.config();

// const apiEndpoint = process.env.API_ENDPOINT;

// const metrics = [ "busFactor","correctness",  "license", "maintainability","rampUp", "netScore"];

// async function postPackageUrl(packageUrl: string) {


//     for (const metricType of metrics) {
//         try {
//             // Sending POST request for each metric with the specified format
//             const response = await axios.post(apiEndpoint as string, {
//                 queryStringParameters: {
//                     metricType: metricType,
//                     repoUrl: packageUrl
//                 }
//             });

            
//             if (response.status === 200) {
//                 console.log(`POST request successful for metric ${metricType}:`, response.data);
//             } else {
//                 console.log(`POST request completed with a non-200 status for metric ${metricType}:`, response.status);
//             }
//         } catch (error) {
//             console.error(`Error with POST request for metric ${metricType}:`, error);
//         }
//     }


// }

// // // Example usage
//  postPackageUrl('https://github.com/lodash/lodash');

//need to install express and body-Parser

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

app.post('/process', (req: Request, res: Response) => {
    const url = req.body.url;
    if (url) {
        // Process the URL
        const result = processUrlFunction(url);
        res.json({ status: "success", result: result });
    } else {
        res.status(400).json({ status: "failure", message: "No URL provided" });
    }
});

function processUrlFunction(url: string): string {
    // Your code to process the URL
    return `Processed ${url}`;
}

const PORT = 80;
app.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});




