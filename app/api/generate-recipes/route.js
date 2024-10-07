import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(AIzaSyCmKsICceCi8Gls7KpNTBil1-PoyZU9PzQ);

export async function POST(req) {
  try {
    // Parse the request body to extract pantry items
    const { pantryItems } = await req.json();

    // Create the model and prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Given the following pantry items: ${pantryItems}. Suggest some recipes and websites that I could follow along to. 
    Provide the following in this format, Do not give any further questions or sentences, simply give the recipes, descriptions, and websites. For websites don't double link the website. 
    1. Name of the Dish
    Description of the Dish
    Website for the Dish
    2. Name of the Dish
    Description of the Dish
    Website for the Dish`

    // Generate content using the Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Ensure response is in the expected format
    if (result && text) {
      const recipes = text.replace(/\*/g, '').trim().split("\n").filter(recipe => recipe);
      return new Response(JSON.stringify({ recipes }), { status: 200 });
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error generating recipes:', error);
    return new Response(JSON.stringify({ error: 'Error generating recipes' }), { status: 500 });
  }
}