// pages/api/proxy-image.js
import logger from '@/lib/logger';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    logger.error("Image proxy error: No URL provided");
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    logger.info("Fetching image from Cloudinary:", url);
    const response = await fetch(url, {
      headers: {
        Accept: "image/*",
      },
      cache: "no-store", // ensure we don't use stale cache
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available");
      logger.error(`Cloudinary fetch failed: HTTP ${response.status}`);
      return res
        .status(response.status)
        .json({ error: `Cloudinary fetch failed: ${errorText}` });
    }

    // Pass headers directly
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "no-store"); // disable caching so updates always show

    // Stream instead of buffering
    response.body.pipe(res);
  } catch (error) {
    logger.error("Image proxy error:", error.message);
    res.status(500).json({ error: `Failed to fetch image: ${error.message}` });
  }
}
