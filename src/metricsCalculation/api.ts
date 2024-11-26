import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

app.post('/process', (req: Request, res: Response) => {
    const url = req.body.url;
    if (url) {
        // Process the URL
        const result = processUrlFunction(url);
        res.json({ status: "success", result: result });
    } else {
        res.status(400).json({ status: "failure", message: "No URL provided" });
    }
});

function processUrlFunction(url: string): string {
    // Your code to process the URL
    return `Processed ${url}`;
}

const PORT = 80;
app.listen(PORT, () => {
    console.log(`Server is running on Port: ${PORT}`);
});




