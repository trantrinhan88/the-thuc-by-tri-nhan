'use client'

import { DocumentState } from '@/types'

const DOC_TYPE_TITLES: Record<string, string> = {
  'bao-cao': 'BÁO CÁO',
  'thong-bao': 'THÔNG BÁO',
  'ke-hoach': 'KẾ HOẠCH',
}

interface A4PreviewProps {
  state: DocumentState
}

export default function A4Preview({ state }: A4PreviewProps) {
  const isCongVan = state.docType === 'cong-van'
  const docTypeTitle = DOC_TYPE_TITLES[state.docType]

  const formattedDate = state.date
    ? (() => {
        const d = new Date(state.date)
        return `${state.location}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`
      })()
    : `${state.location}, ngày ... tháng ... năm ...`

  const legalBasisLines = state.legalBasis
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const recipientsCcLines = state.recipientsCc
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: 'white',
        boxShadow: '0 20px 50px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
        padding: '20mm 15mm 20mm 30mm',
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '14pt',
        lineHeight: '1.35',
        color: '#000',
        borderRadius: '2px',
      }}
    >
      {/* Document Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.8rem' }}>
        {/* Left: Cơ quan */}
        <div style={{ width: '48%', textAlign: 'center' }}>
          <div style={{ fontSize: '12pt', textTransform: 'uppercase' }}>{state.agencyUpper}</div>
          <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
            {state.agencyMain}
          </div>
          <div style={{ width: '45%', height: '1px', background: 'black', margin: '3px auto 5px' }} />
          <div style={{ fontSize: '13pt' }}>
            Số: {state.docNumber || '...'}/{state.agencyMain.split(' ').pop()}
          </div>
          {isCongVan && (
            <div style={{ fontSize: '13pt', textAlign: 'center', marginTop: '4pt' }}>
              <span>V/v </span><span>{state.docSummary || '...'}</span>
            </div>
          )}
        </div>

        {/* Right: Quốc hiệu */}
        <div style={{ width: '48%', textAlign: 'center' }}>
          <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div style={{
            fontSize: '13pt', fontWeight: 'bold',
            display: 'inline-block', borderBottom: '1px solid black'
          }}>
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div style={{ fontSize: '13pt', fontStyle: 'italic', whiteSpace: 'nowrap', marginTop: '4pt' }}>
            {formattedDate}
          </div>
        </div>
      </div>

      {/* Recipient / Doc type title */}
      <div style={{ marginBottom: '0.9rem' }}>
        {isCongVan ? (
          <div style={{ fontSize: '14pt', textAlign: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>Kính gửi: </span>
            <span>{state.recipient || '...'}</span>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {docTypeTitle}
            </div>
            <div style={{ fontSize: '14pt', marginTop: '4pt', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {state.docSummary}
            </div>
            {state.docSummary && (
              <div style={{ height: '1px', background: '#000', width: '4cm', margin: '3pt auto 0' }} />
            )}
          </div>
        )}
      </div>

      {/* Document Body */}
      <div style={{ minHeight: '80mm' }}>
        {/* Căn cứ pháp lý */}
        {legalBasisLines.length > 0 && (
          <div style={{ marginBottom: '0.5rem' }}>
            {legalBasisLines.map((line, i) => (
              <div key={i} style={{ marginBottom: '4pt' }}>
                - Căn cứ {line};
              </div>
            ))}
          </div>
        )}

        {/* Đặt vấn đề */}
        {state.issueStatement && (
          <div style={{ marginBottom: '0.5rem', textIndent: '1.5cm' }}>
            {state.issueStatement}
          </div>
        )}

        {/* Nội dung chính */}
        {state.mainContent && (
          <div style={{ marginBottom: '0.5rem', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {state.mainContent}
          </div>
        )}

        {/* Kết luận */}
        {state.conclusion && (
          <div style={{ marginBottom: '0.5rem', textIndent: '1.5cm' }}>
            {state.conclusion}
          </div>
        )}
      </div>

      {/* Footer: Nơi nhận + Chữ ký */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <div style={{ width: '45%' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Nơi nhận:</div>
          {recipientsCcLines.map((line, i) => (
            <div key={i} style={{ fontSize: '12pt' }}>{line}</div>
          ))}
        </div>
        <div style={{ width: '45%', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{state.signPosition}</div>
          <div style={{ height: '55pt' }} />
          <div style={{ fontWeight: 'bold' }}>{state.signName}</div>
        </div>
      </div>
    </div>
  )
}
