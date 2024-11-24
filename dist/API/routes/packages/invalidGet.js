/* Handles `/package/{id}` (GET) */
import { Router } from 'express';
// Create a new router instance to define and group related routes
const router = Router();
router.get('/', async (req, res) => {
    res.status(400).json({ error: "Package ID is required but was not provided." });
    return;
});
export default router;
