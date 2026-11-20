import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brand";

// ícone da tela de início do iPhone (o Safari não usa o icon.svg para isso)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <img src={brandIconDataUri(false)} width={180} height={180} alt="" />,
    size,
  );
}
