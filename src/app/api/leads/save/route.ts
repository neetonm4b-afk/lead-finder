import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const leadData = await req.json();

    const existingLead = await prisma.lead.findUnique({
      where: { placeId: leadData.id }
    });

    if (existingLead) {
      return NextResponse.json({ 
        success: false, 
        error: "Already saved", 
        leadId: existingLead.id 
      }, { status: 409 });
    }

    const savedLead = await prisma.lead.create({
      data: {
        placeId: leadData.id,
        name: leadData.name,
        address: leadData.address,
        phoneNumber: leadData.phoneNumber,
        website: leadData.website,
        rating: leadData.rating,
        userRatingsTotal: leadData.userRatingCount,
        leadScore: leadData.leadScore,
        types: leadData.types || [],
        status: "SAVED"
      }
    });

    return NextResponse.json({ success: true, lead: savedLead });
  } catch (error: any) {
    console.error("DEBUG_SAVE_LEAD_ERROR:", error);
    
    // 詳細なエラー情報を構築
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      code: error?.code, // Prisma error code (P2002など)
      meta: error?.meta,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
