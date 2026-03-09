import type { SignoffData } from "@/providers/DraftProvider";

interface SignoffFooterProps {
  signoff: SignoffData;
  signedBy?: string;
}

const SignoffFooter = ({ signoff, signedBy }: SignoffFooterProps) => {
  const signedAt = new Date(signoff.signedAt);

  const formattedDate = signedAt.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const formattedTime = signedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const offsetMinutes = -signedAt.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const gmtOffset = `GMT${offsetMinutes >= 0 ? "+" : "-"}${offsetHours}${offsetMins ? `:${offsetMins}` : ""}`;
  console.log("signature:", JSON.stringify(signoff.signatureDataUrl));
  return (
    <div className="mt-10 pt-6 border-t border-border">
      <div className="flex items-start justify-between gap-6">
        {/* Left — text block */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Signed by
          </p>
          <p className="text-sm font-medium text-foreground">
            {signedBy ?? "anonymous"}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              Electronically signed on {formattedDate} {formattedTime}{" "}
              <span className="">({gmtOffset})</span>
            </span>
          </div>
        </div>

        {/* Right — signature image */}
        <div className="shrink-0 text-right space-y-1">
          {signoff.signatureDataUrl && (
            <img
              src={signoff.signatureDataUrl}
              alt="Signature"
              className="h-14 w-auto object-contain"
            />
          )}
          <div className="border-t border-foreground/20 w-40 ml-auto" />
          <p className="text-[11px] text-muted-foreground">Signature</p>
        </div>
      </div>
    </div>
  );
};

export default SignoffFooter;
