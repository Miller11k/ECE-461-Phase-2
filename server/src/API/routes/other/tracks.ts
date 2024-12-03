/**
 * @module TracksRoute
 * Defines the `/tracks` endpoint for retrieving the list of planned tracks.
 */

import { Request, Response, Router } from 'express';


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
    // Return the JSON structure
    res.json({
        plannedTracks: [
            "Authentication Track"
        ]
    });
});

export default router;