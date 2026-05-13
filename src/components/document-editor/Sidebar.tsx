'use client'

import { Dispatch } from 'react'
import { DocumentState, DocType, Agency, Signer, AIIssue } from '@/types'
import AIPanel from './AIPanel'

type Action =
  | { type: 'SET_FIELD'; field: keyof DocumentState; value: string }
  | { type: 'LOAD'; state: DocumentState }
  | { type: 'RESET' }

interface SidebarProps {
  state: DocumentState
  dispatch: Dispatch<Action>
  agencies: Agency[]
  signers: Signer[]
  onSave: () => void
  onNewDocument: () => void
  onExportDocx: () => void
  versions: { id: string; created_at: string }[]
  onLoadVersion: (id: string) => void
  onDeleteVersion: (id: string) => void
  isSaving: boolean
  documentCount: number
}

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'cong-van', label: 'Công Văn' },
  { value: 'bao-cao', label: 'Báo cáo' },
  { value: 'thong-bao', label: 'Thông báo' },
  { value: 'ke-hoach', label: 'Kế hoạch' },
]

export default function Sidebar({
  state, dispatch, agencies, signers,
  onSave, onNewDocument, onExportDocx,
  versions, onLoadVersion, onDeleteVersion,
  isSaving, documentCount,
}: SidebarProps) {
  const set = (field: keyof DocumentState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => dispatch({ type: 'SET_FIELD', field, value: e.target.value })

  const filteredSigners = signers.filter(s => s.position === state.signPosition)

  return (
    <aside className="w-[420px] min-w-[420px] bg-[#f7f8fc] border-r-[1.5px] border-[#dde1ef] flex flex-col z-10 shadow-[3px_0_18px_rgba(26,86,176,0.07)] overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 bg-[#1a56b0] text-white shrink-0">
        <h1 className="text-[1.1rem] font-bold tracking-[0.01em]">📄 Thể thức văn bản</h1>
        <p className="text-[0.78rem] opacity-80 mt-0.5">Soạn thảo tự động – Chuẩn Nghị định 30/2020/NĐ-CP</p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#dde1ef]">

        {/* 1. Thông tin cơ quan */}
        <section>
          <SectionTitle>1. Thông tin cơ quan &amp; Tiêu đề</SectionTitle>
          <Field label="Cơ quan chủ quản">
            <input value={state.agencyUpper} onChange={set('agencyUpper')} className={inputCls} />
          </Field>
          <Field label="Cơ quan ban hành">
            <select value={state.agencyMain} onChange={set('agencyMain')} className={inputCls}>
              {agencies.map(a => (
                <option key={a.main} value={a.main}>{a.main}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2.5">
            <Field label="Số, ký hiệu" className="flex-1">
              <input value={state.docNumber} onChange={set('docNumber')} className={inputCls} />
            </Field>
            <Field label="Địa danh" className="flex-1">
              <input value={state.location} onChange={set('location')} className={inputCls} />
            </Field>
          </div>
          <Field label="Ngày tháng năm">
            <input type="date" value={state.date} onChange={set('date')} className={inputCls} />
          </Field>
        </section>

        {/* 2. Thể loại */}
        <section>
          <SectionTitle>2. Thể loại &amp; Trích yếu</SectionTitle>
          <Field label="Thể loại văn bản">
            <select value={state.docType} onChange={set('docType')} className={inputCls}>
              {DOC_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Trích yếu nội dung">
            <textarea value={state.docSummary} onChange={set('docSummary')} rows={2} className={`${inputCls} resize-y`} />
          </Field>
          <Field label={state.docType === 'cong-van' ? 'Kính gửi' : 'Gửi đến (tùy chọn)'}>
            <input value={state.recipient} onChange={set('recipient')} className={inputCls} />
          </Field>
        </section>

        {/* 3. Căn cứ */}
        <section>
          <SectionTitle>3. Căn cứ &amp; Đặt vấn đề</SectionTitle>
          <Field label="Các căn cứ pháp lý (mỗi dòng 1 căn cứ)">
            <textarea value={state.legalBasis} onChange={set('legalBasis')} rows={4} className={`${inputCls} resize-y`} />
          </Field>
          <Field label="Câu đặt vấn đề">
            <textarea value={state.issueStatement} onChange={set('issueStatement')} rows={3} className={`${inputCls} resize-y`} />
          </Field>
        </section>

        {/* 4. Nội dung */}
        <section>
          <SectionTitle>4. Nội dung chính</SectionTitle>
          <textarea
            value={state.mainContent}
            onChange={set('mainContent')}
            rows={6}
            className={`${inputCls} resize-y w-full`}
          />
        </section>

        {/* 5. Kết luận & Chữ ký */}
        <section>
          <SectionTitle>5. Kết luận &amp; Chữ ký</SectionTitle>
          <Field label="Kết luận / Yêu cầu">
            <textarea value={state.conclusion} onChange={set('conclusion')} rows={2} className={`${inputCls} resize-y`} />
          </Field>
          <div className="flex gap-2.5">
            <Field label="Chức vụ người ký" className="flex-1">
              <select value={state.signPosition} onChange={set('signPosition')} className={inputCls}>
                {[...new Set(signers.map(s => s.position))].map(p => (
                  <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </Field>
            <Field label="Họ và tên" className="flex-1">
              <select value={state.signName} onChange={set('signName')} className={inputCls}>
                <option value="">-- Chọn --</option>
                {filteredSigners.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Nơi nhận (phần cuối)">
            <textarea value={state.recipientsCc} onChange={set('recipientsCc')} rows={3} className={`${inputCls} resize-y`} />
          </Field>
        </section>

        {/* 6. AI */}
        <section className="bg-[#f0f4ff] border-[1.5px] border-[#c3d0f5] rounded-lg p-4">
          <SectionTitle className="text-[#3b52bf] border-[#c3d0f5]">6. Kiểm tra lỗi thể thức (AI)</SectionTitle>
          <AIPanel documentState={state} />
        </section>

        {/* Lịch sử phiên bản */}
        {versions.length > 0 && (
          <section>
            <SectionTitle>Lịch sử phiên bản</SectionTitle>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {versions.map(v => (
                <div key={v.id} className="flex items-center gap-2 p-2.5 border-[1.5px] border-[#dde1ef] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1a1f36]">
                      {new Date(v.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <button
                    onClick={() => onLoadVersion(v.id)}
                    className="text-xs bg-[#1a56b0] text-white px-3 py-1 rounded-md font-semibold hover:bg-[#1345a0] transition-colors"
                  >
                    Tải
                  </button>
                  <button
                    onClick={() => onDeleteVersion(v.id)}
                    className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-md font-semibold hover:bg-red-200 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Footer */}
      <footer className="px-5 py-3.5 border-t-[1.5px] border-[#dde1ef] bg-[#f7f8fc] shrink-0 space-y-2">
        <div className="flex gap-2">
          <button onClick={onNewDocument} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-semibold bg-[#ec4899] text-white hover:bg-[#db2777] transition-colors">
            <span>+</span> Văn bản mới
          </button>
          <button onClick={onSave} disabled={isSaving} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-semibold bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-60 transition-colors">
            {isSaving ? 'Đang lưu...' : '💾 Lưu phiên bản'}
          </button>
        </div>
        <button onClick={onExportDocx} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-semibold bg-[#10b981] text-white hover:bg-[#059669] transition-colors">
          📥 Xuất DOCX
        </button>
        <div className="text-center text-xs text-[#6b7597]">{documentCount}/99 văn bản</div>
      </footer>
    </aside>
  )
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#7b8abf] mb-3 pb-1.5 border-b-[1.5px] border-[#dde1ef] ${className}`}>
      {children}
    </h2>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="block text-[0.78rem] font-semibold text-[#6b7597] mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-[0.55rem] border-[1.5px] border-[#dde1ef] rounded-[6px] text-[0.855rem] font-[inherit] bg-white text-[#1a1f36] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-[#1a56b0] focus:ring-2 focus:ring-[#1a56b0]/10'
