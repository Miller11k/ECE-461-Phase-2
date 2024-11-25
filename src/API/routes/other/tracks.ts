/* Handles `/tracks` (GET) */
import { Request, Response, Router } from 'express';


// Create a new router instance to define and group related routes
const router = Router();


/**
 * Handles the `/tracks` endpoint (GET).
 * 
 * This route returns a JSON response containing the list of planned tracks 
 * a student has implemented in their code. The available tracks are:
 * - "Performance track"
 * - "Access control track"
 * - "High assurance track"
 * - "ML inside track"
 *
 * @module TracksRoute
 * @requires express
 * 
 * @route GET /tracks
 * @group Tracks - Operations related to planned student tracks.
 * 
 * @returns {Object} 200 - JSON object containing the planned tracks.
 * @returns {Array<string>} 200.plannedTracks - List of planned tracks.
 * @returns {Object} 500 - Error response if the system encounters an issue.
 */
router.get('/', async (req, res) => {
    // Return the JSON structure
    res.json({
        plannedTracks: [
            "Access Control Track"
        ]
    });
});

export default router;