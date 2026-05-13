import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code?.trim()) return NextResponse.json({ error: 'Mã không hợp lệ' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const admin = createAdminClient()

    const { data: invite } = await admin
      .from('invite_links')
      .select('tenant_id, expires_at, used')
      .eq('code', code.trim())
      .single()

    if (!invite) return NextResponse.json({ error: 'Mã mời không tồn tại' }, { status: 404 })
    if (invite.used) return NextResponse.json({ error: 'Mã mời đã được sử dụng' }, { status: 400 })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Mã mời đã hết hạn' }, { status: 400 })

    await Promise.all([
      admin.from('tenant_members').insert({ tenant_id: invite.tenant_id, user_id: user.id, role: 'member' }),
      admin.from('invite_links').update({ used: true }).eq('code', code.trim()),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
