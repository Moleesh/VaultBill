/** @format */

export const builtInDefaultPrintTemplateHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VaultBill Sample Print Template</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, Arial, sans-serif;
      }
      body {
        margin: 0;
        padding: 32px;
        background: #f5fbf9;
        color: #18302c;
      }
      .page {
        max-width: 820px;
        margin: 0 auto;
        padding: 32px;
        background: #fff;
        border: 1px solid #d3e4df;
        border-radius: 24px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 28px;
      }
      .brand img {
        width: 72px;
        height: 72px;
      }
      h1,
      h2,
      p {
        margin: 0 0 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 24px;
      }
      th,
      td {
        padding: 12px 14px;
        border-bottom: 1px solid #d3e4df;
        text-align: left;
      }
      th {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #4f6864;
      }
      .summary {
        margin-top: 24px;
        display: grid;
        gap: 12px;
        justify-content: end;
      }
      .summary div {
        display: flex;
        justify-content: space-between;
        min-width: 240px;
        gap: 32px;
        padding-top: 10px;
        border-top: 1px solid #d3e4df;
      }
      .summary div:last-child {
        font-size: 1.1rem;
        font-weight: 700;
      }
      .footer {
        margin-top: 28px;
        font-size: 12px;
        color: #66807b;
      }
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .page {
          border: 0;
          border-radius: 0;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="brand">
        <img src="{{Asset.CompanyLogo}}" alt="Company logo" />
        <div>
          <h1>{{Company.Name}}</h1>
          <p>{{Company.Address}}</p>
        </div>
      </div>

      <h2>{{Record.FormatName}}</h2>
      <p><strong>Invoice date:</strong> {{Record.InvoiceDate}}</p>
      <p><strong>Customer:</strong> {{Record.CustomerName}}</p>
      <p><strong>GSTIN:</strong> {{Record.CustomerGstin}}</p>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{Items.0.ItemName}}</td>
            <td>{{Items.0.Quantity}}</td>
            <td>{{Items.0.Rate}}</td>
            <td>{{Items.0.Amount}}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <div><span>Subtotal</span><strong>{{Record.Subtotal}}</strong></div>
        <div><span>GST / tax</span><strong>{{Record.TaxTotal}}</strong></div>
        <div><span>Round off</span><strong>{{Record.RoundOff}}</strong></div>
        <div><span>Grand total</span><strong>{{Record.GrandTotal}}</strong></div>
      </div>

      <p class="footer">Sample print template for the first VaultBill builder installation.</p>
    </div>
  </body>
</html>`;

export const builtInDefaultPrintTemplateJson = {
    FormatId: 'TaxInvoice',
};

export const builtInDefaultPrintAsset = {
    name: 'CompanyLogo',
    type: 'image/svg+xml',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="VaultBill sample logo">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f7f75" />
      <stop offset="100%" stop-color="#dff4ef" />
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="80" height="80" rx="18" fill="url(#g)" stroke="#0f7f75" stroke-width="4" />
  <path d="M30 28h20l16 16v24H30z" fill="#fff" opacity=".9" />
  <path d="M50 28v16h16" fill="none" stroke="#0f7f75" stroke-width="4" stroke-linejoin="round" />
  <path d="M36 46l7 8 17-18" fill="none" stroke="#0f7f75" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
</svg>`,
};
