import {
  Globe,
  Mail,
  Send,
  MessageCircle,
  Music,
  AtSign,
  Cloud,
  Link as LinkIcon,
} from "lucide-react";
import type { LinkPlatform } from "@/lib/types";

interface Props {
  platform: LinkPlatform;
  size?: number;
  className?: string;
}

export function PlatformIcon({ platform, size = 14, className }: Props) {
  switch (platform) {
    case "github":
      return <BrandSvg size={size} className={className} viewBox="0 0 24 24" path="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.69-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.93 10.93 0 0 1 5.74 0c2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.36-5.24 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />;
    case "linkedin":
      return <BrandSvg size={size} className={className} viewBox="0 0 24 24" path="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />;
    case "twitter":
      return <BrandSvg size={size} className={className} viewBox="0 0 24 24" path="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25h6.83l4.713 6.231 5.447-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />;
    case "instagram":
      return <BrandSvg size={size} className={className} viewBox="0 0 24 24" path="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.71 3.71 0 0 1-1.38-.9 3.71 3.71 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.87 5.87 0 0 0-2.13 1.38A5.87 5.87 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.73 1.48 1.38 2.13.65.65 1.33 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.8-.31 1.48-.73 2.13-1.38a5.87 5.87 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.87 5.87 0 0 0-1.38-2.13A5.87 5.87 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />;
    case "youtube":
      return <BrandSvg size={size} className={className} viewBox="0 0 24 24" path="M23.5 6.2c-.27-1.04-1.07-1.86-2.1-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.57A3.07 3.07 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8c.27 1.04 1.07 1.86 2.1 2.13 1.9.57 9.4.57 9.4.57s7.5 0 9.4-.57a3.07 3.07 0 0 0 2.1-2.13C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.27 3.6-6.27 3.6z" />;
    case "twitch":
      return <BrandSvg size={size} className={className} viewBox="0 0 24 24" path="M2.149 0L.537 4.119v16.836h5.731V24h3.224l3.045-3.045h4.657L23.463 14.91V0H2.149zm19.165 13.836l-3.582 3.582h-5.731l-3.045 3.045v-3.045H4.836V1.791h16.478v12.045zM14.687 5.731h1.791v5.373h-1.791V5.731zm-4.836 0h1.791v5.373h-1.791V5.731z" />;
    case "tiktok":
      return <BrandSvg size={size} className={className} viewBox="0 0 24 24" path="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.91a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z" />;
    case "discord":
      return <MessageCircle size={size} className={className} />;
    case "telegram":
      return <Send size={size} className={className} />;
    case "mastodon":
      return <AtSign size={size} className={className} />;
    case "bluesky":
      return <Cloud size={size} className={className} />;
    case "email":
      return <Mail size={size} className={className} />;
    case "custom":
      return <LinkIcon size={size} className={className} />;
    case "tiktok":
      return <Music size={size} className={className} />;
    case "website":
    default:
      return <Globe size={size} className={className} />;
  }
}

function BrandSvg({
  size,
  className,
  viewBox,
  path,
}: {
  size: number;
  className?: string;
  viewBox: string;
  path: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d={path} />
    </svg>
  );
}
