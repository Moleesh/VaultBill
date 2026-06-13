/** @format */

import { Download, FileCode2, FileJson2, Plus, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, FC } from 'react';

import type { AssetSummary } from './BuilderPageSupport';
import { formatBytes } from './BuilderPageSupport';

type BuilderPrintStepProps = {
    readonly templateHtml: string;
    readonly assets: readonly AssetSummary[];
    readonly onImportHtml: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onImportAssets: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onRemoveAsset: (assetName: string) => void;
};

/** Renders the print-template and shared-asset upload step. */
export const BuilderPrintStep: FC<BuilderPrintStepProps> = ({
    templateHtml,
    assets,
    onImportHtml,
    onImportAssets,
    onRemoveAsset,
}) => (
    <div className="print-upload-grid">
        <article className="upload-card">
            <div className="upload-card__header">
                <span className="upload-card__icon" aria-hidden="true">
                    <FileCode2 size={18} />
                </span>
                <div className="upload-card__copy">
                    <h3>HTML template</h3>
                    <p>Upload one self-contained HTML file with embedded CSS.</p>
                </div>
            </div>
            <small>Unsafe scripts, frames, forms, and remote URLs are removed.</small>
            <label className="button-file">
                <Upload aria-hidden="true" size={18} />
                {templateHtml ? 'Replace HTML' : 'Upload HTML'}
                <input accept=".html,text/html" onChange={onImportHtml} type="file" />
            </label>
            {templateHtml ? (
                <button
                    onClick={() => {
                        const blob = new Blob([templateHtml], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = 'print-template.html';
                        anchor.click();
                        URL.revokeObjectURL(url);
                    }}
                    type="button"
                >
                    <Download aria-hidden="true" size={18} /> Download HTML
                </button>
            ) : null}
            {templateHtml ? (
                <small>{templateHtml.length.toLocaleString()} characters loaded</small>
            ) : null}
        </article>
        <article className="upload-card">
            <div className="upload-card__header">
                <span className="upload-card__icon" aria-hidden="true">
                    <FileJson2 size={18} />
                </span>
                <div className="upload-card__copy">
                    <h3>Shared assets</h3>
                    <p>
                        Images and fonts are referenced with <code>{'{{Asset.Name}}'}</code>.
                        Existing assets remain visible here.
                    </p>
                </div>
            </div>
            <label className="button-file">
                <Plus aria-hidden="true" size={18} /> Add or replace assets
                <input
                    accept=".png,.jpg,.jpeg,.webp,.svg,.woff,.woff2"
                    multiple
                    onChange={onImportAssets}
                    type="file"
                />
            </label>
        </article>
        <div className="asset-list span-2">
            {assets.map((asset) => (
                <article key={asset.name}>
                    <code>{`{{Asset.${asset.name}}}`}</code>
                    <span>{formatBytes(asset.size)}</span>
                    <button
                        aria-label={`Download ${asset.name}`}
                        onClick={() => {
                            const anchor = document.createElement('a');
                            anchor.href = `data:${asset.type};base64,${asset.dataBase64}`;
                            anchor.download = asset.name;
                            anchor.click();
                        }}
                        type="button"
                    >
                        <Download aria-hidden="true" size={17} />
                    </button>
                    <button
                        aria-label={`Remove ${asset.name}`}
                        onClick={() => {
                            onRemoveAsset(asset.name);
                        }}
                        type="button"
                    >
                        <Trash2 aria-hidden="true" size={17} />
                    </button>
                </article>
            ))}
        </div>
    </div>
);
