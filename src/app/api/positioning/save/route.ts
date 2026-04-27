import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { leadId, placeId, summary, tags, reviewCount, averageRating } = await req.json();

    if (!leadId || !summary || !tags) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Leadを検索（IDまたはPlaceIDで）
    let lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead && placeId) {
      lead = await prisma.lead.findUnique({ where: { placeId } });
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found. Please save to CRM first." }, { status: 404 });
    }

    console.log("Saving Analysis for Lead:", { leadId, placeId, lead_db_id: lead.id });

    const savedAnalysis = await prisma.analysis.upsert({
      where: { leadId: lead.id },
      update: {
        summary,
        tags: tags,
        reviewCount: Number(reviewCount),
        averageRating: Number(averageRating),
      },
      create: {
        leadId: lead.id,
        summary,
        tags: tags,
        reviewCount: Number(reviewCount),
        averageRating: Number(averageRating),
      },
    });

    return NextResponse.json({ success: true, analysis: savedAnalysis });
  } catch (error: any) {
    console.error("DEBUG_SAVE_ANALYSIS_ERROR:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}
