"use client";

import { useState, useRef } from "react";

interface FakeCheckoutProps {
  price: string;
  productName: string;
  onPurchase: (email: string) => void;
}

export default function FakeCheckout({
  price,
  productName,
  onPurchase,
}: FakeCheckoutProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function formatCard(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 13) errs.card = "Enter a valid card number";
    if (expiry.length < 5) errs.expiry = "Enter MM/YY";
    if (cvc.length < 3) errs.cvc = "Enter CVC";
    if (!email.includes("@")) errs.email = "Enter a valid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setProcessing(true);
    // Simulate processing delay
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      onPurchase(email);
    }, 2000);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-6">
        <div className="w-16 h-16 rounded-full bg-leaf-400/20 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-leaf-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-500">
          Thank you for your purchase of {productName}.
        </p>
        <p className="text-xs text-gray-500 mt-4">
          This is a demo — no real payment was processed.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Pay for</span>
        <span className="font-semibold text-gray-900">{productName}</span>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Total</span>
          <span className="text-2xl font-bold text-gray-900">${price}</span>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 transition-colors"
        />
        {errors.email && (
          <p className="text-xs text-red-400 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Card number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCard(e.target.value))}
          placeholder="4242 4242 4242 4242"
          className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 transition-colors font-mono"
        />
        {errors.card && (
          <p className="text-xs text-red-400 mt-1">{errors.card}</p>
        )}
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Expiry</label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 transition-colors font-mono"
          />
          {errors.expiry && (
            <p className="text-xs text-red-400 mt-1">{errors.expiry}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">CVC</label>
          <input
            type="text"
            value={cvc}
            onChange={(e) =>
              setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="123"
            className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-leaf-400 focus:ring-1 focus:ring-leaf-400 transition-colors font-mono"
          />
          {errors.cvc && (
            <p className="text-xs text-red-400 mt-1">{errors.cvc}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={processing}
        className="w-full py-3 rounded-xl font-semibold text-white bg-leaf-400 hover:bg-leaf-400/90 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M4 12a8 8 0 018-8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay $${price}`
        )}
      </button>

      <p className="text-xs text-center text-gray-500 mt-2">
        Demo checkout — no real payment is processed
      </p>
    </form>
  );
}
