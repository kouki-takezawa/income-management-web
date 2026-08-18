import "server-only";
import { randomBytes, createHash } from "node:crypto";

// パスワード再設定などで使う単回使用トークンのユーティリティ。
// 生のトークンは URL に載せてユーザーに渡し、DB にはハッシュ値のみ保存する
// （DB が漏洩してもトークン自体は再現できないようにするため）。

export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
