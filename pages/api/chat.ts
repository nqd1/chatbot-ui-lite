import { Message } from "@/types";
import { OpenAIStream } from "@/utils";

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { messages } = (await req.json()) as {
      messages: Message[];
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required and must be an array', { status: 400 });
    }

    const charLimit = 12000;
    let charCount = 0;
    let messagesToSend = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (charCount + message.content.length > charLimit) {
        break;
      }
      charCount += message.content.length;
      messagesToSend.push(message);
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key is missing', { status: 500 });
    }

    const stream = await OpenAIStream(messagesToSend);
    return new Response(stream);
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export default handler;
