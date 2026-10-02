import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SampleItinerary } from "@/components/studio/SampleItinerary";

describe("the itinerary workspace", () => {
  it("discloses sample content and supports day navigation and completion", async () => {
    const user = userEvent.setup();
    render(<SampleItinerary />);
    expect(screen.getByText(/a hand-written sample/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Mark A slow morning in Fort Kochi complete",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Mark A slow morning in Fort Kochi incomplete",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Day 2" }));
    expect(
      within(screen.getByRole("tabpanel")).getByText(
        "An afternoon on the backwaters",
      ),
    ).toBeInTheDocument();
  });
  it("updates activity details through a labeled, accessible dialog", async () => {
    const user = userEvent.setup();
    render(<SampleItinerary />);
    await user.click(
      screen.getByRole("button", { name: "Edit A slow morning in Fort Kochi" }),
    );
    const dialog = screen.getByRole("dialog");
    const title = within(dialog).getByLabelText("Activity");
    await user.clear(title);
    await user.type(title, "A quiet coffee in Kochi");
    await user.click(
      within(dialog).getByRole("button", { name: "Save this little change" }),
    );
    expect(
      within(screen.getByRole("tabpanel")).getByText("A quiet coffee in Kochi"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("tracks packed items and supports keyboard tab navigation", async () => {
    const user = userEvent.setup();
    render(<SampleItinerary />);
    await user.click(
      screen.getByRole("tab", { name: "Pack a little smarter" }),
    );
    const item = screen.getByRole("checkbox", {
      name: /Reusable water bottle/,
    });
    await user.click(item);
    expect(item).toBeChecked();
    expect(
      screen.getByText("1 of 8 things, packed and ready."),
    ).toBeInTheDocument();
    screen.getByRole("tab", { name: "Pack a little smarter" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Ask Yatrik" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });
});
