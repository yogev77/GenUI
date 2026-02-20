export default function LemonLogo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Sell This Pen"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
