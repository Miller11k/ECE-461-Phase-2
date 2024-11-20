/* Handles `/package/{id}` (POST) */

import { Router } from 'express';

// Create a new router instance to define and group related routes
const router = Router();

router.post('/:id', (req, res) => {
    // const { id } = req.params;
});

export default router;