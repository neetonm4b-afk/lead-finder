import { NextRequest, NextResponse } from "next/server";
import { getPlaceReviews } from "@/lib/googlePlaces";

export async function POST(req: NextRequest) {
  try {
    const { placeId, leadId } = await req.json();

    if (!placeId || !leadId) {
      return NextResponse.json({ error: "Missing placeId or leadId" }, { status: 400 });
    }

    // 1. レビュー取得
    const { reviews, averageRating, reviewCount } = await getPlaceReviews(placeId);

    if (reviews.length === 0) {
      return NextResponse.json({
        placeId,
        summary: "レビューがまだ投稿されていないため、要約を生成できませんでした。",
        tags: ["データなし"],
        reviewCount: 0,
        averageRating: averageRating || 0,
        analyzedAt: new Date().toISOString()
      });
    }

    // 2. AI 分析 (最新 20 件程度を使用)
    const reviewTexts = reviews.slice(0, 20).map((r: any) => `[Rating: ${r.rating}星] ${r.text}`).join("\n\n");
    
    // AI 分析の呼び出し
    const analysis = await analyzeWithAI(reviewTexts);

    return NextResponse.json({
      placeId,
      summary: analysis.summary,
      tags: analysis.tags,
      reviewCount: reviews.length,
      averageRating: averageRating || 0,
      analyzedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}

async function analyzeWithAI(reviewTexts: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY is not set. Using mock analysis.");
    // 開発用のモックデータ
    return {
      summary: "清潔感のある店内で、スタッフの丁寧な対応が非常に高く評価されています。特に初診や初めての利用客に対しても親切であるという声が多く、サービス品質の高さがこの店の強みです。また、待ち時間の少なさや立地の良さについても肯定的な言及が見られます。",
      tags: ["丁寧な接客", "清潔感", "高いサービス品質", "低待機時間"]
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `以下の Google レビューの内容を分析し、その店舗の「売り」や「ポジショニング」を要約してください。
要約は 100 文字から 150 文字程度で、客観的かつ営業担当者が強みを把握しやすい表現にしてください。
また、その店の特徴を表すタグを 3 つから 5 つ抽出してください。

出力形式は必ず以下の JSON 形式のみにしてください。他の文章は一切含めないでください。
{
  "summary": "要約テキスト",
  "tags": ["タグ1", "タグ2", "タグ3"]
}

【分析対象のレビュー】
${reviewTexts}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("AI Analysis API failed");
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // JSON のパース（Markdown のコードブロックを考慮）
    const jsonStr = content.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI Analysis error:", e);
    return {
      summary: "分析中にエラーが発生しましたが、レビュー自体は取得されています。直接レビュー内容を確認してください。",
      tags: ["分析エラー"]
    };
  }
}
