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

  return `Bạn là chuyên gia kiểm tra chính tả tiếng Việt cho văn bản hành chính nhà nước.

Nhiệm vụ: Tìm các LỖI CHÍNH TẢ THỰC SỰ trong nội dung dưới đây. Chỉ báo lỗi khi TỪ BỊ VIẾT SAI ÂM/VẦN/DẤU so với chuẩn tiếng Việt.

CÁC LOẠI LỖI CẦN TÌM (chỉ lỗi âm/vần/dấu, không phải hoa/thường):
- Sai dấu thanh: "qủa" → "quả", "bão hiểm" → "bảo hiểm", "lựa chọng" → "lựa chọn"
- Sai phụ âm đầu: "dải thích" → "giải thích", "rẫn" → "dẫn", "xác nhận" ↔ "sác nhận"
- Sai vần/nguyên âm: "thiếc" → "thiết", "đoàng" → "đường", "thực hiên" → "thực hiện"
- Viết thiếu/thừa chữ: "cơ quản" → "cơ quan", "kiêm tra" → "kiểm tra", "cần cứ" → "căn cứ"

KHÔNG BÁO LỖI VỚI (bắt buộc bỏ qua):
- Viết hoa/viết thường: "công văn", "thông tư", "thông báo", "bảo hiểm xã hội" viết thường KHÔNG phải lỗi
- Chữ viết tắt: BHYT, BHXH, NĐ-CP, TT-BYT, QĐ, CV, KCB, DVKT, v.v.
- Mã văn bản: 30/2020/NĐ-CP, 26/2025/TT-BYT, 4790/QĐ-BYT, v.v.
- Số liệu, ngày tháng, tiền tệ, tỷ lệ phần trăm
- Tên riêng, tên cơ quan, địa danh: Đồng Tháp, Cao Lãnh, Bệnh viện Mắt Sài Gòn, v.v.
- Thuật ngữ y tế, pháp lý chuyên ngành

YÊU CẦU VỀ ĐỊNH DẠNG KẾT QUẢ (bắt buộc):
- "description": PHẢI là từ hoặc cụm từ NGẮN (tối đa 5 từ) bị viết sai, trích nguyên văn từ văn bản. KHÔNG được trả về cả câu hoặc đoạn văn dài.
- "suggestion": cách viết đúng ngắn gọn tương đương với description (cùng số từ)
- Nếu không tìm được từ cụ thể bị sai, KHÔNG báo lỗi đó.

Nội dung cần kiểm tra:

${fields}

Trả về JSON thuần túy (không có markdown, không có \`\`\`):
{"issues": [{"field": "tên trường chứa lỗi", "type": "error", "description": "từ/cụm từ ngắn bị viết sai", "suggestion": "cách viết đúng ngắn gọn"}]}

Nếu không phát hiện lỗi chính tả: {"issues": []}
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
