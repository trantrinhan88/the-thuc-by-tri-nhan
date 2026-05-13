'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentState, Agency, Signer } from '@/types'
import { useDocumentReducer } from './useDocumentReducer'
import Sidebar from './Sidebar'
import A4Preview from './A4Preview'
import { exportDocx } from './exportDocx'
import { saveDocument, saveVersion, deleteVersion } from '@/lib/actions/documents'

interface DocVersion {
  id: string
  created_at: string
  snapshot: DocumentState
}

interface DocumentEditorProps {
  documentId?: string
  initialData?: Partial<DocumentState>
  initialVersions?: DocVersion[]
  agencies: Agency[]
  signers: Signer[]
  documentCount: number
}

export default function DocumentEditor({
  documentId,
  initialData,
  initialVersions = [],
  agencies,
  signers,
  documentCount,
}: DocumentEditorProps) {
  const router = useRouter()
  const [state, dispatch] = useDocumentReducer(initialData)
  const [versions, setVersions] = useState<DocVersion[]>(initialVersions)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const currentDocIdRef = useRef<string | undefined>(documentId)

  // Auto-save debounce 1.5s
  useEffect(() => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const id = await saveDocument(state, currentDocIdRef.current)
      if (id && !currentDocIdRef.current) {
        currentDocIdRef.current = id
        router.replace(`/documents/${id}`, { scroll: false })
      }
    }, 1500)
    return () => clearTimeout(saveTimerRef.current)
  }, [state])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function handleSaveVersion() {
    if (!currentDocIdRef.current) {
      showToast('Lưu văn bản trước khi tạo phiên bản')
      return
    }
    if (versions.length >= 99) {
      showToast('Đã đạt giới hạn 99 phiên bản')
      return
    }
    setIsSaving(true)
    try {
      const newVersion = await saveVersion(currentDocIdRef.current, state)
      if (newVersion) {
        setVersions(prev => [newVersion, ...prev])
        showToast('Đã lưu phiên bản ✓')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLoadVersion(versionId: string) {
    const v = versions.find(v => v.id === versionId)
    if (v) {
      dispatch({ type: 'LOAD', state: v.snapshot })
      showToast('Đã tải phiên bản ✓')
    }
  }

  async function handleDeleteVersion(versionId: string) {
    await deleteVersion(versionId)
    setVersions(prev => prev.filter(v => v.id !== versionId))
    showToast('Đã xóa phiên bản')
  }

  function handleNewDocument() {
    currentDocIdRef.current = undefined
    dispatch({ type: 'RESET' })
    setVersions([])
    router.push('/documents/new')
  }

  async function handleExportDocx() {
    await exportDocx(state)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        state={state}
        dispatch={dispatch}
        agencies={agencies.length > 0 ? agencies : [{ upper: state.agencyUpper, main: state.agencyMain, location: state.location }]}
        signers={signers.length > 0 ? signers : [{ position: 'GIÁM ĐỐC', name: '' }, { position: 'PHÓ GIÁM ĐỐC', name: '' }]}
        onSave={handleSaveVersion}
        onNewDocument={handleNewDocument}
        onExportDocx={handleExportDocx}
        versions={versions}
        onLoadVersion={handleLoadVersion}
        onDeleteVersion={handleDeleteVersion}
        isSaving={isSaving}
        documentCount={documentCount}
      />

      {/* Workspace */}
      <main className="flex-1 overflow-y-auto py-10 px-8 flex justify-center" style={{ background: 'radial-gradient(ellipse at 60% 40%, #d6ddf0 0%, #c8d0e8 100%)' }}>
        <A4Preview state={state} />
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1f36] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
