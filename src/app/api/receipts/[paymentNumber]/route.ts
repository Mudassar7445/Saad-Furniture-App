import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, orders, users, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentNumber: string }> }
) {
  const { paymentNumber } = await params;

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.paymentNumber, paymentNumber))
    .limit(1);

  if (!payment) {
    return new NextResponse('Receipt not found', { status: 404 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
  const [customer] = await db.select().from(users).where(eq(users.id, payment.customerId)).limit(1);
  const [sysSettings] = await db.select().from(settings).where(eq(settings.id, 'system_settings')).limit(1);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Receipt - ${payment.paymentNumber} | Saad Furniture</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f8fafc;
      color: #0f172a;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #b4975a;
      padding-bottom: 24px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #1e293b;
      margin: 0;
    }
    .brand-sub {
      color: #b4975a;
      font-size: 13px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .receipt-badge {
      text-align: right;
    }
    .receipt-no {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    .receipt-date {
      color: #64748b;
      font-size: 14px;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin: 32px 0;
    }
    .box-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .box-val {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 32px 0;
    }
    th {
      text-align: left;
      padding: 12px;
      background: #f1f5f9;
      font-size: 13px;
      text-transform: uppercase;
      color: #475569;
    }
    td {
      padding: 14px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .total-box {
      margin-left: auto;
      width: 320px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .highlight-row {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #b4975a;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .seal {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }
    .print-btn {
      display: block;
      margin: 20px auto 0;
      padding: 12px 28px;
      background: #1e293b;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    @media print {
      body { padding: 0; background: white; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">${sysSettings?.companyName || 'SAAD FURNITURE'}</h1>
        <div class="brand-sub">Luxury Handcrafted Interior Works & Bespoke Showroom</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          ${sysSettings?.showroomAddress || 'Saad Grand Showroom, Luxury Design District'}<br>
          Tel: ${sysSettings?.supportPhone || '+1 (800) 555-SAAD'} | Email: ${sysSettings?.supportEmail || 'concierge@saadfurniture.com'}
        </div>
      </div>
      <div class="receipt-badge">
        <div class="receipt-no">RECEIPT #${payment.paymentNumber}</div>
        <div class="receipt-date">Date: ${new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div style="margin-top: 6px; display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 20px; font-size: 12px; font-weight: 600;">PAID & VERIFIED</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="box-title">Client Details</div>
        <div class="box-val">
          ${customer?.name || order?.customerName || 'Private Patron'}<br>
          ${customer?.email || order?.customerEmail || ''}<br>
          ${customer?.phone || order?.customerPhone || ''}<br>
          ${order?.deliveryAddress || customer?.address || ''}
        </div>
      </div>
      <div>
        <div class="box-title">Order Information</div>
        <div class="box-val">
          Order Number: <strong>${order?.orderNumber || 'Bespoke Commission'}</strong><br>
          Payment Method: ${payment.paymentMethod}<br>
          Payment Type: ${payment.paymentType}<br>
          Reference: ${payment.transactionReference || 'N/A'}<br>
          Received By: ${payment.receivedBy}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th>Reference</th>
          <th style="text-align: right;">Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Bespoke Commission Payment</strong><br>
            <span style="font-size: 12px; color: #64748b;">${payment.notes || 'Handcrafted furniture manufacturing installment.'}</span>
          </td>
          <td>${payment.paymentType}</td>
          <td>${payment.transactionReference || 'Standard Settlement'}</td>
          <td style="text-align: right; font-weight: 700; font-size: 16px;">$${payment.amount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div class="row">
        <span>Order Total:</span>
        <span>$${(order?.totalAmount || 0).toLocaleString()}</span>
      </div>
      <div class="row">
        <span>Total Payments to Date:</span>
        <span style="color: #15803d; font-weight: 600;">$${(order?.paidAmount || 0).toLocaleString()}</span>
      </div>
      <div class="row">
        <span>Outstanding Balance:</span>
        <span style="color: ${(order?.remainingBalance || 0) > 0 ? '#b91c1c' : '#15803d'}; font-weight: 600;">
          $${(order?.remainingBalance || 0).toLocaleString()}
        </span>
      </div>
      <div class="highlight-row">
        <span>This Payment:</span>
        <span style="color: #b4975a;">$${payment.amount.toLocaleString()}</span>
      </div>
    </div>

    <div class="seal">
      <div>
        This is an official computer-generated receipt from Saad Furniture.<br>
        Thank you for entrusting your luxury living spaces to our master artisans.
      </div>
      <div style="text-align: right; font-weight: 700; color: #b4975a; letter-spacing: 1px;">
        ★ SAAD CERTIFIED EXCELLENCE ★
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

