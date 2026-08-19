import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "年収管理アプリ",
    short_name: "年収管理",
    description: "給与・残業・賞与・有給休暇・家計簿・資産管理をまとめて管理するアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ee",
    theme_color: "#f0a9a0",
    icons: [
      { src: "/api/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/icon/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
