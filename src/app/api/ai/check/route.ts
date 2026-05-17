import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DocumentState } from '@/types'

const RATE_LIMIT = 10

async function checkRateLimit(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single()

  if ((data?.count ?? 0) >= RATE_LIMIT) return false

  await supabase.from('ai_usage').upsert(
    { user_id: userId, usage_date: today, count: (data?.count ?? 0) + 1 },
    { onConflict: 'user_id,usage_date' }
  )
  return true
}

function buildPrompt(doc: DocumentState): string {
  const fields = [
    ['Trích yếu', doc.docSummary],
    ['Kính gửi / Gửi đến', doc.recipient],
    ['Căn cứ pháp lý', doc.legalBasis],
    ['Đặt vấn đề', doc.issueStatement],
    ['Nội dung chính', doc.mainContent.substring(0, 1000)],
    ['Kết luận', doc.conclusion],
  ].filter(([, v]) => v?.trim()).map(([k, v]) => `${k}: ${v}`).join('\n')

  return `Bạn là chuyên gia ngôn ngữ tiếng Việt. Hãy kiểm tra lỗi chính tả trong các trường nội dung dưới đây.

${fields}

Trả về JSON với định dạng:
{"issues": [{"field": "tên trường có lỗi", "type": "error|warning", "description": "từ bị sai chính tả", "suggestion": "cách viết đúng"}]}

Nếu không có lỗi chính tả: {"issues": []}
Chỉ trả về JSON, không giải thích thêm.`
}

async function callDeepSeek(prompt: string) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

async function callOpenAI(prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

async function callGemini(prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  )
  const data = await res.json()
  return JSON.parse(data.candidates[0].content.parts[0].text)
}

async function callAnthropic(prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return JSON.parse(data.content[0].text)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const allowed = await checkRateLimit(user.id, supabase)
    if (!allowed) return NextResponse.json({ error: 'Đã đạt giới hạn 10 lần kiểm tra hôm nay' }, { status: 429 })

    const { provider, documentData }: { provider: string; documentData: DocumentState } = await request.json()
    const prompt = buildPrompt(documentData)

    let result
    switch (provider) {
      case 'openai': result = await callOpenAI(prompt); break
      case 'gemini': result = await callGemini(prompt); break
      case 'anthropic': result = await callAnthropic(prompt); break
      default: result = await callDeepSeek(prompt)
    }

    return NextResponse.json(result)
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Lỗi khi gọi AI' }, { status: 500 })
  }
}
