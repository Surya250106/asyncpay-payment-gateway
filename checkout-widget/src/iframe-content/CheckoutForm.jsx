import React from "react";

export default function CheckoutForm() {
  const paySuccess = () => {
    window.parent.postMessage(
      { type: "payment_success", data: { paymentId: "pay_demo_123" } },
      "*"
    );
  };

  const payFail = () => {
    window.parent.postMessage(
      { type: "payment_failed", data: { error: "Payment failed" } },
      "*"
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Checkout</h3>
      <button onClick={paySuccess}>Simulate Success</button>
      <button onClick={payFail} style={{ marginLeft: 10 }}>
        Simulate Failure
      </button>
    </div>
  );
}
