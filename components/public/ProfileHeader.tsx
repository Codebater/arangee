interface Props {
  name: string;
  username: string;
  bio: string | null;
  avatarImageId: string | null;
  bannerImageId: string | null;
  showUsername?: boolean;
}

export function ProfileHeader({
  name,
  username,
  bio,
  avatarImageId,
  bannerImageId,
  showUsername = true,
}: Props) {
  const hasBanner = Boolean(bannerImageId);
  const hasAvatar = Boolean(avatarImageId);
  if (!hasBanner && !hasAvatar && !bio && !showUsername) return null;
  return (
    <header className="mb-8">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {hasBanner ? (
          <div
            className="aspect-[16/5] w-full bg-cover bg-center"
            style={{ backgroundImage: `url(/api/images/${bannerImageId})` }}
          />
        ) : (
          <div className="aspect-[16/5] w-full bg-gradient-to-br from-primary-tint via-bg-elevated to-surface" />
        )}
        <div className="relative px-5 pb-5 pt-3">
          {hasAvatar && (
            <div className="absolute -top-10 left-5 h-20 w-20 overflow-hidden rounded-full border-4 border-surface bg-bg-elevated shadow-[var(--shadow-card-hover)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${avatarImageId}`}
                alt={name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className={hasAvatar ? "pt-12" : "pt-0"}>
            {showUsername && (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                @{username}
              </p>
            )}
            <h1 className="mt-1 text-[28px] leading-tight tracking-[-0.025em] text-ink md:text-[32px]">
              {name}
            </h1>
            {bio && (
              <p className="mt-3 max-w-prose whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                {bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
