'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'create' | 'join'>('join')
  const [tenantName, setTenantName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createTenant() {
    if (!tenantName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tenantName.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  async function joinByInvite() {
    if (!inviteCode.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tenants/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Mã mời không hợp lệ hoặc đã hết hạn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dde3ee]">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🏢</div>
          <h1 className="text-lg font-bold text-[#1a1f36]">Thiết lập tổ chức</h1>
          <p className="text-sm text-[#6b7597] mt-1">Tham gia hoặc tạo đơn vị của bạn</p>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-[#dde1ef] mb-6">
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${tab === 'join' ? 'bg-[#1a56b0] text-white' : 'text-[#6b7597] hover:bg-[#f7f8fc]'}`}
          >
            Nhập mã mời
          </button>
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${tab === 'create' ? 'bg-[#1a56b0] text-white' : 'text-[#6b7597] hover:bg-[#f7f8fc]'}`}
          >
            Tạo đơn vị mới
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {tab === 'join' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6b7597] mb-1.5 uppercase tracking-wide">Mã mời</label>
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Nhập mã mời từ quản trị viên..."
                className="w-full px-3 py-2.5 border-2 border-[#dde1ef] rounded-lg text-sm focus:outline-none focus:border-[#1a56b0] focus:ring-2 focus:ring-[#1a56b0]/10"
              />
            </div>
            <button
              onClick={joinByInvite}
              disabled={loading || !inviteCode.trim()}
              className="w-full bg-[#1a56b0] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1345a0] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang xử lý...' : 'Tham gia đơn vị'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6b7597] mb-1.5 uppercase tracking-wide">Tên đơn vị</label>
              <input
                type="text"
                value={tenantName}
                onChange={e => setTenantName(e.target.value)}
                placeholder="VD: BHXH Cơ sở Cao Lãnh"
                className="w-full px-3 py-2.5 border-2 border-[#dde1ef] rounded-lg text-sm focus:outline-none focus:border-[#1a56b0] focus:ring-2 focus:ring-[#1a56b0]/10"
              />
            </div>
            <button
              onClick={createTenant}
              disabled={loading || !tenantName.trim()}
              className="w-full bg-[#ec4899] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#db2777] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang tạo...' : 'Tạo đơn vị mới'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
