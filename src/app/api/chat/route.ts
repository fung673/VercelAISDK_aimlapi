import { z } from 'zod'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { generateText } from 'ai'

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

// Create a custom provider instance
const provider = createOpenAICompatible({
  name: 'aimlapi',
  headers: {
    Authorization: `Bearer ${process.env.AIMLAPI_KEY}`,
  },
  baseURL: 'https://api.aimlapi.com/v1',
})

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const body = await req.json()
    const { messages } = RequestSchema.parse(body)

    // Generate text using the provider
    const result = await generateText({
      model: provider('gpt-4o'),
      prompt: messages.map(msg => msg.content).join('\n'),
      maxTokens: 512
    })

    // Extract the generated text
    const assistantMessageContent = result.text

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