/* Handles `/package/byRegEx` (POST) */
import { Request, Response, Router } from 'express';


// Create a new router instance to define and group related routes
const router = Router();


router.post('/byRegEx', async (req, res) => {
    // const { regex } = req.body;  // Get regex pattern from API request
});

export default router;