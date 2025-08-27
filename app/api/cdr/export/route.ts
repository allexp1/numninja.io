import { NextRequest, NextResponse } from 'next/server';
import { fetchCDR, exportToCSV, DateRange } from '@/lib/cdr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phoneNumber = searchParams.get('phoneNumber');
    const format = searchParams.get('format') || 'csv';
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

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: cdrRecords,
        count: cdrRecords.length,
        exportDate: new Date().toISOString(),
      });
    } else if (format === 'csv') {
      const csvContent = exportToCSV(cdrRecords);
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cdr-${phoneNumber}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "json"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting CDR:', error);
    return NextResponse.json(
      { error: 'Failed to export CDR records' },
      { status: 500 }
    );
  }
}