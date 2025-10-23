'use client';

import React, { useState } from 'react';

export default function PricingPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');

  const handleCheckout = (plan: string) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Pricing</h1>
      <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-xl shadow p-6 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Starter</h2>
            <p className="mb-2">Perfect for small businesses</p>
            <p className="text-2xl font-bold mb-4">$29/mo</p>
            <ul className="list-disc ml-4 mb-2 text-sm">
              <li>AI Chatbot (up to 500 chats)</li>
              <li>Basic messaging channels</li>
              <li>Appointment scheduling</li>
            </ul>
          </div>
          <button
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition"
            onClick={() => handleCheckout('Starter')}
          >
            Get Started
          </button>
        </div>
        <div className="bg-gray-800 rounded-xl shadow p-6 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Pro</h2>
            <p className="mb-2">For growing teams</p>
            <p className="text-2xl font-bold mb-4">$99/mo</p>
            <ul className="list-disc ml-4 mb-2 text-sm">
              <li>Unlimited AI chats</li>
              <li>All messaging channels</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
          </div>
          <button
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition"
            onClick={() => handleCheckout('Pro')}
          >
            Choose Pro
          </button>
        </div>
      </div>
      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-md text-white">
            <h3 className="text-xl font-bold mb-4">Checkout - {selectedPlan} Plan</h3>
            <div className="mb-6">
              <p className="block mb-2 font-semibold">Choose payment method:</p>
              <div className="flex gap-4 mb-4">
                <button
                  className={`px-4 py-2 rounded-xl border ${paymentMethod === 'card' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-white border-gray-700'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  Pay with Card
                </button>
                <button
                  className={`px-4 py-2 rounded-xl border ${paymentMethod === 'bank' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-white border-gray-700'}`}
                  onClick={() => setPaymentMethod('bank')}
                >
                  Pay with Bank
                </button>
              </div>
              {paymentMethod === 'card' ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Card Number"
                    className="border rounded px-3 py-2 w-full bg-gray-800 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Expiry (MM/YY)"
                    className="border rounded px-3 py-2 w-full bg-gray-800 text-white"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="border rounded px-3 py-2 w-full bg-gray-800 text-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Bank Name"
                    className="border rounded px-3 py-2 w-full bg-gray-800 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    className="border rounded px-3 py-2 w-full bg-gray-800 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Account Name"
                    className="border rounded px-3 py-2 w-full bg-gray-800 text-white"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-xl bg-gray-700 text-white"
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
