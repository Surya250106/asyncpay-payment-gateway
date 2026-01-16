export function createModal(orderId) {
  if (document.getElementById("payment-gateway-modal")) return;

  const modal = document.createElement("div");
  modal.id = "payment-gateway-modal";
  modal.setAttribute("data-test-id", "payment-modal");

  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <iframe
          data-test-id="payment-iframe"
          src="http://localhost:3001/checkout?order_id=${orderId}&embedded=true"
        ></iframe>
        <button
          class="close-button"
          data-test-id="close-modal-button"
        >×</button>
      </div>
    </div>
  `;

  modal.querySelector(".close-button").onclick = () => {
    window.postMessage({ type: "close_modal" }, "*");
  };

  document.body.appendChild(modal);
}

export function removeModal() {
  const modal = document.getElementById("payment-gateway-modal");
  if (modal) modal.remove();
}
