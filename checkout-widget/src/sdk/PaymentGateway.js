import { createModal, removeModal } from "./modal";
import "./styles.css";

class PaymentGateway {
  constructor(options) {
    if (!options || !options.key || !options.orderId) {
      throw new Error("key and orderId are required");
    }

    this.key = options.key;
    this.orderId = options.orderId;
    this.onSuccess = options.onSuccess || function () {};
    this.onFailure = options.onFailure || function () {};
    this.onClose = options.onClose || function () {};

    this._messageHandler = this._handleMessage.bind(this);
  }

  open() {
    createModal(this.orderId);

    window.addEventListener("message", this._messageHandler);
  }

  close() {
    removeModal();
    window.removeEventListener("message", this._messageHandler);
    this.onClose();
  }

  _handleMessage(event) {
    const { type, data } = event.data || {};

    if (type === "payment_success") {
      this.onSuccess(data);
      this.close();
    } else if (type === "payment_failed") {
      this.onFailure(data);
    } else if (type === "close_modal") {
      this.close();
    }
  }
}

// Expose globally
window.PaymentGateway = PaymentGateway;

export default PaymentGateway;
