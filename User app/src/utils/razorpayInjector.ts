export const injectRazorpayData = (params: {
  htmlTemplate: string;
  keyId: string;
  amountPaise: number;
  orderId: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
}) => {
  const amountRupees = (params.amountPaise / 100).toFixed(2);
  return params.htmlTemplate
    .replace("__KEY__", params.keyId)
    .replace("__AMOUNT__", String(params.amountPaise))
    .replace("__AMOUNT_RUPEES__", amountRupees)
    .replace("__ORDER_ID__", params.orderId)
    .replace("__PREFILL_NAME__", params.prefillName || "")
    .replace("__PREFILL_EMAIL__", params.prefillEmail || "")
    .replace("__PREFILL_CONTACT__", params.prefillContact || "");
};
