import { NextResponse } from 'next/server';
import { getWorldBookSections } from '@/lib/world-book';

export async function GET() {
  const sections = getWorldBookSections();
  return NextResponse.json({ sections });
}
