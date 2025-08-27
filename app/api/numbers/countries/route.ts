import { NextResponse } from 'next/server';
import { getMockCountries } from '@/lib/mock-data';

export async function GET() {
  try {
    // In production, this would call the DIDWW API
    // For now, we're using mock data
    const countries = getMockCountries();
    
    return NextResponse.json({
      success: true,
      data: countries,
      count: countries.length
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch countries' 
      },
      { status: 500 }
    );
  }
}