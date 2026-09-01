import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Customer, Task } from "../types";

const decideTask = vi.fn().mockResolvedValue(undefined);

const baseTask: Task = {
  id: "opg-1",
  kundeId: "bageriet",
  sideId: "bageriet-forside",
  slackBeskedId: "1756713120.004500",
  slackPermalink: "https://slack.example/p1",
  beskedTekst: "Vi lukker kl. 16 om lørdagen.",
  afsender: "Mette Krogh",
  modtagetTidspunkt: "2026-09-01T06:32:00.000Z",
  resumé: "Retter lørdagens lukketid til 16.00.",
  klassifikation: { type: "tekstrettelse", estimatMinutter: 8, dækketAfAbonnement: true },
  status: "afventer",
  branch: "auto/aabningstider-loerdag",
  prUrl: "https://github.com/studie/x/pull/48",
  previewUrl: "https://preview.example",
  diff: [{ filnavn: "src/components/Aabningstider.astro", før: "14.00", efter: "16.00" }],
  forbrug: { inputTokens: 18422, outputTokens: 1105, kroner: 1.34 },
  afgjortAf: null,
  afgjortTidspunkt: null,
  afvisningsårsag: null,
};

const customer: Customer = {
  id: "bageriet",
  navn: "Bageriet på Torvet",
  slackKanalId: "C1",
  repo: "studie/bageriet",
  domæne: "bageriet.dk",
  pakke: "Vedligehold lille",
  månedspris: 1200,
  fornyelsesdato: "2026-11-01",
  supportMinutterDenneMåned: 42,
};

let tasks: Task[] = [baseTask];

vi.mock("../data/firestore", () => ({
  decideTask: (...args: unknown[]) => decideTask(...args),
  watchTasks: (onData: (v: Task[]) => void) => {
    onData(tasks);
    return () => {};
  },
  watchCustomers: (onData: (v: Customer[]) => void) => {
    onData([customer]);
    return () => {};
  },
}));

vi.mock("../auth", () => ({
  useAuth: () => ({ user: { email: "mig@studiet.dk" } }),
}));

const { default: PendingPage } = await import("../pages/Pending");

describe("Afventer godkendelse", () => {
  beforeEach(() => {
    decideTask.mockClear();
    tasks = [{ ...baseTask }];
  });

  it("viser kundens navn, beskeden ordret, diff, forbrug og rå id'er", () => {
    render(<PendingPage />);
    expect(screen.getByText("Bageriet på Torvet")).toBeInTheDocument();
    expect(screen.getByText("Vi lukker kl. 16 om lørdagen.")).toBeInTheDocument();
    expect(screen.getByText("src/components/Aabningstider.astro")).toBeInTheDocument();
    expect(screen.getByText("opgaver/opg-1")).toBeInTheDocument();
    expect(screen.getByText("auto/aabningstider-loerdag")).toBeInTheDocument();
    expect(screen.getByText(/18\.422/)).toBeInTheDocument();
  });

  it("skriver godkendelsen med min egen e-mail som afgjortAf", async () => {
    const user = userEvent.setup();
    render(<PendingPage />);
    await user.click(screen.getByRole("button", { name: "Godkend og udgiv" }));
    await waitFor(() =>
      expect(decideTask).toHaveBeenCalledWith({
        taskId: "opg-1",
        approved: true,
        rejectionReason: undefined,
        decidedBy: "mig@studiet.dk",
      }),
    );
  });

  it("kræver en årsag før en afvisning kan sendes", async () => {
    const user = userEvent.setup();
    render(<PendingPage />);
    await user.click(screen.getByRole("button", { name: "Afvis" }));

    expect(screen.getByRole("button", { name: "Afvis og slet branch" })).toBeDisabled();
    expect(decideTask).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Hvorfor afviser du?"), "Billedet er for mørkt");
    await user.click(screen.getByRole("button", { name: "Afvis og slet branch" }));

    await waitFor(() =>
      expect(decideTask).toHaveBeenCalledWith({
        taskId: "opg-1",
        approved: false,
        rejectionReason: "Billedet er for mørkt",
        decidedBy: "mig@studiet.dk",
      }),
    );
  });

  it("viser kun opgaver med status afventer", () => {
    tasks = [
      { ...baseTask, id: "a", status: "godkendt" },
      { ...baseTask, id: "b", status: "tilbudSendt" },
    ];
    render(<PendingPage />);
    expect(screen.getByText("Intet venter på dig")).toBeInTheDocument();
  });

  it("fortæller mig hvad der gik galt hvis skrivningen fejler", async () => {
    decideTask.mockRejectedValueOnce(Object.assign(new Error("nej"), { code: "permission-denied" }));
    const user = userEvent.setup();
    render(<PendingPage />);
    await user.click(screen.getByRole("button", { name: "Godkend og udgiv" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Firestore afviste forespørgslen.");
  });
});
