import { NextResponse } from 'next/server'
import { getPetData } from '@/actions/gamification'

export async function GET() {
  try {
    const result = await getPetData()
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json(result.pet || { petType: null })
  } catch (error) {
    console.error('Error fetching pet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pet' },
      { status: 500 }
    )
  }
}

