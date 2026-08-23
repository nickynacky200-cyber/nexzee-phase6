import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma, WalletTransactionType } from "@prisma/client";
import { ApiError } from "../../../utils/ApiError";

// Mocks a Prisma client whose $transaction just invokes the callback with a
// stubbed `tx`. This exercises recordWalletMovement's actual business logic
// (balance math, direction rules, insufficient-funds guard) without needing
// a real database — appropriate for unit tests. Full concurrent-request
// behavior (the row lock actually preventing a race) needs an integration
// test against real Postgres, which isn't covered here — see the note at
// the bottom of this file and in the root README's testing section.
const mockWalletUpdate = vi.fn();
const mockWalletTransactionCreate = vi.fn((args: any) => Promise.resolve({ id: "ledger-1", ...args.data }));
let mockWalletRow: { id: string; balance: string } | null;

vi.mock("../../../config/db", () => ({
  prisma: {
    $transaction: async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        $queryRaw: vi.fn(() => Promise.resolve(mockWalletRow ? [mockWalletRow] : [])),
        wallet: { update: mockWalletUpdate },
        walletTransaction: { create: mockWalletTransactionCreate },
      };
      return callback(tx);
    },
  },
}));

const { recordWalletMovement } = await import("../wallet.service");

beforeEach(() => {
  mockWalletUpdate.mockClear();
  mockWalletTransactionCreate.mockClear();
  mockWalletRow = { id: "wallet-1", balance: "1000.00" };
});

describe("recordWalletMovement", () => {
  it("rejects a non-positive amount before touching the database", async () => {
    await expect(
      recordWalletMovement({
        userId: "u1",
        amount: 0,
        type: WalletTransactionType.DEPOSIT,
        reference: "ref-1",
      })
    ).rejects.toThrow(ApiError);

    expect(mockWalletUpdate).not.toHaveBeenCalled();
  });

  it("throws 404 if the wallet doesn't exist", async () => {
    mockWalletRow = null;

    await expect(
      recordWalletMovement({
        userId: "ghost",
        amount: 100,
        type: WalletTransactionType.DEPOSIT,
        reference: "ref-2",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("DEPOSIT increases the balance and records correct before/after", async () => {
    await recordWalletMovement({
      userId: "u1",
      amount: 500,
      type: WalletTransactionType.DEPOSIT,
      reference: "ref-3",
    });

    expect(mockWalletUpdate).toHaveBeenCalledWith({
      where: { id: "wallet-1" },
      data: { balance: expect.any(Prisma.Decimal) },
    });
    const newBalance = mockWalletUpdate.mock.calls[0][0].data.balance as Prisma.Decimal;
    expect(newBalance.toString()).toBe("1500");

    const ledgerData = mockWalletTransactionCreate.mock.calls[0][0].data;
    expect(ledgerData.balanceAfter.toString()).toBe("1500");
    expect(ledgerData.balanceBefore.toString()).toBe("1000");
  });

  it("PURCHASE decreases the balance when funds are sufficient", async () => {
    await recordWalletMovement({
      userId: "u1",
      amount: 300,
      type: WalletTransactionType.PURCHASE,
      reference: "ref-4",
    });

    const newBalance = mockWalletUpdate.mock.calls[0][0].data.balance as Prisma.Decimal;
    expect(newBalance.toString()).toBe("700");
  });

  it("PURCHASE throws and never updates balance when funds are insufficient", async () => {
    mockWalletRow = { id: "wallet-1", balance: "50.00" };

    await expect(
      recordWalletMovement({
        userId: "u1",
        amount: 300,
        type: WalletTransactionType.PURCHASE,
        reference: "ref-5",
      })
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("Insufficient") });

    expect(mockWalletUpdate).not.toHaveBeenCalled();
    expect(mockWalletTransactionCreate).not.toHaveBeenCalled();
  });

  it("REFUND always credits, regardless of direction param", async () => {
    await recordWalletMovement({
      userId: "u1",
      amount: 200,
      type: WalletTransactionType.REFUND,
      reference: "ref-6",
      direction: "debit", // should be ignored for REFUND
    });

    const newBalance = mockWalletUpdate.mock.calls[0][0].data.balance as Prisma.Decimal;
    expect(newBalance.toString()).toBe("1200");
  });

  it("ADJUSTMENT with direction=credit increases the balance", async () => {
    await recordWalletMovement({
      userId: "u1",
      amount: 150,
      type: WalletTransactionType.ADJUSTMENT,
      reference: "ref-7",
      direction: "credit",
    });

    const newBalance = mockWalletUpdate.mock.calls[0][0].data.balance as Prisma.Decimal;
    expect(newBalance.toString()).toBe("1150");
  });

  it("ADJUSTMENT with direction=debit decreases the balance and is balance-checked", async () => {
    await recordWalletMovement({
      userId: "u1",
      amount: 150,
      type: WalletTransactionType.ADJUSTMENT,
      reference: "ref-8",
      direction: "debit",
    });

    const newBalance = mockWalletUpdate.mock.calls[0][0].data.balance as Prisma.Decimal;
    expect(newBalance.toString()).toBe("850");
  });

  it("ADJUSTMENT debit throws on insufficient balance, same guard as a purchase", async () => {
    mockWalletRow = { id: "wallet-1", balance: "50.00" };

    await expect(
      recordWalletMovement({
        userId: "u1",
        amount: 999,
        type: WalletTransactionType.ADJUSTMENT,
        reference: "ref-9",
        direction: "debit",
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockWalletUpdate).not.toHaveBeenCalled();
  });

  it("links depositId and orderId through to the ledger row when provided", async () => {
    await recordWalletMovement({
      userId: "u1",
      amount: 100,
      type: WalletTransactionType.DEPOSIT,
      reference: "ref-10",
      depositId: "dep-1",
    });

    expect(mockWalletTransactionCreate.mock.calls[0][0].data.depositId).toBe("dep-1");
  });
});

// ── What this file does NOT cover ──────────────────────────────────────
// - The actual `SELECT ... FOR UPDATE` row lock preventing a real race
//   between two concurrent requests. That requires two genuinely
//   concurrent transactions against a real Postgres instance — an
//   integration test, not a unit test. Worth adding before scaling this
//   past a single-instance deployment; see root README's testing section.
// - Prisma's actual Decimal precision/rounding behavior at the DB layer —
//   this test mocks $queryRaw's return shape, it doesn't hit real SQL.
