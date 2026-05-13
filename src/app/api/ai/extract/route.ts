import mammoth from 'mammoth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Không có file' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await mammoth.extractRawText({ buffer })
    return NextResponse.json({ text: result.value })
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Không thể đọc file Word' }, { status: 500 })
  }
}
