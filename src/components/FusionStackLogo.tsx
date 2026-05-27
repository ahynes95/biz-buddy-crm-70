const ICON = "https://hdempuicehrxbjwlddpk.supabase.co/storage/v1/object/public/assets/FusionStack-icon.png";

export function FusionStackLogo({ iconSize = 48 }: { iconSize?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img src={ICON} alt="FusionStack" style={{ height: iconSize, width: "auto" }} />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.5px" }} className="text-foreground">
          FusionStack
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.5px", fontFamily: "monospace" }} className="text-primary">
          a web builder Company
        </div>
      </div>
    </div>
  );
}

export function FusionStackIcon({ size = 32 }: { size?: number }) {
  return <img src={ICON} alt="FusionStack" style={{ height: size, width: "auto" }} />;
}
