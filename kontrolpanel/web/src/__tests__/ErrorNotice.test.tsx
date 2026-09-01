import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorNotice } from "../components/ErrorNotice";

describe("ErrorNotice", () => {
  it("viser både problemet, handlingen og koden", () => {
    render(
      <ErrorNotice
        error={{
          whatHappened: "Firestore afviste forespørgslen.",
          whatToDo: "Deploy reglerne.",
          code: "permission-denied",
        }}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Firestore afviste forespørgslen.")).toBeInTheDocument();
    expect(screen.getByText("Deploy reglerne.")).toBeInTheDocument();
    expect(screen.getByText(/permission-denied/)).toBeInTheDocument();
  });
});
