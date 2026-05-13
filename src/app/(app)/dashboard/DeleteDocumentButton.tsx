'use client'

import { deleteDocument } from '@/lib/actions/documents'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Xóa văn bản này?')) return
    setLoading(true)
    await deleteDocument(documentId)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm bg-red-50 text-red-500 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Xóa'}
    </button>
  )
}
