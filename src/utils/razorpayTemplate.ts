export const razorpayHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #0f172a;
        color: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        padding: 20px;
        box-sizing: border-box;
      }
      .card {
        background: #1e293b;
        border-radius: 16px;
        padding: 32px;
        text-align: center;
        max-width: 400px;
        width: 100%;
        border: 1px solid #334155;
      }
      h2 { color: #f8fafc; margin-top: 0; font-size: 20px; }
      .price { font-size: 32px; font-weight: 800; color: #f97316; margin: 16px 0; }
      p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
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
        border: 3px solid #334155;
        border-top: 3px solid #f97316;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
        display: none;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Secure Checkout</h2>
      <div class="price">₹__AMOUNT_RUPEES__</div>
      <p>Initializing secure payment gateway...</p>
      <button id="pay-btn" style="display:none;">Pay Now</button>
      <div id="loader" class="loader" style="display:block;"></div>
    </div>

    <script>
      var options = {
        key: "__KEY__",
        amount: "__AMOUNT__",
        currency: "INR",
        name: "Gigiman",
        description: "Secure Payment Verification",
        order_id: "__ORDER_ID__",

        prefill: {
          name: "__PREFILL_NAME__",
          email: "__PREFILL_EMAIL__",
          contact: "__PREFILL_CONTACT__"
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
          // Retry
          setTimeout(startPayment, 500);
          return;
        }
        try {
          var rzp = new Razorpay(options);
          rzp.open();
          document.getElementById('loader').style.display = 'none';
          document.getElementById('pay-btn').style.display = 'block';
        } catch (e) {
          alert("Error opening payment window: " + e.message);
        }
      }

      document.getElementById('pay-btn').onclick = function() {
        startPayment();
      };

      window.onload = function() {
        startPayment();
      };
    </script>
  </body>
</html>
`;
