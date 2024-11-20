/* Handles `/package/{id}/cost` (GET) */
import { Request, Response, Router } from 'express';


// Create a new router instance to define and group related routes
const router = Router();


router.get('/:id/cost', async (req, res) => {
    // const {id} = req.params;

});

export default router;