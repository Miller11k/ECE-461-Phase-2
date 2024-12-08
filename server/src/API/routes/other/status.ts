import express, { Request, Response, Router } from 'express';

// Initialize the router
const router = Router();

// Define the root route
router.get('/', (req: Request, res: Response) => {
    const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Status</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }
                .container {
                    text-align: center;
                }
                h1 {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                p {
                    font-size: 1.2rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>API IS UP</h1>
                <p>Your API is running smoothly 🚀</p>
            </div>
        </body>
        </html>
    `;
    res.status(200).send(htmlResponse);
});

export default router;
