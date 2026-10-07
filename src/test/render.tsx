/* eslint-disable react-refresh/only-export-components */
// Renders a page or component with every provider the app uses, at a given URL.
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "@/i18n";
import { ThemeProvider } from "@/lib/theme";

function LocationProbe() {
  const location = useLocation();
  return <span hidden data-testid="location">{location.pathname + location.search + location.hash}</span>;
}

export interface RenderOptions {
  /** URL to start at. */
  route?: string;
  /** Route pattern the element is mounted on (for useParams). */
  path?: string;
}

export function renderRoute(ui: ReactElement, { route = "/", path = "*" }: RenderOptions = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: 0 }, mutations: { retry: false } },
  });
  const utils = render(
    <ThemeProvider>
    <HelmetProvider>
      <I18nProvider>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={ui} />
              {path !== "*" && <Route path="*" element={<p>other page</p>} />}
            </Routes>
            <LocationProbe />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nProvider>
    </HelmetProvider>
    </ThemeProvider>,
  );
  return { ...utils, client, location: () => screen.getByTestId("location").textContent ?? "" };
}
