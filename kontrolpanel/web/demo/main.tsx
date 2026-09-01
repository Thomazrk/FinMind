import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import App from "../src/App";
import "../src/styles.css";
import "./demo.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elementet #root findes ikke i demo.html.");

createRoot(root).render(
  <StrictMode>
    <p className="demo-banner">
      Demo af kontrolpanelet med testdata fra <code>seed/data.json</code>. Ingen Firebase, ingen rigtige
      kunder — godkend og afvis virker, men skriver kun til hukommelsen i denne fane.
    </p>
    <MemoryRouter initialEntries={["/afventer"]}>
      <App />
    </MemoryRouter>
  </StrictMode>,
);
