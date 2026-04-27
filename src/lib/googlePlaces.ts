export async function getPlaceReviews(placeId: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not defined");
  }

  // Google Places API (New) - Get Place Details (Reviews included)
  // https://developers.google.com/maps/documentation/places/web-service/place-details
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews,rating,userRatingCount&key=${apiKey}&languageCode=ja`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google Places API Error:", errorData);
    throw new Error(`Failed to fetch place details: ${response.statusText}`);
  }

  const data = await response.json();
  
  // レビューテキストの抽出
  const reviews = (data.reviews || []).map((r: any) => ({
    author: r.authorAttribution?.displayName,
    rating: r.rating,
    text: r.text?.text || "",
    publishTime: r.publishTime
  }));

  return {
    reviews,
    averageRating: data.rating,
    reviewCount: data.userRatingCount
  };
}
