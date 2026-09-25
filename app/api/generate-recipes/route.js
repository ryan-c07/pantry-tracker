import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-only key; NEXT_PUBLIC_ fallback kept so existing deployments keep working.
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const MAX_ITEMS = 100;
const MAX_ITEM_LENGTH = 60;

export async function POST(req) {
  if (!apiKey) {
    return Response.json({ error: 'Recipe generation is not configured (missing GEMINI_API_KEY).' }, { status: 500 });
  }

  let pantryItems;
  try {
    ({ pantryItems } = await req.json());
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!Array.isArray(pantryItems)) {
    return Response.json({ error: 'pantryItems must be an array of strings.' }, { status: 400 });
  }
  const items = pantryItems
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().slice(0, MAX_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
  if (items.length === 0) {
    return Response.json({ error: 'Add some pantry items first.' }, { status: 400 });
  }

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const prompt = `You are a helpful cook. Given these pantry items: ${items.join(', ')}.
Suggest 3 to 5 recipes that mainly use these ingredients.
Respond with only a JSON array. Each element must be an object with:
- "name": the dish name
- "description": one or two sentences describing the dish and which pantry items it uses
- "url": a real recipe website URL (https://...) where the user could follow along`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    const list = Array.isArray(parsed) ? parsed : parsed?.recipes;
    if (!Array.isArray(list)) throw new Error('Unexpected response format');

    const recipes = list
      .filter((r) => r && typeof r.name === 'string')
      .map((r) => ({
        name: r.name.trim(),
        description: typeof r.description === 'string' ? r.description.trim() : '',
        url: typeof r.url === 'string' && /^https?:\/\//i.test(r.url) ? r.url : null,
      }));

    return Response.json({ recipes });
  } catch (error) {
    console.error('Error generating recipes:', error);
    return Response.json({ error: 'Could not generate recipes. Please try again.' }, { status: 500 });
  }
}
