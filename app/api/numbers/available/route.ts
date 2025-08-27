import { NextResponse } from 'next/server';
import { getMockAvailableNumbers } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const areaCodeId = searchParams.get('areaCodeId');
    
    if (!countryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Country ID is required' 
        },
        { status: 400 }
      );
    }
    
    // In production, this would call the DIDWW API with the country and area code
    // For now, we're using mock data
    const availableNumbers = getMockAvailableNumbers(countryId, areaCodeId || undefined);
    
    // Simulate some delay to make it feel more realistic
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      data: availableNumbers,
      count: availableNumbers.length,
      metadata: {
        countryId,
        areaCodeId,
        currency: 'USD',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching available numbers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch available numbers' 
      },
      { status: 500 }
    );
  }
}