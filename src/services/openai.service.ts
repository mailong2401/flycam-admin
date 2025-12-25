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
 * Dịch nhiều đoạn văn bản cùng lúc
 */
export async function translateBulk(
  texts: Record<string, string>,
  fromLang = 'Vietnamese',
  toLang = 'English'
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const [key, value] of Object.entries(texts)) {
    if (value.trim()) {
      results[key] = await translateText({ text: value, fromLang, toLang })
    } else {
      results[key] = ''
    }
  }

  return results
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
