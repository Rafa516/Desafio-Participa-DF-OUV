import { cn } from "@/lib/utils";

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        "fixed top-0 left-0 z-[100] -translate-y-full bg-primary text-primary-foreground px-4 py-3 font-bold transition-transform focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-ring",
        "shadow-lg rounded-br-lg"
      )}
    >
      Pular para o conteúdo principal
    </a>
  );
}
