import { NextResponse } from 'next/server';
import { getMockAreaCodes } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    
    if (!countryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Country ID is required' 
        },
        { status: 400 }
      );
    }
    
    // In production, this would call the DIDWW API with the country ID
    // For now, we're using mock data
    const areaCodes = getMockAreaCodes(countryId);
    
    return NextResponse.json({
      success: true,
      data: areaCodes,
      count: areaCodes.length
    });
  } catch (error) {
    console.error('Error fetching area codes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch area codes' 
      },
      { status: 500 }
    );
  }
}