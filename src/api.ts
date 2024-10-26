import axios from 'axios';
import * as dotenv from 'dotenv';

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
    



// added this for testing by writing the url to terminal, commented out for now

// const packageUrl = process.argv[2];  // The URL passed as an argument

// if (!packageUrl) {
//     console.error('Please provide a package URL as a command-line argument.');
//     process.exit(1);
// }


// Example usage
postPackageUrl('https://github.com/lodash/lodash');


