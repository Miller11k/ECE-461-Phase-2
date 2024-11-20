/* Handles `/reset` (DELETE) */
import { Request, Response, Router } from 'express';


// Create a new router instance to define and group related routes
const router = Router();


router.delete('/', async (req, res) => {
    // const { regex } = req.body;  // Get regex pattern from API request
    res.json({ success: true, message: 'RESET' });  // Respond with success message
});

export default router;