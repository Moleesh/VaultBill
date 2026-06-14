/** @format */

import { Download, FileCode2, FileJson2, Plus, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, FC } from 'react';

import type { AssetSummary, SavedPrintTemplate } from './BuilderPageSupport';
import { formatBytes } from './BuilderPageSupport';

type BuilderPrintStepProps = {
    readonly templateHtml: string;
    readonly assets: readonly AssetSummary[];
    readonly savedTemplates: readonly SavedPrintTemplate[];
    readonly activeTemplateName: string | undefined;
    readonly onSelectTemplate: (templateName: string) => void;
    readonly onRemoveTemplate: (templateName: string) => void;
    readonly onImportHtml: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onImportAssets: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onRemoveAsset: (assetName: string) => void;
};

const isBuiltInTemplate = (templateName: string): boolean =>
    templateName.toLocaleLowerCase().includes('built-in default');

/** Renders the print-template and shared-asset upload step. */
export const BuilderPrintStep: FC<BuilderPrintStepProps> = ({
    templateHtml,
    assets,
    savedTemplates,
    activeTemplateName,
    onSelectTemplate,
    onRemoveTemplate,
    onImportHtml,
    onImportAssets,
    onRemoveAsset,
}) => {
    const selectedTemplateName = activeTemplateName ?? savedTemplates[0]?.name ?? '';

    return (
        <div className="print-upload-grid">
            <article className="upload-card">
                <div className="upload-card__header">
                    <span className="upload-card__icon" aria-hidden="true">
                        <FileCode2 size={18} />
                    </span>
                    <div className="upload-card__copy">
                        <h3>Shared print HTML</h3>
                        <p>Select a reusable HTML template or add a new one for this format.</p>
                    </div>
                </div>
                <label>
                    <span>Shared print HTML</span>
                    <select
                        aria-label="Shared print HTML"
                        onChange={(event) => {
                            onSelectTemplate(event.currentTarget.value);
                        }}
                        value={selectedTemplateName}
                    >
                        {savedTemplates.map((template) => (
                            <option key={template.name} value={template.name}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </label>
                <small>Upload or choose a reusable template. Built-in default stays available.</small>
                <label className="button-file">
                    <Upload aria-hidden="true" size={18} />
                    {templateHtml ? 'Add or replace HTML' : 'Upload HTML'}
                    <input accept=".html,text/html" onChange={onImportHtml} type="file" />
                </label>
                {templateHtml ? (
                    <button
                        className="button-file"
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
                {selectedTemplateName && !isBuiltInTemplate(selectedTemplateName) ? (
                    <button
                        className="button-file"
                        onClick={() => {
                            onRemoveTemplate(selectedTemplateName);
                        }}
                        type="button"
                    >
                        <Trash2 aria-hidden="true" size={18} /> Remove HTML
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
};
