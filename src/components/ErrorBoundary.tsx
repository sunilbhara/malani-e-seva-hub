import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

const RELOAD_KEY = "malani-chunk-reload";

/** After a new deploy, old lazy chunks no longer exist; one reload fetches the new ones. */
function isChunkError(error: Error): boolean {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(error.message);
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary", error, info.componentStack);
    if (isChunkError(error)) {
      try {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
        }
      } catch {
        // ignore
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div role="alert" className="container-page flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
        <p className="font-hindi text-xl font-bold">कुछ गड़बड़ हो गई</p>
        <p className="mt-2 max-w-sm font-hindi text-small text-muted-foreground">पेज लोड नहीं हो सका। कृपया पेज दोबारा खोलें। समस्या बनी रहे तो इंटरनेट कनेक्शन जाँचें।</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 h-11 rounded-xl bg-primary px-5 font-hindi font-semibold text-primary-foreground"
        >
          दोबारा खोलें
        </button>
      </div>
    );
  }
}
