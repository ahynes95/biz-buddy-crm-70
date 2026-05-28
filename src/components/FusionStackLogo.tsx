const ICON = "https://hdempuicehrxbjwlddpk.supabase.co/storage/v1/object/public/assets/FusionStack.png.%20trans.png";

export function FusionStackLogo({ iconSize = 48 }: { iconSize?: number }) {
  const textSize = Math.max(12, Math.round(iconSize * 0.28));
  const subSize = Math.max(9, Math.round(iconSize * 0.13));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        height: iconSize,
        width: iconSize,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <img
          src={ICON}
          alt="FusionStack"
          style={{
            height: iconSize * 1.65,
            width: "auto",
            display: "block",
          }}
        />
      </div>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: textSize, fontWeight: 900, letterSpacing: "-0.5px" }} className="text-foreground">
          FusionStack
        </div>
        <div style={{ fontSize: subSize, letterSpacing: "0.5px", fontFamily: "monospace" }} className="text-primary">
          a web builder company
        </div>
      </div>
    </div>
  );
}

export function FusionStackIcon({ size = 32 }: { size?: number }) {
  return (
    <div style={{
      height: size,
      width: size,
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <img
        src={ICON}
        alt="FusionStack"
        style={{
          height: size * 1.65,
          width: "auto",
          display: "block",
        }}
      />
    </div>
  );
}
