import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Planner } from "@/components/studio/Planner";
import { tripsService } from "@/services/trips.service";
import { useAuthStore } from "@/store/authStore";
import { sampleTrip } from "@/lib/sample-trip";
import { DRAFT_KEY } from "@/lib/travel";

const { push, params } = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params,
}));
vi.mock("@/services/trips.service", () => ({
  tripsService: { create: vi.fn(), generateItinerary: vi.fn() },
}));

async function reachReview() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Your destination"), "Goa, India");
  await user.click(screen.getByRole("button", { name: "7 days" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText("How do you like to travel?");
  await user.click(screen.getByRole("radio", { name: /A little of both/ }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText("What makes you feel alive?");
  await user.click(screen.getByRole("button", { name: "Food & coffee" }));
  await user.click(screen.getByRole("button", { name: "Slow beach days" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText("Looking like your kind of trip.");
  return user;
}

describe("the planning journey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });
  it("keeps an empty destination on the first step with an accessible error", async () => {
    const user = userEvent.setup();
    render(<Planner />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Tell us where");
    expect(screen.getByLabelText("Your destination")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(tripsService.create).not.toHaveBeenCalled();
  });
  it("preserves choices before sending a guest to signup, without calling the paid API", async () => {
    render(<Planner />);
    const user = await reachReview();
    await user.click(
      screen.getByRole("button", { name: "Save my choices & continue" }),
    );
    expect(push).toHaveBeenCalledWith(
      "/auth/register?next=%2Fplan%3Freview%3D1",
    );
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY)!)).toMatchObject({
      destination: "Goa, India",
      durationDays: 7,
      budgetTier: "Medium",
      interests: ["Food", "Beaches"],
    });
    expect(tripsService.create).not.toHaveBeenCalled();
  });
  it("creates, enqueues, and opens an authenticated trip with the selected payload", async () => {
    useAuthStore.setState({ isAuthenticated: true });
    vi.mocked(tripsService.create).mockResolvedValue({
      ...sampleTrip,
      _id: "trip-123",
    });
    vi.mocked(tripsService.generateItinerary).mockResolvedValue({
      jobId: "job-123",
    });
    render(<Planner />);
    const user = await reachReview();
    await user.click(
      screen.getByRole("button", { name: "Create my itinerary" }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/trip/trip-123"),
    );
    expect(tripsService.create).toHaveBeenCalledWith({
      destination: "Goa, India",
      durationDays: 7,
      budgetTier: "Medium",
      interests: ["Food", "Beaches"],
      startDate: undefined,
    });
    expect(tripsService.generateItinerary).toHaveBeenCalledWith("trip-123");
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });
  it("retries the same saved draft when enqueue fails instead of creating a duplicate", async () => {
    useAuthStore.setState({ isAuthenticated: true });
    vi.mocked(tripsService.create).mockResolvedValue({
      ...sampleTrip,
      _id: "saved-draft",
    });
    vi.mocked(tripsService.generateItinerary)
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce({ jobId: "retry" });
    render(<Planner />);
    const user = await reachReview();
    await user.click(
      screen.getByRole("button", { name: "Create my itinerary" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your plan couldn’t start",
    );
    await user.click(
      screen.getByRole("button", { name: "Create my itinerary" }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/trip/saved-draft"),
    );
    expect(tripsService.create).toHaveBeenCalledTimes(1);
    expect(tripsService.generateItinerary).toHaveBeenCalledTimes(2);
  });
});
