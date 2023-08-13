const express = require('express');
const bodyParser = require('body-parser');
const convertapi = require('convertapi')('a9p5eLpXLvhfFGVS'); // Replace with your actual ConvertAPI key
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const serverless =require("serverless-http")

const app = express();

// Middleware
app.use(bodyParser.json());

// POST route to handle file conversion and OCR
app.post('/convert-and-ocr', async (req, res) => {
    try {
        const url = req.body.URL;

        // Convert the image using ConvertAPI
        const result = await convertapi.convert('jpg', {
            File: url
        });

        const convertedImagePath = './new.jpg'; // Replace with your desired save path
        await result.files[0].save(convertedImagePath);
        console.log('Image converted:', convertedImagePath);

        // Pass the converted image to the OCR API
        const formData = new FormData();
        formData.append('image', fs.createReadStream(convertedImagePath));

        const ocrOptions = {
            method: 'POST',
            url: 'https://ocr-extract-text.p.rapidapi.com/ocr',
            headers: {
                'X-RapidAPI-Key': '6e3000c467msh57be57c95202c37p1af2dbjsne964acf03638',
                'X-RapidAPI-Host': 'ocr-extract-text.p.rapidapi.com',
                ...formData.getHeaders(),
            },
            data: formData,
        };

        const ocrResponse = await axios.request(ocrOptions);
        console.log('OCR response:', ocrResponse.data);

        // Extract OCR text
        const ocrText = ocrResponse.data.text;

        // Call the OpenAI API with OCR text
        const openAIUrl = 'https://api.openai.com/v1/completions';
        const openAIHeaders = {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json'
        };

        const openAIRequestBody = {
            "model": "text-davinci-003",
            "prompt": `Context: ${ocrText},Q:create simple report to claim the NFt insurance from based on the context ? `, // Use the extracted OCR text as the prompt
            "temperature": 0,
            "max_tokens": 256,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0
        };

        const openAIResponse = await axios.post(openAIUrl, openAIRequestBody, { headers: openAIHeaders });
        console.log('OpenAI Response:', openAIResponse.data);

        res.json(openAIResponse.data.choices[0].text); // Return the generated text from OpenAI
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during conversion, OCR, or OpenAI request' });
    }
});
app.get('/delayloop', (req, res) => {
    let count = 1;
  
    function loop() {
      if (count <= 3) {
        console.log("Loop", count);
        count++;
  
        setTimeout(loop, 2000); // Delay for 2 seconds (2000 milliseconds)
      } else {
        res.send('Loop completed.'); // Send response after loop completes
      }
    }
  
    loop(); // Start the loop
  });

// Start the server
const PORT = 8800; // You can change this port if needed
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
module.exports.handler=serverless(app);