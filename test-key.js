console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);
console.log("Gemini key value (hidden first/last 3 chars):", 
    process.env.GEMINI_API_KEY 
        ? process.env.GEMINI_API_KEY.slice(0, 3) + "..." + process.env.GEMINI_API_KEY.slice(-3) 
        : "Not set"
);