/* Handles `/package/{id}` (GET) */
import { Request, Response, Router } from 'express';
import { shouldLog } from '../../helpers/logHelper.js';

// Create a new router instance to define and group related routes
const router = Router();


router.get('/', async (req, res) => {
    let log_get_package = parseInt(process.env.LOG_GET_PACKAGE_ID || '0', 10);
    let log_all = parseInt(process.env.LOG_ALL || '0', 10);
    let should_log = shouldLog(log_get_package, log_all);

    console.log('\n\n\n*-------------------------------------------*');
    console.log('GET /package endpoint hit (INVALID GET)');
    console.log('*-------------------------------------------*');
    
    if(should_log){
        console.log("Received a GET request at `/package/`");
        console.log("Request query parameters:", req.query);
    }

    res.status(400).json({ error: "Package ID is required but was not provided." });
    if(should_log){
        console.log("Response sent: 400 - Package ID is required but was not provided.");
    }
    return;

});

export default router;