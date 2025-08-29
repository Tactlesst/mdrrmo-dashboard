// pages/api/proxy-image.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    console.error("Image proxy error: No URL provided");
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    console.log("Fetching image from Cloudinary:", url);
    const response = await fetch(url, {
      headers: {
        Accept: "image/*",
      },
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available");
      console.error(`Cloudinary fetch failed: HTTP ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    const buffer = await response.buffer();
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    console.log("Image fetched successfully:", url);
    res.send(buffer);
  } catch (error) {
    console.error("Image proxy error:", error.message, { url });
    res.status(500).json({ error: `Failed to fetch image: ${error.message}` });
  }
}