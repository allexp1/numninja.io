import { NextRequest, NextResponse } from 'next/server';
import { fetchCDR, calculateCDRStats, DateRange } from '@/lib/cdr';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phoneNumber = searchParams.get('phoneNumber');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let dateRange: DateRange | undefined;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const cdrRecords = await fetchCDR(phoneNumber, dateRange);
    const stats = calculateCDRStats(cdrRecords);

    return NextResponse.json({
      success: true,
      data: stats,
      period: dateRange 
        ? `${new Date(startDate!).toLocaleDateString()} - ${new Date(endDate!).toLocaleDateString()}`
        : 'All time',
    });
  } catch (error) {
    console.error('Error calculating CDR stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate CDR statistics' },
      { status: 500 }
    );
  }
}