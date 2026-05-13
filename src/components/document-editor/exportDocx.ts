import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType,
  convertInchesToTwip, HeadingLevel,
} from 'docx'
import { saveAs } from 'file-saver'
import { DocumentState } from '@/types'

const DOC_TYPE_TITLES: Record<string, string> = {
  'bao-cao': 'BÁO CÁO',
  'thong-bao': 'THÔNG BÁO',
  'ke-hoach': 'KẾ HOẠCH',
}

export async function exportDocx(state: DocumentState) {
  const isCongVan = state.docType === 'cong-van'

  const formattedDate = state.date
    ? (() => {
        const d = new Date(state.date)
        return `${state.location}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`
      })()
    : `${state.location}, ngày ... tháng ... năm ...`

  const legalBasisLines = state.legalBasis.split('\n').map(l => l.trim()).filter(Boolean)
  const recipientsCcLines = state.recipientsCc.split('\n').map(l => l.trim()).filter(Boolean)

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.79),
            right: convertInchesToTwip(0.59),
            bottom: convertInchesToTwip(0.79),
            left: convertInchesToTwip(1.18),
          },
        },
      },
      children: [
        // Header table: Cơ quan | Quốc hiệu
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
          rows: [new TableRow({ children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: state.agencyUpper, size: 24 }),
                ]}),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: state.agencyMain, bold: true, size: 24 }),
                ]}),
                new Paragraph({ alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }, children: [
                  new TextRun({ text: '' }),
                ]}),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: `Số: ${state.docNumber || '...'}/${state.agencyMain.split(' ').pop()}`, size: 26 }),
                ]}),
                ...(isCongVan ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: `V/v ${state.docSummary}`, size: 26 }),
                ]})] : []),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 24, allCaps: true }),
                ]}),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, size: 26 }),
                ]}),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: formattedDate, italics: true, size: 26 }),
                ]}),
              ],
            }),
          ]})],
        }),

        new Paragraph({ text: '' }),

        // Kính gửi hoặc tên loại
        ...(isCongVan ? [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: 'Kính gửi: ', bold: true, size: 28 }),
            new TextRun({ text: state.recipient, size: 28 }),
          ]}),
        ] : [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: DOC_TYPE_TITLES[state.docType] || '', bold: true, size: 32, allCaps: true }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            new TextRun({ text: state.docSummary, size: 28 }),
          ]}),
        ]),

        new Paragraph({ text: '' }),

        // Căn cứ
        ...legalBasisLines.map(line => new Paragraph({ children: [
          new TextRun({ text: `- Căn cứ ${line};`, size: 28 }),
        ]})),

        ...(state.issueStatement ? [new Paragraph({ indent: { firstLine: convertInchesToTwip(0.59) }, children: [
          new TextRun({ text: state.issueStatement, size: 28 }),
        ]})] : []),

        ...(state.mainContent ? state.mainContent.split('\n').map(line => new Paragraph({ indent: { firstLine: convertInchesToTwip(0.59) }, children: [
          new TextRun({ text: line, size: 28 }),
        ]})) : []),

        ...(state.conclusion ? [new Paragraph({ indent: { firstLine: convertInchesToTwip(0.59) }, children: [
          new TextRun({ text: state.conclusion, size: 28 }),
        ]})] : []),

        new Paragraph({ text: '' }),

        // Footer: Nơi nhận + Chữ ký
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
          rows: [new TableRow({ children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: 'Nơi nhận:', bold: true, size: 24 })] }),
                ...recipientsCcLines.map(line => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] })),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: state.signPosition, bold: true, size: 28 }),
                ]}),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: '' }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: state.signName, bold: true, size: 28 }),
                ]}),
              ],
            }),
          ]})],
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const filename = `${state.docNumber || 'vanban'}-${state.docType}.docx`
  saveAs(blob, filename)
}
