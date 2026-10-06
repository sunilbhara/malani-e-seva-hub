import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/lib/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// The only toast system in the app (audit B14). Bottom-centre on mobile, 3 s, above the bottom nav.
const Toaster = (props: ToasterProps) => {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      position="bottom-center"
      duration={3000}
      offset={80}
      className="toaster group font-hindi"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2 group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
