import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DocumentState } from '@/types'

const RATE_LIMIT = 100

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
    ['Nội dung chính', doc.mainContent.substring(0, 4000)],
    ['Kết luận', doc.conclusion],
  ].filter(([, v]) => v?.trim()).map(([k, v]) => `--- ${k} ---\n${v}`).join('\n\n')

  return `Bạn là chuyên gia kiểm tra văn bản hành chính nhà nước Việt Nam.
Nhiệm vụ: Rà soát và phát hiện LỖI CHÍNH TẢ TIẾNG VIỆT trong văn bản sau.

## QUY TẮC KIỂM TRA

**1. Lỗi chính tả thuần túy:**
- Sai phụ âm đầu: d/gi/z, ch/tr, s/x, l/n, r/d/gi — ví dụ: "dải thích" → "giải thích", "cần cứ" → "căn cứ"
- Sai vần: ao/au, ưu/ươu, iêu/iu, ăn/ân, ơn/on — ví dụ: "thực hiên" → "thực hiện", "thiếc" → "thiết"
- Sai thanh điệu (hỏi/ngã): "ẩn/ẫn", "mẩu/mẫu" — ví dụ: "qủa" → "quả", "bão hiểm" → "bảo hiểm"
- Thiếu hoặc thừa dấu phụ: ă/a, ơ/o, ê/e, ô/o, ư/u, đ/d — ví dụ: "cơ quản" → "cơ quan"

**2. Lỗi dùng từ sai trong văn bản hành chính:**
- Nhầm từ đồng âm: "tham quan" ≠ "thăm quan", "chín muồi" ≠ "chín mùi"
- Dùng từ không chuẩn hành chính: "kiêm tra" → "kiểm tra", "dự thão" → "dự thảo"
- Lẫn lộn từ gần âm: "khoản/khoảng", "điều/điếu", "phải/phãi"

**3. Lỗi viết hoa không đúng quy định (Nghị định 30/2020/NĐ-CP):**
- Tên cơ quan, tổ chức nhà nước phải viết hoa chữ cái đầu mỗi từ
- Chức danh, chức vụ đứng trước tên người phải viết hoa
- Địa danh hành chính phải viết hoa

## KHÔNG BÁO LỖI VỚI (bắt buộc bỏ qua):
- Chữ viết tắt: BHYT, BHXH, NĐ-CP, TT-BYT, QĐ, CV, KCB, DVKT, v.v.
- Mã văn bản, số hiệu: 30/2020/NĐ-CP, 26/2025/TT-BYT, 4790/QĐ-BYT
- Số liệu, ngày tháng, tiền tệ, tỷ lệ phần trăm
- Thuật ngữ y tế, pháp lý chuyên ngành đã chuẩn
- Các từ thông thường viết thường trong câu (không phải tên riêng): "công văn", "thông tư", "báo cáo" viết thường KHÔNG phải lỗi khi đứng trong câu bình thường

## YÊU CẦU ĐỊNH DẠNG KẾT QUẢ (bắt buộc):
- "field": tên trường chứa lỗi (một trong: Trích yếu / Kính gửi / Gửi đến / Căn cứ pháp lý / Đặt vấn đề / Nội dung chính / Kết luận)
- "type": "error" cho lỗi chính tả/dùng từ, "warning" cho lỗi viết hoa
- "description": PHẢI là từ hoặc cụm từ NGẮN (tối đa 5 từ) trích nguyên văn từ văn bản. KHÔNG trả về cả câu hay đoạn văn.
- "suggestion": cách viết đúng ngắn gọn tương đương (cùng số từ với description)
- Nếu không xác định được từ cụ thể bị sai, KHÔNG báo lỗi đó.

## Nội dung cần kiểm tra:

${fields}

Trả về JSON thuần túy (không có markdown, không có \`\`\`):
{"issues": [{"field": "tên trường", "type": "error|warning", "description": "từ/cụm từ ngắn bị sai", "suggestion": "cách viết đúng"}]}

Nếu không phát hiện lỗi: {"issues": []}
CHỈ trả về JSON, không kèm giải thích hay văn bản khác.`
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
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `Lỗi Gemini API: ${res.status}`)
  }
  const data = await res.json()
  return JSON.parse(data.candidates[0].content.parts[0].text)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const allowed = await checkRateLimit(user.id, supabase)
    if (!allowed) return NextResponse.json({ error: 'Đã đạt giới hạn 10 lần kiểm tra hôm nay' }, { status: 429 })

    const { documentData }: { documentData: DocumentState } = await request.json()
    const prompt = buildPrompt(documentData)
    const result = await callGemini(prompt)

    return NextResponse.json(result)
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Lỗi khi gọi AI' }, { status: 500 })
  }
}
