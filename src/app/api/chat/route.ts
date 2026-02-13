import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

// Knowledge base about PraktikFinder
const SYSTEM_PROMPT = `Du är PraktikFinder-assistenten. Svara kort, direkt och professionellt. Inga emojis. Max 2-3 meningar per svar.

PraktikFinder matchar studenter med företag för praktik (PRAO, APL, LIA).

Regler:
- Svara endast på det som frågas
- Var koncis, inga listor om det inte behövs
- Inga hälsningsfraser eller utfyllnad
- Om du inte vet, säg det kort`;

// Simple keyword-based responses for when no AI API is configured
const FALLBACK_RESPONSES: Record<string, string> = {
  praktik:
    'PraktikFinder stödjer PRAO, APL, LIA och allmän praktik. Ange din typ i profilen för bättre matchningar.',
  matchning:
    'Matchning baseras på stad, praktiktyp och bransch. Se dina matchningar under "Matchningar" i menyn.',
  registrera:
    'Klicka "Kom igång", välj roll (student/företag/skola), fyll i uppgifter och verifiera din e-post.',
  företag:
    'Under "Företag" kan du hantera profil, ange praktiktyper och se matchade studenter.',
  student:
    'Under "Profil" anger du preferenser. Matchade företag visas under "Matchningar".',
  skola:
    'Under "Skolor" kan du importera studenter via CSV och följa deras praktikstatus.',
  hjälp:
    'Fråga om: praktiktyper, matchning, registrering, profil eller specifik roll.',
  kontakt: 'Kontakta support@praktikfinder.se. Svar inom 24h vardagar.'
};

function getFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // Default response
  return 'Tack för din fråga! Jag är PraktikFinder AI-assistenten.\n\nJag kan hjälpa dig med:\n• Information om praktiktyper (PRAO, APL, LIA)\n• Hur matchning fungerar\n• Registrering och profil\n• Tips för studenter och företag\n\nSkriv "hjälp" för att se alla ämnen jag kan hjälpa med, eller ställ en specifik fråga!';
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Check if NVIDIA API key is configured (primary)
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;

    if (nvidiaApiKey) {
      try {
        const nvidiaResponse = await fetch(
          'https://integrate.api.nvidia.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${nvidiaApiKey}`,
              Accept: 'application/json'
            },
            body: JSON.stringify({
              model: 'mistralai/mistral-large-3-675b-instruct-2512',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.slice(-10)
              ],
              max_tokens: 50,
              temperature: 0.15,
              top_p: 1.0,
              frequency_penalty: 0.0,
              presence_penalty: 0.0,
              stream: false
            })
          }
        );

        if (nvidiaResponse.ok) {
          const data = await nvidiaResponse.json();
          const assistantMessage = data.choices?.[0]?.message?.content;

          if (assistantMessage) {
            return NextResponse.json({ message: assistantMessage });
          }
        }

        console.error('NVIDIA API failed, trying fallback');
      } catch (error) {
        console.error('NVIDIA API error:', error);
      }
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (openaiApiKey) {
      try {
        // Use OpenAI API
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.slice(-10) // Keep last 10 messages for context
              ],
              max_tokens: 500,
              temperature: 0.7
            })
          }
        );

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const assistantMessage = data.choices?.[0]?.message?.content;

          if (assistantMessage) {
            return NextResponse.json({ message: assistantMessage });
          }
        }

        // Fall through to fallback if OpenAI fails
        console.error('OpenAI API failed, using fallback');
      } catch (error) {
        console.error('OpenAI API error:', error);
      }
    }

    // Check if Anthropic API key is configured
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicApiKey) {
      try {
        const anthropicResponse = await fetch(
          'https://api.anthropic.com/v1/messages',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 500,
              system: SYSTEM_PROMPT,
              messages: messages.slice(-10).map((m) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              }))
            })
          }
        );

        if (anthropicResponse.ok) {
          const data = await anthropicResponse.json();
          const assistantMessage = data.content?.[0]?.text;

          if (assistantMessage) {
            return NextResponse.json({ message: assistantMessage });
          }
        }

        console.error('Anthropic API failed, using fallback');
      } catch (error) {
        console.error('Anthropic API error:', error);
      }
    }

    // Use fallback responses
    const fallbackResponse = getFallbackResponse(lastUserMessage.content);
    return NextResponse.json({ message: fallbackResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Health check
export async function GET() {
  const hasNvidia = !!process.env.NVIDIA_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    status: 'ok',
    endpoint: 'chat',
    aiProvider: hasNvidia
      ? 'nvidia'
      : hasOpenAI
        ? 'openai'
        : hasAnthropic
          ? 'anthropic'
          : 'fallback',
    description: 'PraktikFinder AI Chat API'
  });
}
