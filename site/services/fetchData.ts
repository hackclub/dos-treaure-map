
import { NextResponse } from "next/server";
import Airtable from 'airtable';
import { auth } from '@/auth';
import { encryptSession, verifySession } from '@/utils/hash';

const airtable = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!)


export interface safeData {
    slack_id: string,
    points: number,
    current_stage: string,
    hackathons: string,
    achievements: string // comma separated list of numbers lol
}

// verify req
async function verifyReq(){
    const session = await auth();
    const encryptedToken = encryptSession(session!.access_token!, process.env.AUTH_SECRET!)
    return encryptedToken

}

// Get a specific value 
export async function getValue(emailAddress: string): Promise<safeData> {
        const accessTokenEncrypted = await verifyReq()
        const recordID = await airtable("Registered Users").select({
            filterByFormula: `{email} = "${emailAddress}"`,
            maxRecords: 1,
        }).all()
    
        const prettyRecordID = JSON.parse(JSON.stringify(recordID))[0]["fields"]// jank
        if (!(verifySession(prettyRecordID["hashed_token"], accessTokenEncrypted))){
            throw "Unauthorized"
        }
        const slack_id = prettyRecordID["slack_id"]
        const points = prettyRecordID["points"]
        const current_stage = prettyRecordID["current_stage"]
        const hackathons = prettyRecordID["hackathons"]
        const achievements = prettyRecordID["achievements"]

        return {
            slack_id, points, current_stage, hackathons, achievements
        }
}