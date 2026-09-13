import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/ui/ProgressBar";

describe("ProgressBar", () => {
  it("exposes the correct aria progressbar attributes", () => {
    render(<ProgressBar value={3} max={4} label="Tasks" showValue />);

    const bar = screen.getByRole("progressbar", { name: "Tasks" });
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("clamps values outside the 0-100 range", () => {
    render(<ProgressBar value={10} max={4} label="Tasks" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("handles a zero max without dividing by zero", () => {
    render(<ProgressBar value={0} max={0} label="Tasks" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});
