import DocumentEditor from '@/components/document-editor'
import { getDocuments } from '@/lib/actions/documents'

export default async function NewDocumentPage() {
  const { agencies, signers, documentCount } = await getDocuments()

  return (
    <DocumentEditor
      agencies={agencies}
      signers={signers}
      documentCount={documentCount}
    />
  )
}
