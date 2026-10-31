import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("authentication validation", () => {
  it("accepts a valid registration payload", () => {
    expect(registerSchema.safeParse({
      name: "Player One",
      email: "player@example.com",
      password: "secure-pass-123"
    }).success).toBe(true);
  });

  it("rejects a weak password", () => {
    expect(registerSchema.safeParse({
      name: "Player One",
      email: "player@example.com",
      password: "123"
    }).success).toBe(false);
  });

  it("accepts a valid login payload", () => {
    expect(loginSchema.safeParse({
      email: "player@example.com",
      password: "secure-pass-123"
    }).success).toBe(true);
  });
});
