import { getDocument } from '@/lib/actions/documents'
import DocumentEditor from '@/components/document-editor'
import { notFound } from 'next/navigation'
import { DocumentState } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params
  const { document, versions, agencies, signers, documentCount } = await getDocument(id)

  if (!document) notFound()

  return (
    <DocumentEditor
      documentId={document.id}
      initialData={document.content as DocumentState}
      initialVersions={versions as { id: string; created_at: string; snapshot: DocumentState }[]}
      agencies={agencies}
      signers={signers}
      documentCount={documentCount}
    />
  )
}
