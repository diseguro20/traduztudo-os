import { NextRequest } from 'next/server';
import { GET as dispatchGET, POST as dispatchPOST } from '../dispatch/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  return dispatchGET(req);
}

export async function POST(req: NextRequest) {
  return dispatchPOST(req);
}
