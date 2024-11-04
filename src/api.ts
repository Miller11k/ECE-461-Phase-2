import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { uploadFile } from './S3Connect'; // Update to the correct path
import * as path from 'path';

dotenv.config();

const apiEndpoint = process.env.API_ENDPOINT;

const metrics = [ "busFactor","correctness",  "license", "maintainability","rampUp", "netScore"];

async function postPackageUrl(packageUrl: string) {


    for (const metricType of metrics) {
        try {
            // Sending POST request for each metric with the specified format
            const response = await axios.post(apiEndpoint as string, {
                queryStringParameters: {
                    metricType: metricType,
                    repoUrl: packageUrl
                }
            });

            
            if (response.status === 200) {
                console.log(`POST request successful for metric ${metricType}:`, response.data);
            } else {
                console.log(`POST request completed with a non-200 status for metric ${metricType}:`, response.status);
            }
        } catch (error) {
            console.error(`Error with POST request for metric ${metricType}:`, error);
        }
    }


}

// // Example usage
 postPackageUrl('https://github.com/lodash/lodash');


