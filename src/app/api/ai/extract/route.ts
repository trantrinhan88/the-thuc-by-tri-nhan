import mammoth from 'mammoth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Không có file' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const name = file.name.toLowerCase()

    let text = ''

    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (name.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>
      const result = await pdfParse(buffer)
      text = result.text
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = require('xlsx') as typeof import('xlsx')
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const parts: string[] = []
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName]
        parts.push(`=== ${sheetName} ===\n${XLSX.utils.sheet_to_csv(ws)}`)
      }
      text = parts.join('\n\n')
    } else {
      return NextResponse.json({ error: 'Định dạng không hỗ trợ (.docx, .doc, .pdf, .xlsx, .xls)' }, { status: 400 })
    }

    return NextResponse.json({ text })
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Không thể đọc file' }, { status: 500 })
  }
}
