"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ro">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#fafaf9",
          color: "#0a0a0a",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#737373",
              margin: 0,
            }}
          >
            Eroare critică
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 400,
              margin: "12px 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            Aplicația nu a putut porni
          </h1>
          <p style={{ fontSize: 14, color: "#525252", margin: 0 }}>
            A apărut o eroare la nivelul layout-ului principal. Reîncarcă pagina pentru a încerca
            din nou.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: 16,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                fontSize: 12,
                color: "#737373",
              }}
            >
              ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              color: "#fafaf9",
              background: "#0a0a0a",
              border: 0,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Reîncarcă
          </button>
        </div>
      </body>
    </html>
  );
}
