import { NextRequest, NextResponse } from 'next/server';
import { fetchCDR, DateRange } from '@/lib/cdr';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      success: true,
      data: cdrRecords,
      count: cdrRecords.length,
    });
  } catch (error) {
    console.error('Error fetching CDR:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CDR records' },
      { status: 500 }
    );
  }
}