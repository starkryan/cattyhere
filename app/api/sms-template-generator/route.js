import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Copy functions from f.mjs
const escapeRegex = (s = "") =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function normalizeToSingleLine(str = "") {
  return str
    .replace(/\r?\n|\r/g, " ")  
    .replace(/\s+/g, " ")      
    .trim();
}

function buildSmartOtpRegexList(formats) {
  if (!formats || formats.length === 0) return [];
  if (!Array.isArray(formats)) formats = [formats];

  return formats
    .map((format) => {
      format = normalizeToSingleLine(format);
      if (!format.includes("{otp}")) return null;

      let pattern = escapeRegex(format);

      pattern = pattern.replace(/\\\{otp\\\}/gi, "(?<otp>[A-Za-z0-9\\-]{3,12})"); 
      pattern = pattern.replace(/\\\{date\\\}/gi, ".*");
      pattern = pattern.replace(/\\\{datetime\\\}/gi, ".*");
      pattern = pattern.replace(/\\\{time\\\}/gi, ".*");
      pattern = pattern.replace(/\\\{random\\\}/gi, "[A-Za-z0-9]{3,15}");
      pattern = pattern.replace(/\\\{.*?\\\}/gi, ".*");

      pattern = pattern
        .replace(/\\s+/g, "\\s*")
        .replace(/\\:/g, "[:：]?")
        .replace(/\\\./g, ".*");

      return new RegExp(pattern, "i");
    })
    .filter(Boolean);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { smsText } = await request.json();

    if (!smsText) {
      return NextResponse.json({ error: 'SMS text is required' }, { status: 400 });
    }

    // Function to validate template against SMS
    const validateTemplate = (template, smsText) => {
      const regexList = buildSmartOtpRegexList(template);
      if (regexList.length === 0) {
        return { valid: false, reason: 'No {otp} placeholder found in template' };
      }
      
      const cleanMessage = normalizeToSingleLine(smsText);
      let otpFound = null;
      
      for (const regex of regexList) {
        const match = regex.exec(cleanMessage);
        otpFound = match?.groups?.otp || (match && match[1]) || null;
        if (otpFound) {
          break;
        }
      }
      
      if (!otpFound) {
        return { valid: false, reason: 'Could not extract OTP from SMS using the generated template' };
      }
      
      return { valid: true, otp: otpFound };
    };

    let template;
    let validationResult;
    let attempts = 0;
    const maxAttempts = 3;

    do {
      attempts++;
      
      const prompt = `
You are an expert SMS template generator. Convert the following SMS message into a template using the specific placeholder rules. The template must be compatible with our regex builder system and must successfully extract the OTP from the SMS.

Special placeholders supported:
- {otp} → (?<otp>[A-Za-z0-9\-]{3,12}) - Use for OTP digits/alphanumeric
- {date} / {datetime} / {time} → .* - Use for durations, dates, times
- {random} → [A-Za-z0-9]{3,15} - Use for purely alphanumeric random strings (no special chars like /+)
- {any} → .* - Use as fallback for anything else (links, tokens with special chars)

Rules:
1. Always replace OTP digits/alpha with {otp}
2. Durations → {time}
3. Random purely alphanumeric → {random}
4. Random with /, +, . → {any}
5. Keep static text exactly as-is
6. Only 1 {otp} per template
7. Spaces collapse into \\s*
8. : matches : or ：
9. . matches .*

Example:
SMS: "<#> 1770 is your OTP to login into Airtel Thanks app. Valid for 100 secs. Do not share with anyone. If this was not you click i.airtel.in/Contact N9BWuqauU1y"
Template: "<#> {otp} is your OTP to login into Airtel Thanks app. Valid for {time}. Do not share with anyone. If this was not you click {any} {random}"

${validationResult && !validationResult.valid ? `Previous attempt failed: ${validationResult.reason}. Please try again with a better template.` : ''}

Now convert this SMS:
"${smsText}"

Return ONLY the template string, nothing else.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert SMS template generator. Return ONLY the template string, no explanations. Ensure the template contains exactly one {otp} placeholder and can extract the OTP from the SMS."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      });

      template = completion.choices[0]?.message?.content?.trim();
      
      if (!template) {
        throw new Error('Failed to generate template');
      }

      // Clean the template - remove any surrounding quotes or unwanted characters
      template = template.replace(/^"+|"+$/g, '').trim();
      
      // Validate the generated template
      validationResult = validateTemplate(template, smsText);

    } while (!validationResult.valid && attempts < maxAttempts);

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: `Failed to generate valid template after ${maxAttempts} attempts. Last error: ${validationResult.reason}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      template,
      extractedOtp: validationResult.otp 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
