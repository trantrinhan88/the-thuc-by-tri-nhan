'use client'

import { useState } from 'react'
import { DocumentState, AIIssue } from '@/types'

type Provider = 'deepseek' | 'openai' | 'gemini' | 'anthropic'

const PROVIDERS: { value: Provider; label: string; color: string }[] = [
  { value: 'deepseek', label: 'DeepSeek', color: '#6366f1' },
  { value: 'openai', label: 'OpenAI', color: '#10a37f' },
  { value: 'gemini', label: 'Gemini', color: '#4285f4' },
  { value: 'anthropic', label: 'Claude', color: '#c97d4e' },
]

interface AIPanelProps {
  documentState: DocumentState
}

export default function AIPanel({ documentState }: AIPanelProps) {
  const [provider, setProvider] = useState<Provider>('deepseek')
  const [loading, setLoading] = useState(false)
  const [issues, setIssues] = useState<AIIssue[] | null>(null)
  const [error, setError] = useState('')

  async function checkFormat() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, documentData: documentState }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      const data = await res.json()
      setIssues(data.issues || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Có lỗi khi kiểm tra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Provider selector */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {PROVIDERS.map(p => (
          <button
            key={p.value}
            onClick={() => setProvider(p.value)}
            style={provider === p.value ? { background: p.color, color: 'white', borderColor: p.color } : {}}
            className={`px-3 py-1 text-xs font-semibold rounded-md border-[1.5px] border-[#c3d0f5] transition-all ${
              provider === p.value ? '' : 'text-[#3b52bf] hover:bg-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        onClick={checkFormat}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] disabled:opacity-60 transition-colors mb-2"
      >
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span>🔍</span>
        )}
        {loading ? 'Đang kiểm tra...' : 'Kiểm tra lỗi & Thể thức'}
      </button>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
          {error}
        </div>
      )}

      {issues !== null && (
        <div className="bg-white border-[1.5px] border-[#dde4f5] rounded-lg overflow-hidden">
          <div className="bg-[#f1f5f9] px-3 py-2 flex justify-between items-center border-b border-[#e2e8f0]">
            <span className="text-xs font-bold text-[#475569]">Kết quả kiểm tra</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${issues.length === 0 ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}>
              {issues.length === 0 ? '✓ Đạt chuẩn' : `${issues.length} vấn đề`}
            </span>
          </div>
          {issues.length === 0 ? (
            <div className="text-center py-4 text-sm text-[#10b981] font-semibold">
              Văn bản đạt chuẩn thể thức ✓
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {issues.map((issue, i) => (
                <div
                  key={i}
                  className={`flex gap-2 items-start p-2 rounded-md border-[1.5px] text-xs ${
                    issue.type === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <span className="shrink-0 text-base mt-0.5">{issue.type === 'error' ? '🔴' : '⚠️'}</span>
                  <div>
                    <div className="font-bold text-[#374151] mb-0.5">{issue.field}</div>
                    <div className="text-[#6b7280] leading-snug">{issue.description}</div>
                    {issue.suggestion && (
                      <div className="mt-1 italic text-[#059669]">Gợi ý: {issue.suggestion}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
