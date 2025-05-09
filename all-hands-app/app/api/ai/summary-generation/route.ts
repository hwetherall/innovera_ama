import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {

    const { transcriptContent, notes, client_company, customer_name, innovera_person, tags } = await req.json();
    
    if (!transcriptContent) {
      return NextResponse.json({ error: 'Missing transcript content' }, { status: 400 });
    }

    const prompt = `

Below is a meeting <transcript> followed by <notes>. Please provide a concise summary of the key points discussed in the meeting, using the notes as guidance. Prioritize using bullets but avioid using onlybullets. This is a meeting between Innovera and a client or prospect company called ${client_company}. The handler of the meeting on the client side is ${customer_name} and the Innovera representative is ${innovera_person}.

This meeting is tagged with the following tags: ${tags}. Consider these tags for your context. Specifically, if a meeting is tagged with a tag Feedback, it means the customer is giving feedback on the product for us. Focous the summary on the pain points provided and the suggestions for improvements. If a meeting is tagged with a tag Demo, it means we are demoing the product or a new feature to the client. Focus the summary on the customer's reaction to the demo and the feedback they provide.

## GUIDELINES:
1.There might be other people in the meeting beyond ${customer_name} and ${innovera_person} from both companies. For each different person infer the relarionships/affiliations based on the context and consider that information for your context.
2. If applicable, you can use the notes as guidance to understand important points discussed in the meeting or additional context.
3. Consider that the transcript was generated automatically from a live meeting, so grammar mistakes and other issues may exist.

<Transcript>
${transcriptContent}
</Transcript>

<Notes>
${notes || 'No additional notes provided.'}
</Notes>

## OUTPUT FORMAT:
Return ONLY a raw JSON object with the following structure, without any markdown formatting or code blocks:
{
  "summary": "Summary of the meeting",
  "people": "Bullet list ([name] - [company]) of all people in the meeting including both mapped and inferred people"
}

Do not include any markdown formatting, code blocks, or additional text. Return only the raw JSON object.
`;

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Failed to generate summary' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsedContent = JSON.parse(content);
      const formattedResponse = `${parsedContent.people}\n\n${parsedContent.summary}`;
      
      return NextResponse.json({ summary: formattedResponse });
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return NextResponse.json({ error: 'Failed to parse summary response' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
