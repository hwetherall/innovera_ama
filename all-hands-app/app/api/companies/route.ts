import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Company, CustomerConversationWithSummary, CompanyWithConversationsAndSummaries } from '@/types/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const withConversationsAndSummaries = req.nextUrl.searchParams.get('withConversationsAndSummaries') === 'true';

    if (withConversationsAndSummaries) {
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
      const result = Object.values(companyMap);
      return NextResponse.json(result);
    } else {
      const { data, error } = await supabase
        .from('client_companies')
        .select('*')
        .order('company_name', { ascending: true });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { company_name, company_type } = await req.json();

    if (!company_name || !company_type) {
      return NextResponse.json({ error: 'Company Name and Company Type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('client_companies')
      .insert([{ company_name, company_type }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}