// src/services/openai.service.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Cho phép gọi từ browser
})

export interface TranslateOptions {
  text: string
  fromLang?: string
  toLang?: string
}

/**
 * Dịch văn bản sử dụng OpenAI GPT
 */
export async function translateText({
  text,
  fromLang = 'Vietnamese',
  toLang = 'English'
}: TranslateOptions): Promise<string> {
  try {
    if (!text.trim()) {
      return ''
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the text from ${fromLang} to ${toLang}.
          Maintain the original formatting, HTML tags, and structure.
          Keep technical terms and brand names unchanged.
          Provide only the translation without any explanations.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3, // Giảm nhiệt độ để dịch chính xác hơn
      max_tokens: 4000
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error: any) {
    console.error('Translation error:', error)
    throw new Error(error.message || 'Lỗi khi dịch văn bản')
  }
}

/**
 * Dịch nhiều đoạn văn bản cùng lúc trong 1 API call duy nhất
 */
export async function translateBulk(
  texts: Record<string, string>,
  fromLang = 'Vietnamese',
  toLang = 'English'
): Promise<Record<string, string>> {
  try {
    // Lọc ra các field có nội dung
    const fieldsToTranslate = Object.entries(texts).filter(([_, value]) => value.trim())

    if (fieldsToTranslate.length === 0) {
      return {}
    }

    // Tạo cấu trúc JSON để gửi cho AI
    const inputJSON = Object.fromEntries(fieldsToTranslate)

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate all text values from ${fromLang} to ${toLang}.

CRITICAL INSTRUCTIONS:
- Maintain all HTML tags, formatting, and structure EXACTLY as they appear
- Keep technical terms and brand names unchanged
- Translate ONLY the text content, not the JSON keys
- Return ONLY valid JSON without any explanations or markdown
- The output must be parseable JSON

Input format: {"field1": "text1", "field2": "text2"}
Output format: {"field1": "translated text1", "field2": "translated text2"}`
        },
        {
          role: 'user',
          content: JSON.stringify(inputJSON, null, 2)
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })

    const responseText = completion.choices[0]?.message?.content || '{}'

    // Parse JSON response
    let translatedData: Record<string, string>
    try {
      // Loại bỏ markdown code blocks nếu có
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim()
      translatedData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      throw new Error('AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.')
    }

    return translatedData
  } catch (error: any) {
    console.error('Bulk translation error:', error)
    throw new Error(error.message || 'Lỗi khi dịch nội dung')
  }
}

/**
 * Tạo meta description từ nội dung
 */
export async function generateMetaDescription(content: string, maxLength = 160): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Generate a concise meta description (max ${maxLength} characters) that summarizes the content.
          Make it engaging and SEO-friendly. Output only the meta description without quotes.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error: any) {
    console.error('Meta description generation error:', error)
    throw new Error('Lỗi khi tạo meta description')
  }
}
