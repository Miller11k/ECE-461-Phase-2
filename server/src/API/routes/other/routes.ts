import { Router } from 'express';

const router = Router();

/**
 * @route /routes
 * Returns a hardcoded JSON list of all available routes and their methods.
 */
router.get('/', (req, res) => {
    const available_routes = {
        routes: [
            // Other Routes
            { path: "/authenticate", methods: ["GET"] },
            { path: "/reset", methods: ["POST"] },
            { path: "/routes", methods: ["GET"] },
            { path: "/status", methods: ["GET"] },
            { path: "/tracks", methods: ["GET"] },
            
            // User-Related Routes
            { path: "/create-user", methods: ["POST"] },
            { path: "/login", methods: ["POST"] },
            { path: "/get-user", methods: ["GET"] },
            { path: "/change-username", methods: ["PATCH"] },
            { path: "/clear-tokens", methods: ["DELETE"] },
            { path: "/change-password", methods: ["PATCH"] },
            { path: "/delete-token", methods: ["DELETE"] },
            
            // Package-Related Routes
            { path: "/package", methods: ["POST", "GET"] }, // "/" (Create + Invalid GET)
            { path: "/package/byRegEx", methods: ["POST"] },
            { path: "/package/:id", methods: ["GET", "PUT"] }, // Metadata, content retrieval & updates
            { path: "/package/:id/rate", methods: ["GET"] },
            { path: "/package/:id/cost", methods: ["GET"] },
            { path: "/packages", methods: ["GET", "POST"] }, // List and query operations
        ]
    };

    res.json(available_routes);
});

export default router;
