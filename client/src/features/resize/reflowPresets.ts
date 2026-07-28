import type { CanvasPreset } from "./types";

export const REFLOW_PRESETS: CanvasPreset[] = [
  {
    id: "instagram-post",
    label: "Instagram Post",
    width: 1080,
    height: 1080,
    channel: "social",
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    width: 1080,
    height: 1920,
    channel: "social",
  },
  {
    id: "facebook-post",
    label: "Facebook Post",
    width: 1200,
    height: 630,
    channel: "social",
  },
  {
    id: "youtube-thumbnail",
    label: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    channel: "social",
  },
  {
    id: "etsy-listing",
    label: "Etsy Listing",
    width: 2000,
    height: 2000,
    channel: "marketplace",
  },
  {
    id: "ebay-listing",
    label: "eBay Listing",
    width: 1600,
    height: 1600,
    channel: "marketplace",
  },
  {
    id: "website-hero",
    label: "Website Hero",
    width: 1920,
    height: 800,
    channel: "web",
  },
];
