import { NextResponse } from 'next/server'

const SYSTEM_PROMPT =
  'Bạn là chuyên gia soạn thảo văn bản hành chính Việt Nam theo Nghị định 30/2020/NĐ-CP. Hãy viết nội dung rõ ràng, súc tích, đúng thể thức.'

async function callAnthropic(apiKey: string, userMessage: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `Lỗi Anthropic API: ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text as string
}

async function callGemini(apiKey: string, userMessage: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `Lỗi Gemini API: ${res.status}`)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}

async function callDeepSeek(apiKey: string, userMessage: string) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `Lỗi DeepSeek API: ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content as string
}

export async function POST(request: Request) {
  try {
    const { apiKey, prompt, docContent, provider = 'anthropic' } = await request.json()
    if (!apiKey?.trim()) return NextResponse.json({ error: 'Thiếu API key' }, { status: 400 })
    if (!prompt?.trim()) return NextResponse.json({ error: 'Thiếu yêu cầu' }, { status: 400 })

    const userMessage = docContent?.trim()
      ? `Dựa trên nội dung tài liệu đính kèm:\n\n${docContent.substring(0, 8000)}\n\n---\n\n${prompt}`
      : prompt

    let suggestion: string
    switch (provider) {
      case 'gemini':
        suggestion = await callGemini(apiKey.trim(), userMessage)
        break
      case 'deepseek':
        suggestion = await callDeepSeek(apiKey.trim(), userMessage)
        break
      default:
        suggestion = await callAnthropic(apiKey.trim(), userMessage)
    }

    return NextResponse.json({ suggestion })
  } catch (e: unknown) {
    console.error(e)
    const message = e instanceof Error ? e.message : 'Lỗi server'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
