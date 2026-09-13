export interface RazorpayInjectParams {
  htmlTemplate: string;
  keyId: string;
  amountPaise: number;
  orderId: string;
  serviceName?: string;
  itemTotal?: number;
  convenienceFee?: number;
  discountAmount?: number;
  paymentType?: 'FULL' | 'ADVANCE';
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
  description?: string;
}

export const injectRazorpayData = (params: RazorpayInjectParams) => {
  const amountPaise = Math.round(params.amountPaise);
  const amountRupees = (amountPaise / 100).toFixed(2);
  const convenienceFee = params.convenienceFee ?? 0;
  const itemTotal = params.itemTotal ?? Math.round(amountPaise / 100 - convenienceFee);
  
  const discountRow = (params.discountAmount && params.discountAmount > 0)
    ? `<div class="breakdown-row discount"><span>Discount</span><span>-₹${params.discountAmount}</span></div>`
    : '';

  const isAdvance = params.paymentType === 'ADVANCE';
  const totalLabel = isAdvance ? 'Advance to Pay (18% + Fee)' : 'Total to Pay Now';
  
  const remainingRow = isAdvance
    ? `<div class="breakdown-row" style="margin-top: 8px; font-size: 13px; color: #64748b;">
        <span>Remaining Balance (after service)</span>
        <span style="font-weight: 600; color: #0f172a;">₹${Math.max(0, Math.round((itemTotal - (params.discountAmount || 0)) * 0.82))}</span>
       </div>`
    : '';

  const description = params.description || `Item: ₹${itemTotal}${convenienceFee ? ` + Fee: ₹${convenienceFee}` : ''}`;

  return params.htmlTemplate
    .replace(/__KEY__/g, params.keyId)
    .replace(/__AMOUNT__/g, String(amountPaise))
    .replace(/__AMOUNT_RUPEES__/g, amountRupees)
    .replace(/__ORDER_ID__/g, params.orderId)
    .replace(/__SERVICE_NAME__/g, params.serviceName || "Service Booking")
    .replace(/__ITEM_TOTAL__/g, String(itemTotal))
    .replace(/__CONVENIENCE_FEE__/g, String(convenienceFee))
    .replace(/__DISCOUNT_ROW__/g, discountRow)
    .replace(/__TOTAL_LABEL__/g, totalLabel)
    .replace(/__REMAINING_ROW__/g, remainingRow)
    .replace(/__DESCRIPTION__/g, description)
    .replace(/__PREFILL_NAME__/g, params.prefillName || "")
    .replace(/__PREFILL_EMAIL__/g, params.prefillEmail || "")
    .replace(/__PREFILL_CONTACT__/g, params.prefillContact || "");
};
