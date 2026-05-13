import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Tên không hợp lệ' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (existing) return NextResponse.json({ error: 'Bạn đã thuộc một tổ chức' }, { status: 400 })

    const slug = name.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) + '-' + Date.now().toString(36)

    const { data: tenant, error } = await admin
      .from('tenants')
      .insert({ name: name.trim(), slug })
      .select('id')
      .single()

    if (error || !tenant) return NextResponse.json({ error: 'Không thể tạo tổ chức' }, { status: 500 })

    await admin.from('tenant_members').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'admin',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
