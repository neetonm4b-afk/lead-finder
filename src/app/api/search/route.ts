import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const getMockLeads = () => [
  {
    id: "demo-high-quality",
    name: "高評価・ウェブなし歯科 (デモ)",
    address: "東京都渋谷区",
    phoneNumber: "03-1111-2222",
    rating: 4.5,
    userRatingCount: 45,
    leadScore: 95,
    types: "dentist",
    website: null,
    filterPass: true,
    failReasons: []
  },
  {
    id: "demo-low-reviews",
    name: "評価は高いがレビュー不足 (デモ)",
    address: "東京都新宿区",
    phoneNumber: "03-3333-4444",
    rating: 4.2,
    userRatingCount: 5,
    leadScore: 30,
    types: "dentist",
    website: null,
    filterPass: false,
    failReasons: ["review count below 20"]
  },
  {
    id: "demo-has-website",
    name: "ウェブサイトあり (デモ)",
    address: "東京都港区",
    phoneNumber: "03-5555-6666",
    rating: 4.0,
    userRatingCount: 30,
    leadScore: 20,
    types: "restaurant",
    website: "https://example.com",
    filterPass: false,
    failReasons: ["website exists"]
  }
];

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { query, location, minRating = 3.8, minReviews = 20, websiteMissingOnly = true } = body;
    let apiKey = (process.env.GOOGLE_PLACES_API_KEY || "").trim();
    apiKey = apiKey.replace(/['"]/g, "");

    if (!apiKey || apiKey === "" || apiKey.includes("your_api_key")) {
      return NextResponse.json({ leads: getMockLeads() });
    }

    try {
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types",
        },
        body: JSON.stringify({
          textQuery: `${query} in ${location}`,
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ leads: getMockLeads(), warning: "Using mock data due to API error" });
      }

      const data = await response.json();
      const places = data.places || [];

      const leads = places.map((place: any) => {
        const hasWebsite = !!place.websiteUri;
        const rating = place.rating || 0;
        const reviewCount = place.userRatingCount || 0;

        const failReasons: string[] = [];
        if (hasWebsite) failReasons.push("website exists");
        if (rating < minRating) failReasons.push(`rating below ${minRating}`);
        if (reviewCount < minReviews) failReasons.push(`review count below ${minReviews}`);

        const filterPass = failReasons.length === 0;

        // スコアリングロジックの刷新
        let score = 0;
        
        // Website Missing (+40)
        if (!hasWebsite) score += 40;

        // Rating & Reviews 加点
        score += (rating * 5); // ★5なら25点
        score += Math.min(reviewCount / 10, 20); // レビューが多いほど加点（最大20点）

        // 強い減点
        if (rating < minRating) score -= 50;
        if (reviewCount < minReviews) score -= 50;

        return {
          id: place.id,
          name: place.displayName?.text || "不明な名称",
          address: place.formattedAddress,
          phoneNumber: place.nationalPhoneNumber,
          website: place.websiteUri,
          rating: rating,
          userRatingCount: reviewCount,
          leadScore: Math.max(0, score),
          types: place.types || [],
          filterPass,
          failReasons
        };
      });

      leads.sort((a: any, b: any) => b.leadScore - a.leadScore);

      // 非同期で履歴保存
      prisma.searchHistory.create({
        data: { query: query || "", location: location || "" },
      }).catch((err: unknown) => console.error("History save failed", err));

      return NextResponse.json({ leads });
    } catch (fetchError) {
      return NextResponse.json({ leads: getMockLeads(), warning: "Using mock data due to connection error" });
    }
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
