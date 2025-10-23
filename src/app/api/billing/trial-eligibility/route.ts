import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkTrialEligibility } from '@/lib/trialService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trialEligibility = await checkTrialEligibility(user);

    return NextResponse.json({
      success: true,
      ...trialEligibility
    });
  } catch (error) {
    console.error('Trial eligibility check error:', error);
    return NextResponse.json({ 
      success: false,
      isEligible: false,
      reason: 'error',
      message: 'Unable to check trial eligibility'
    }, { status: 500 });
  }
}
