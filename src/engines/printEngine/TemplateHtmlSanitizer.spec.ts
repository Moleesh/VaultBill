/** @format */

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
        expect(() => sanitizeTemplateHtml('<img src="https://example.test/logo.png" />')).toThrow(
            'external assets',
        );
        expect(() =>
            sanitizeTemplateHtml('<style>@import url("https://example.test/x.css")</style>'),
        ).toThrow('external resources');
        expect(() =>
            sanitizeTemplateHtml('<style>.logo { background: url("./logo.png") }</style>'),
        ).toThrow('unapproved URL');
        expect(() =>
            sanitizeTemplateHtml(
                '<style>.logo { background: url("file:///tmp/logo.png") }</style>',
            ),
        ).toThrow('unapproved URL');
    });

    it('allows generated image data URLs in CSS', () => {
        const html = '<style>.logo { background: url("data:image/png;base64,AAAA") }</style>';
        expect(sanitizeTemplateHtml(html)).toBe(html);
    });
});
