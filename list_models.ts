
import * as dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key");
        return;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.error) {
            console.error("Error listing models:", data.error);
        } else {
            console.log("Available Models:");
            data.models?.forEach((m: any) => console.log(`- ${m.name}`));
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

listModels();
