export function FusionStackLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scales = { sm: 0.5, md: 0.7, lg: 1 };
  const s = scales[size];
  const iconH = Math.round(80 * s);
  const textSize = Math.round(22 * s);
  const subSize = Math.round(11 * s);
  const gap = Math.round(10 * s);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: gap }}>
      <img
        src="https://hdempuicehrxbjwlddpk.supabase.co/storage/v1/object/public/assets/FusionStack-transparent_2.png"
        alt=""
        style={{ height: iconH, width: "auto", objectFit: "contain" }}
      />
      <div style={{ textAlign: "center", lineHeight: 1.2 }}>
        <div style={{ fontSize: textSize, fontWeight: 900, letterSpacing: "-0.5px" }} className="text-foreground">
          FusionStack
        </div>
        <div style={{ fontSize: subSize, letterSpacing: "0.5px", fontFamily: "monospace" }} className="text-primary">
          a web builder Company
        </div>
      </div>
    </div>
  );
}

export function FusionStackLogoHorizontal() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src="https://hdempuicehrxbjwlddpk.supabase.co/storage/v1/object/public/assets/FusionStack-transparent_2.png"
        alt=""
        style={{ height: 40, width: "auto" }}
      />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.5px" }} className="text-foreground">
          FusionStack
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.5px", fontFamily: "monospace" }} className="text-primary">
          a web builder Company
        </div>
      </div>
    </div>
  );
}
