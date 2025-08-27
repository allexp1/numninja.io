import { NextRequest, NextResponse } from 'next/server';
import { fetchSMS, calculateSMSStats, exportSMSToCSV, DateRange } from '@/lib/cdr';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phoneNumber = searchParams.get('phoneNumber');
    const action = searchParams.get('action') || 'fetch'; // fetch, stats, or export
    const format = searchParams.get('format') || 'json';
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

    const smsRecords = await fetchSMS(phoneNumber, dateRange);

    switch (action) {
      case 'stats':
        const stats = calculateSMSStats(smsRecords);
        return NextResponse.json({
          success: true,
          data: stats,
          period: dateRange 
            ? `${new Date(startDate!).toLocaleDateString()} - ${new Date(endDate!).toLocaleDateString()}`
            : 'All time',
        });

      case 'export':
        if (format === 'csv') {
          const csvContent = exportSMSToCSV(smsRecords);
          return new Response(csvContent, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="sms-${phoneNumber}-${new Date().toISOString().split('T')[0]}.csv"`,
            },
          });
        } else if (format === 'json') {
          return NextResponse.json({
            success: true,
            data: smsRecords,
            count: smsRecords.length,
            exportDate: new Date().toISOString(),
          });
        } else {
          return NextResponse.json(
            { error: 'Invalid format. Use "csv" or "json"' },
            { status: 400 }
          );
        }

      case 'fetch':
      default:
        return NextResponse.json({
          success: true,
          data: smsRecords,
          count: smsRecords.length,
        });
    }
  } catch (error) {
    console.error('Error processing SMS request:', error);
    return NextResponse.json(
      { error: 'Failed to process SMS request' },
      { status: 500 }
    );
  }
}