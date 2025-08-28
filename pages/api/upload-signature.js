// pages/api/upload-signature.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { signature } = req.body;
    if (!signature || !signature.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid signature data" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(signature, {
      folder: "pcr_signatures",
      resource_type: "image",
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Error uploading signature to Cloudinary:", error);
    res.status(500).json({ error: `Failed to upload signature: ${error.message}` });
  }
}