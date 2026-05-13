import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey, prompt, docContent } = await request.json()
    if (!apiKey?.trim()) return NextResponse.json({ error: 'Thiếu API key' }, { status: 400 })
    if (!prompt?.trim()) return NextResponse.json({ error: 'Thiếu yêu cầu' }, { status: 400 })

    const userMessage = docContent?.trim()
      ? `Dựa trên nội dung tài liệu đính kèm:\n\n${docContent.substring(0, 8000)}\n\n---\n\n${prompt}`
      : prompt

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: 'Bạn là chuyên gia soạn thảo văn bản hành chính Việt Nam theo Nghị định 30/2020/NĐ-CP. Hãy viết nội dung rõ ràng, súc tích, đúng thể thức.',
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json(
        { error: err.error?.message || `Lỗi API: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json({ suggestion: data.content[0].text })
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
