export const razorpayHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #f8fafc;
        color: #0f172a;
        margin: 0;
        padding: 20px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .card {
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        max-width: 420px;
        width: 100%;
        border: 1px solid #e2e8f0;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      }
      .header-badge {
        display: inline-flex;
        align-items: center;
        background: #ecfdf5;
        color: #059669;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        margin-bottom: 12px;
      }
      h2 { color: #0f172a; margin: 0 0 4px 0; font-size: 20px; }
      .service-title { color: #64748b; font-size: 14px; margin-bottom: 20px; }
      
      .breakdown-box {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid #e2e8f0;
      }
      .breakdown-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 14px;
        color: #475569;
      }
      .breakdown-row.discount {
        color: #16a34a;
        font-weight: 600;
      }
      .divider {
        height: 1px;
        background: #e2e8f0;
        margin: 12px 0;
      }
      .breakdown-row.total {
        margin-bottom: 0;
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }
      .total-amount {
        color: #f97316;
        font-size: 20px;
        font-weight: 800;
      }
      
      button {
        background-color: #f97316;
        color: white;
        border: none;
        padding: 14px 24px;
        font-size: 16px;
        font-weight: 700;
        border-radius: 10px;
        cursor: pointer;
        width: 100%;
        transition: background-color 0.2s;
        box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);
      }
      button:hover { background-color: #ea580c; }
      .loader {
        border: 3px solid #e2e8f0;
        border-top: 3px solid #f97316;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        animation: spin 1s linear infinite;
        margin: 16px auto;
        display: none;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .security-note {
        margin-top: 16px;
        font-size: 12px;
        color: #94a3b8;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header-badge">🛡️ 100% Secure Checkout</div>
      <h2>Payment Summary</h2>
      <div class="service-title">__SERVICE_NAME__</div>

      <div class="breakdown-box">
        <div class="breakdown-row">
          <span>Item Total</span>
          <span>₹__ITEM_TOTAL__</span>
        </div>
        __DISCOUNT_ROW__
        <div class="breakdown-row">
          <span>Convenience Fee</span>
          <span>₹__CONVENIENCE_FEE__</span>
        </div>
        <div class="divider"></div>
        <div class="breakdown-row total">
          <span>__TOTAL_LABEL__</span>
          <span class="total-amount">₹__AMOUNT_RUPEES__</span>
        </div>
        __REMAINING_ROW__
      </div>

      <button id="pay-btn" type="button">Pay ₹__AMOUNT_RUPEES__ via Razorpay</button>
      <div id="loader" class="loader"></div>
      
      <div class="security-note">
        Click above to complete your payment securely.
      </div>
    </div>

    <script>
      var options = {
        key: "__KEY__",
        amount: "__AMOUNT__",
        currency: "INR",
        name: "Gigiman",
        description: "__DESCRIPTION__",
        order_id: "__ORDER_ID__",

        prefill: {
          name: "__PREFILL_NAME__",
          email: "__PREFILL_EMAIL__",
          contact: "__PREFILL_CONTACT__"
        },
        notes: {
          service: "__SERVICE_NAME__",
          convenience_fee: "₹__CONVENIENCE_FEE__"
        },

        handler: function (response) {
          document.getElementById('pay-btn').style.display = 'none';
          document.getElementById('loader').style.display = 'block';
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: true,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }));
        },

        modal: {
          ondismiss: function () {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('pay-btn').style.display = 'block';
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: false,
              reason: "dismissed"
            }));
          }
        },
        theme: {
          color: "#f97316"
        }
      };

      function startPayment() {
        if (typeof Razorpay === 'undefined') {
          document.getElementById('pay-btn').style.display = 'none';
          document.getElementById('loader').style.display = 'block';
          setTimeout(startPayment, 300);
          return;
        }
        try {
          var rzp = new Razorpay(options);
          rzp.open();
        } catch (e) {
          document.getElementById('loader').style.display = 'none';
          document.getElementById('pay-btn').style.display = 'block';
          alert("Error opening payment window: " + e.message);
        }
      }

      document.getElementById('pay-btn').onclick = function() {
        startPayment();
      };
    </script>
  </body>
</html>
`;
