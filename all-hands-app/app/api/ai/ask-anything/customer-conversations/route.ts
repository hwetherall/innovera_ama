import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Company, CustomerConversationWithSummary, CompanyWithConversationsAndSummaries, Tag } from '@/types/supabase';
import { AskAnythingRequestBody, AskAnythingResponse, OpenRouterResponse } from '@/types/ai-generation';	

// POST /api/ai/ask-anything/customer-conversations - Direct question answering
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = (await request.json()) as AskAnythingRequestBody;
    
    // Validate required fields
    if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
      return NextResponse.json(
        { error: 'Question is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    
    // Fetch companies
    const { data: companies, error: companiesError } = await supabase
    .from('client_companies')
    .select('*')
    .order('company_name', { ascending: true });
    if (companiesError) {
        return NextResponse.json({ error: companiesError.message }, { status: 500 });
    }

    // Fetch all conversations with summaries
    const { data: conversations, error: convError } = await supabase
        .from('customer_conversations_with_summary')
        .select('*');
    if (convError) {
        return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Group conversations by company
    const companyMap: Record<string, CompanyWithConversationsAndSummaries> = {};
    
    (companies as Company[]).forEach((company) => {
        companyMap[company.id] = { ...company, conversations: [] };
    });
    
    (conversations as CustomerConversationWithSummary[]).forEach((conv) => {
        if (companyMap[conv.company_id]) {
        companyMap[conv.company_id].conversations.push(conv);
        }
    });

    //Fetch all tags
    const { data: allTags, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
    if (tagsError) {
      return NextResponse.json({ error: tagsError.message }, { status: 500 });
    }

    //Replace in tag_ids array the ids for the tag name for each conversation for all companies
    for (const company of Object.values(companyMap)) {
        company.conversations.forEach((conv) => {
            conv.tag_id = conv.tag_id.map((tag) => (allTags as Tag[]).find((t) => t.id === tag)?.name).filter((name): name is string => name !== undefined);
        });
    }

    // 2. Build the prompt with <month_year>...</month_year> and <resources>...</resources>
    let allCompaniesAndAllConversations = '';

    for (const company of Object.values(companyMap)) {
        let companyConversations = `<${company.company_name}>\n`;
        company.conversations.forEach((conv) => {
            const convContent = `<conversation - ${conv.date}>\nTags: ${conv.tag_id.join(', ')}\nSummary:\n${conv.summary_content}\n</conversation - ${conv.date}>\n\n`;
            companyConversations += convContent;
        });
        companyConversations += `</${company.company_name}>\n\n`;
        allCompaniesAndAllConversations += companyConversations;
    }

    // 3. Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const prompt = `
You are answering questions based on summaries of customer meetings.The user's QUESTION is: "${body.question}"

## GUIDELINES:

Please answer based ONLY on information found in the provided conversations. Each client logged in this system have all its available conversations under the <client_name>...</client_name> tags. Each summary is wrapped in <conversation - date>...</conversation - date> tags where the date is the date of the meeting. Each conversation contains the tags assigned for that conversation and the summary. Give higher relevance to more recent meetings.

If you can't find a clear answer in any conversation, respond with: "I don't have enough information to answer this question confidently."

Generate a confidence score between 0-1 indicating how confident you are in the answer, hence, with how much certainty you can say that the answer is correct. A score of 0 means you are not confident at all in the answer, and a score of 1 means you are very confident in the answer. If the question wasn't answered in the transcript, return a score that reflects how confident you are that the question wasn't answered.


## CLIENTS AND CONVERSATIONS:
${allCompaniesAndAllConversations}

Your answer should be helpful, concise, and based only on the provided information.
Also provide the meeting dates where you found the information in your answer.


## OUTPUT FORMAT:
Format your response as a JSON object with the following fields:
{
  "answer": "Your answer here...",
  "sources": ["Client X > Conversation - Date", "Client Y > Conversation - Date"],
  "confidence": Confidence score between 0-1
}

Verify that the OUTPUT FORMAT is correct and that the JSON is properly formatted. Only return the JSON object, nothing else.
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as OpenRouterResponse;
    const content = data.choices[0].message.content;
    
    try {
      const parsedResponse: AskAnythingResponse = JSON.parse(content);
      // Validate the structure of the response
      if (
        typeof parsedResponse.answer === 'string' &&
        Array.isArray(parsedResponse.sources) &&
        typeof parsedResponse.confidence === 'number'
      ) {
        return NextResponse.json(parsedResponse);
      } else {
        throw new Error('Malformed response from OpenRouter');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', parseError);
      return NextResponse.json({
        answer: "Failed to generate answer due to an error",
        sources: [],
        confidence: 0.0
      });
    }
  } catch (error) {
    console.error('Error in ask-anything customer conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}