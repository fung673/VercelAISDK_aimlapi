import { z } from 'zod'

// Define response type for AIML API
interface AIMLAPIResponse {
  id: string;
  object: string;
  choices: {
    index: number;
    finish_reason: string;
    logprobs: null | any;
    message: {
      role: string;
      content: string;
    };
  }[];
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Schema for request validation
const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
})

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const body = await req.json()
    const { messages } = RequestSchema.parse(body)

    // Make request to AIML API
    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AIMLAPI_KEY}`
      },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.2', // Ensure this is the correct model name
        messages: messages,
        max_tokens: 512, // Include max_tokens parameter
        stream: false // Include stream parameter
      })
    })

    // Handle API errors
    if (!response.ok) {
      const error = await response.json()
      return new Response(JSON.stringify({ error: error.message }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data: AIMLAPIResponse = await response.json()
    console.log('API response:', data.choices[0].message) // Log the entire response

    // Extract the assistant's message content
    const assistantMessageContent = data.choices[0].message.content

    // Return the response
    return new Response(JSON.stringify({ role: 'assistant', content: assistantMessageContent }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error in chat API route:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}