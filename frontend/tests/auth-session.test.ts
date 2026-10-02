import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api, { refreshSession } from "@/services/api";
import { SESSION_HINT, useAuthStore } from "@/store/authStore";

const originalAdapter = api.defaults.adapter;
describe("browser session security", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    useAuthStore.getState().clearAuth();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    api.defaults.adapter = originalAdapter;
  });
  it("keeps access tokens out of both persistent and session storage", () => {
    useAuthStore
      .getState()
      .setAuth(
        { id: "user-1", name: "Traveler", email: "test@example.com" },
        "sensitive-token",
      );
    expect(useAuthStore.getState().accessToken).toBe("sensitive-token");
    expect(localStorage.getItem(SESSION_HINT)).toBe("1");
    expect(Object.values(localStorage).join()).not.toContain("sensitive-token");
    expect(sessionStorage.length).toBe(0);
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem(SESSION_HINT)).toBeNull();
  });
  it("single-flights concurrent refresh requests to avoid token rotation races", async () => {
    const refresh = vi
      .spyOn(axios, "post")
      .mockResolvedValue({ data: { data: { accessToken: "new-access" } } });
    const [a, b] = await Promise.all([refreshSession(), refreshSession()]);
    expect(a).toBe("new-access");
    expect(b).toBe("new-access");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe("new-access");
  });
  it("does not refresh or redirect after invalid login credentials", async () => {
    const refresh = vi.spyOn(axios, "post");
    api.defaults.adapter = async (config) => {
      throw new AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          status: 401,
          statusText: "Unauthorized",
          config,
          headers: new AxiosHeaders(),
          data: { message: "Invalid credentials" },
        },
      );
    };
    await expect(
      api.post("/auth/login", { email: "test@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(AxiosError);
    expect(refresh).not.toHaveBeenCalled();
  });
  it.each(["/trips", "/auth/logout"])(
    "retries protected request %s once with the refreshed token",
    async (path) => {
      vi.spyOn(axios, "post").mockResolvedValue({
        data: { data: { accessToken: "rotated" } },
      });
      const seen: InternalAxiosRequestConfig[] = [];
      api.defaults.adapter = async (config) => {
        seen.push(config);
        if (seen.length === 1)
          throw new AxiosError(
            "Unauthorized",
            "ERR_BAD_REQUEST",
            config,
            undefined,
            {
              status: 401,
              statusText: "Unauthorized",
              config,
              headers: new AxiosHeaders(),
              data: {},
            },
          );
        return {
          status: 200,
          statusText: "OK",
          config,
          headers: new AxiosHeaders(),
          data: { success: true },
        };
      };
      await expect(
        path === "/auth/logout" ? api.post(path) : api.get(path),
      ).resolves.toMatchObject({ status: 200 });
      expect(seen).toHaveLength(2);
      expect(seen[1].headers.Authorization).toBe("Bearer rotated");
    },
  );
});
