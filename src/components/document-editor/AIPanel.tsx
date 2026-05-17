'use client'

import { useState } from 'react'
import { DocumentState, AIIssue } from '@/types'

const FIELD_MAP: Record<string, keyof DocumentState> = {
  'Trích yếu': 'docSummary',
  'Kính gửi / Gửi đến': 'recipient',
  'Căn cứ pháp lý': 'legalBasis',
  'Đặt vấn đề': 'issueStatement',
  'Nội dung chính': 'mainContent',
  'Kết luận': 'conclusion',
}

interface AIPanelProps {
  documentState: DocumentState
  onFixIssue: (field: keyof DocumentState, wrong: string, correct: string) => void
}

export default function AIPanel({ documentState, onFixIssue }: AIPanelProps) {
  const [loading, setLoading] = useState(false)
  const [issues, setIssues] = useState<AIIssue[] | null>(null)
  const [error, setError] = useState('')
  const [fixedSet, setFixedSet] = useState<Set<number>>(new Set())

  async function checkFormat() {
    setLoading(true)
    setError('')
    setFixedSet(new Set())
    try {
      const res = await fetch('/api/ai/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', documentData: documentState }),
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

  function handleFix(index: number, issue: AIIssue) {
    const stateField = FIELD_MAP[issue.field]
    if (!stateField || !issue.suggestion) return
    onFixIssue(stateField, issue.description, issue.suggestion)
    setFixedSet(prev => new Set([...prev, index]))
  }

  return (
    <div>
      <button
        onClick={checkFormat}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] disabled:opacity-60 transition-colors mb-2"
      >
        {loading ? <span className="animate-spin">⏳</span> : <span>🔍</span>}
        {loading ? 'Đang kiểm tra...' : 'Kiểm tra lỗi chính tả'}
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
              Không phát hiện lỗi chính tả ✓
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {issues.map((issue, i) => (
                <div
                  key={i}
                  className={`flex gap-2 items-start p-2 rounded-md border-[1.5px] text-xs transition-opacity ${
                    fixedSet.has(i) ? 'opacity-50' : ''
                  } ${
                    issue.type === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <span className="shrink-0 text-base mt-0.5">
                    {fixedSet.has(i) ? '✅' : issue.type === 'error' ? '🔴' : '⚠️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#374151] mb-0.5">{issue.field}</div>
                    <div className="leading-snug">
                      <mark className="bg-yellow-200 text-red-700 rounded px-0.5 not-italic font-medium">
                        {issue.description}
                      </mark>
                    </div>
                    {issue.suggestion && (
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="italic text-[#059669]">→ {issue.suggestion}</span>
                        {FIELD_MAP[issue.field] && (
                          <button
                            onClick={() => handleFix(i, issue)}
                            disabled={fixedSet.has(i)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                              fixedSet.has(i)
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-[#1a56b0] text-white hover:bg-[#1345a0]'
                            }`}
                          >
                            {fixedSet.has(i) ? '✓ Đã sửa' : 'Sửa'}
                          </button>
                        )}
                      </div>
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
