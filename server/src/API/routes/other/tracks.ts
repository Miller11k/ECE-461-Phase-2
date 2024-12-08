/**
 * @module TracksRoute
 * Defines the `/tracks` endpoint for retrieving the list of planned tracks.
 */

import { Request, Response, Router } from 'express';
import { shouldLog } from '../../helpers/logHelper.js';


// Create a new router instance to define and group related routes
const router = Router();


/**
 * Handles the `/tracks` endpoint (GET).
 * 
 * This route provides a JSON response with a list of planned tracks
 * that students can implement in their code. The currently available tracks are:
 * - "Authentication Track"
 * 
 * @route GET /tracks
 * @group Tracks - Operations related to planned student tracks.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * 
 * @returns {Object} A JSON response with the list of planned tracks:
 * - `plannedTracks`: An array of strings representing the available tracks.
 * 
 * @example
 * // Successful response:
 * {
 *   "plannedTracks": [
 *     "Authentication Track"
 *   ]
 * }
 */
router.get('/', async (req, res) => {
    let log_get_tracks = parseInt(process.env.LOG_GET_TRACKS || '0', 10);
    let log_all = parseInt(process.env.LOG_ALL || '0', 10);
    let should_log = shouldLog(log_get_tracks, log_all);
    
    console.log('\n\n\n*-------------------------------------------*');
    console.log('GET /tracks endpoint hit');
    console.log('*-------------------------------------------*');
    
    if(should_log){
        console.log('Received GET request at /tracks endpoint.');
    }
    // Define the list of planned tracks
    const tracks = [
        "Access control track"
    ];

    // Log the tracks to be returned
    if(should_log){
        console.log('Returning planned tracks:', tracks);
    }

    // Return the JSON response with the list of planned tracks
    res.json({
        plannedTracks: tracks
    });

    // Log the successful response
    if(should_log){
        console.log('Response sent successfully.');
    }
});

export default router;