import { describe, expect, it } from 'vitest';

import { sanitizeTemplateHtml } from './TemplateHtmlSanitizer';

describe('TemplateHtmlSanitizer', () => {
  it('allows HTML, CSS, tables, page breaks, and asset placeholders', () => {
    const html = `
      <style>
        .page { page-break-after: always; }
        .logo { background-image: url('{{Asset.CompanyLogo}}'); }
      </style>
      <table><tbody><tr><td>{{Record.CustomerName}}</td></tr></tbody></table>
    `;

    expect(sanitizeTemplateHtml(html)).toBe(html);
  });

  it('rejects runtime script surfaces and inline event handlers', () => {
    expect(() => sanitizeTemplateHtml('<script>alert(1)</script>')).toThrow(
      'blocked HTML tags',
    );
    expect(() => sanitizeTemplateHtml('<div onclick="print()">x</div>')).toThrow(
      'inline event handlers',
    );
    expect(() => sanitizeTemplateHtml('<iframe src="/x"></iframe>')).toThrow(
      'blocked HTML tags',
    );
  });

  it('rejects external assets and CSS resource loading', () => {
    expect(() =>
      sanitizeTemplateHtml('<img src="https://example.test/logo.png" />'),
    ).toThrow('external assets');
    expect(() =>
      sanitizeTemplateHtml('<style>@import url("https://example.test/x.css")</style>'),
    ).toThrow('external resources');
  });
});
