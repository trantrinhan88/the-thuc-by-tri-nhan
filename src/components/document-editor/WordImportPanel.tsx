'use client'

import { useEffect, useRef, useState } from 'react'

interface WordImportPanelProps {
  onApply: (text: string) => void
}

const LS_KEY = 'word-import-api-key'

export default function WordImportPanel({ onApply }: WordImportPanelProps) {
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [fileName, setFileName] = useState('')
  const [docContent, setDocContent] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setApiKey(localStorage.getItem(LS_KEY) || '')
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDocContent('')
    setError('')
    setIsParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/ai/extract', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Không đọc được file')
      }
      const data = await res.json()
      setDocContent(data.text)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi đọc file')
    } finally {
      setIsParsing(false)
    }
  }

  async function handleSuggest() {
    if (!apiKey.trim() || !prompt.trim()) return
    localStorage.setItem(LS_KEY, apiKey.trim())
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), prompt: prompt.trim(), docContent }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Lỗi gọi AI')
      }
      const data = await res.json()
      setResult(data.suggestion)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  function clearFile() {
    setFileName('')
    setDocContent('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
  }

  const inputCls = 'w-full px-3 py-[0.55rem] border-[1.5px] border-[#dde1ef] rounded-[6px] text-[0.855rem] font-[inherit] bg-white text-[#1a1f36] focus:outline-none focus:border-[#1a56b0] focus:ring-2 focus:ring-[#1a56b0]/10'

  return (
    <div className="space-y-3">
      {/* File import */}
      <div>
        <label className="block text-[0.78rem] font-semibold text-[#6b7597] mb-1">
          File Word đính kèm (.docx)
        </label>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-[0.55rem] px-3 border-[1.5px] border-dashed border-[#c3d0f5] rounded-[6px] text-xs text-[#3b52bf] hover:bg-[#eef2ff] transition-colors text-left truncate"
          >
            {isParsing ? '⏳ Đang đọc...' : fileName ? `📄 ${fileName}` : '📂 Chọn file .docx'}
          </button>
          {fileName && (
            <button onClick={clearFile} className="shrink-0 text-xs text-red-400 hover:text-red-600 px-1.5 py-1">
              ✕
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".docx,.doc" onChange={handleFileChange} className="hidden" />
        {docContent && (
          <div className="mt-1 text-[0.7rem] text-[#10b981] font-semibold">
            ✓ Đã đọc {docContent.length.toLocaleString()} ký tự
          </div>
        )}
      </div>

      {/* API Key */}
      <div>
        <label className="block text-[0.78rem] font-semibold text-[#6b7597] mb-1">
          Anthropic API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          className={`${inputCls} font-mono text-[0.78rem]`}
        />
        <div className="text-[0.68rem] text-[#9ca3af] mt-0.5">Lưu tự động trong trình duyệt</div>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-[0.78rem] font-semibold text-[#6b7597] mb-1">
          Yêu cầu gợi ý nội dung
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          placeholder="Ví dụ: Dựa trên file trên, hãy soạn nội dung báo cáo tình hình thu BHXH quý I..."
          className={`${inputCls} resize-y`}
        />
      </div>

      <button
        onClick={handleSuggest}
        disabled={loading || !apiKey.trim() || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
      >
        {loading
          ? <><span className="animate-spin inline-block">⏳</span> Đang xử lý...</>
          : <><span>✨</span> Gợi ý nội dung</>
        }
      </button>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border-[1.5px] border-[#c3d0f5] rounded-lg overflow-hidden">
          <div className="bg-[#f0f4ff] px-3 py-2 flex justify-between items-center border-b border-[#dde4f5]">
            <span className="text-xs font-bold text-[#3b52bf]">Kết quả gợi ý</span>
            <div className="flex gap-1.5">
              <button
                onClick={handleCopy}
                className="text-xs bg-[#e0e7ff] text-[#3b52bf] px-2 py-1 rounded font-semibold hover:bg-[#c7d2fe] transition-colors"
              >
                📋 Copy
              </button>
              <button
                onClick={() => onApply(result)}
                className="text-xs bg-[#1a56b0] text-white px-2 py-1 rounded font-semibold hover:bg-[#1345a0] transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
          <div className="p-3 text-xs text-[#374151] whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </div>
  )
}
