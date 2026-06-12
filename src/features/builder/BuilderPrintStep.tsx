/** @format */

import { Download, FileCode2, FileJson2, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, FC } from 'react';

import type { AssetSummary } from './BuilderPageSupport';
import { formatBytes } from './BuilderPageSupport';

type BuilderPrintStepProps = {
    readonly templateHtml: string;
    readonly assets: readonly AssetSummary[];
    readonly onImportHtml: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onImportAssets: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onRenameAsset: (asset: AssetSummary) => void;
    readonly onRemoveAsset: (assetName: string) => void;
};

/** Renders the print-template and shared-asset upload step. */
export const BuilderPrintStep: FC<BuilderPrintStepProps> = ({
    templateHtml,
    assets,
    onImportHtml,
    onImportAssets,
    onRenameAsset,
    onRemoveAsset,
}) => (
    <div className="print-upload-grid">
        <article className="upload-card">
            <FileCode2 aria-hidden="true" />
            <h3>HTML template</h3>
            <p>Upload one self-contained HTML file with embedded CSS.</p>
            <small>Unsafe scripts, frames, forms, and remote URLs are removed.</small>
            <label className="button-file">
                <Upload aria-hidden="true" size={18} />{' '}
                {templateHtml ? 'Replace HTML' : 'Upload HTML'}
                <input accept=".html,text/html" onChange={onImportHtml} type="file" />
            </label>
            {templateHtml ? (
                <small>{templateHtml.length.toLocaleString()} characters loaded</small>
            ) : null}
        </article>
        <article className="upload-card">
            <FileJson2 aria-hidden="true" />
            <h3>Shared assets</h3>
            <p>
                Images and fonts are referenced with <code>{'{{Asset.Name}}'}</code>. Existing
                assets remain visible here.
            </p>
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
                        aria-label={`Rename ${asset.name}`}
                        onClick={() => {
                            onRenameAsset(asset);
                        }}
                        type="button"
                    >
                        <Pencil aria-hidden="true" size={17} />
                    </button>
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
