const ICON = "https://hdempuicehrxbjwlddpk.supabase.co/storage/v1/object/public/assets/FinalFusionStack.png.%20trans.png";

export function FusionStackLogo({ iconSize = 98 }: { iconSize?: number }) {
  const textSize = Math.max(14, Math.round(iconSize * 0.28));
  const subSize = Math.max(10, Math.round(iconSize * 0.13));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <img
        src={ICON}
        alt="FusionStack"
        style={{ height: iconSize, width: iconSize, objectFit: "contain", display: "block" }}
      />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: textSize, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1 }} className="text-foreground">
          FusionStack
        </div>
        <div style={{ fontSize: subSize, letterSpacing: "0.5px", fontFamily: "monospace", lineHeight: 1.4 }} className="text-primary">
          a web builder company
        </div>
      </div>
    </div>
  );
}

export function FusionStackIcon({ size = 32 }: { size?: number }) {
  return <img src={ICON} alt="FusionStack" style={{ height: size, width: size, objectFit: "contain", display: "block" }} />;
}
