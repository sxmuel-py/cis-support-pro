import OpenAI from 'openai';

export interface TriageResult {
  classification: 'support_request' | 'junk';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'hardware' | 'software' | 'network' | 'access' | 'email' | 'other';
  reasoning: string;
}

export async function triageEmailWithLLM(
  from: string,
  subject: string,
  body: string
): Promise<TriageResult> {
  // If no API key, use keyword fallback immediately
  if (!process.env.OPENAI_API_KEY) {
    console.log('No OPENAI_API_KEY found, using keyword triage');
    return triageEmailWithKeywords(from, subject, body);
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an IT support ticket classifier for a school (CIS Lagos). Analyze this email and determine if it's a legitimate support request or junk/spam.

Email Details:
- From: ${from}
- Subject: ${subject}
- Body: ${body.substring(0, 1000)} ${body.length > 1000 ? '...(truncated)' : ''}

Classify as:
- "support_request" if it's asking for IT help, reporting an issue, requesting access/assistance, or any legitimate IT-related inquiry
- "junk" if it's spam, marketing, automated notifications, newsletters, or not IT-related

Also determine:
- Priority: low (general questions), medium (non-urgent issues), high (affecting work), urgent (critical/security)
- Category: hardware, software, network, access, email, other

Respond ONLY with valid JSON in this exact format:
{
  "classification": "support_request" | "junk",
  "priority": "low" | "medium" | "high" | "urgent",
  "category": "hardware" | "software" | "network" | "access" | "email" | "other",
  "reasoning": "Brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an IT support ticket classifier. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const result = JSON.parse(content) as TriageResult;

    // Validate response
    if (!result.classification || !result.priority || !result.category) {
      throw new Error('Invalid LLM response format');
    }

    return result;
  } catch (error) {
    console.error('LLM triage error:', error);
    
    // Fallback to keyword-based triage
    return triageEmailWithKeywords(from, subject, body);
  }
}

export function triageEmailWithKeywords(
  from: string,
  subject: string,
  body: string
): TriageResult {
  const text = `${subject} ${body}`.toLowerCase();

  // Junk indicators
  const junkKeywords = [
    'unsubscribe',
    'marketing',
    'promotion',
    'newsletter',
    'no-reply',
    'noreply',
    'automated',
    'do not reply',
    'click here',
    'buy now',
    'limited time',
    'act now',
  ];

  const isJunk = junkKeywords.some((keyword) => text.includes(keyword));

  if (isJunk) {
    return {
      classification: 'junk',
      priority: 'low',
      category: 'other',
      reasoning: 'Detected junk/marketing keywords',
    };
  }

  // Support request indicators
  const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'down', 'not working'];
  const highKeywords = ['broken', 'error', 'failed', 'cannot', "can't", 'unable', 'issue'];
  const accessKeywords = ['access', 'password', 'login', 'account', 'permission', 'locked out'];
  const networkKeywords = ['network', 'wifi', 'internet', 'connection', 'vpn'];
  const hardwareKeywords = ['computer', 'laptop', 'printer', 'monitor', 'keyboard', 'mouse', 'hardware'];
  const softwareKeywords = ['software', 'application', 'program', 'install', 'update'];
  const emailKeywords = ['email', 'outlook', 'gmail', 'mail'];

  // Determine priority
  let priority: TriageResult['priority'] = 'medium';
  if (urgentKeywords.some((k) => text.includes(k))) {
    priority = 'urgent';
  } else if (highKeywords.some((k) => text.includes(k))) {
    priority = 'high';
  } else if (text.includes('help') || text.includes('question')) {
    priority = 'low';
  }

  // Determine category
  let category: TriageResult['category'] = 'other';
  if (accessKeywords.some((k) => text.includes(k))) {
    category = 'access';
  } else if (networkKeywords.some((k) => text.includes(k))) {
    category = 'network';
  } else if (hardwareKeywords.some((k) => text.includes(k))) {
    category = 'hardware';
  } else if (softwareKeywords.some((k) => text.includes(k))) {
    category = 'software';
  } else if (emailKeywords.some((k) => text.includes(k))) {
    category = 'email';
  }

  return {
    classification: 'support_request',
    priority,
    category,
    reasoning: 'Keyword-based classification (LLM fallback)',
  };
}
