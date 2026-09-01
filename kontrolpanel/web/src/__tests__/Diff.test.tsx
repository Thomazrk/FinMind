import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Diff } from "../components/Diff";

describe("Diff", () => {
  it("siger det ligeud når der ikke er nogen kodeændring", () => {
    render(<Diff files={[]} />);
    expect(screen.getByText(/Ingen kodeændring/)).toBeInTheDocument();
  });

  it("viser filnavn og både før og efter", () => {
    render(
      <Diff files={[{ filnavn: "src/components/Footer.astro", før: "40 11 77 22", efter: "40 12 88 90" }]} />,
    );
    expect(screen.getByText("src/components/Footer.astro")).toBeInTheDocument();
    expect(screen.getByText("Før")).toBeInTheDocument();
    expect(screen.getByText("Efter")).toBeInTheDocument();
    expect(screen.getByText("40 11 77 22")).toBeInTheDocument();
    expect(screen.getByText("40 12 88 90")).toBeInTheDocument();
  });

  it("nummererer linjerne så jeg kan pege på en bestemt", () => {
    render(<Diff files={[{ filnavn: "a.astro", før: "en\nto\ntre", efter: "en\nto" }]} />);
    expect(screen.getAllByText("3")).toHaveLength(1);
  });
});
