/** @format */

import { Download, FileCode2, FileJson2, Plus, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, FC } from 'react';

import { FileSelectButton } from '../../components/FileSelectButton';
import { IconButton } from '../../components/IconButton';
import { IconOnlyButton } from '../../components/IconOnlyButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { AssetSummary, SavedPrintTemplate } from './BuilderPageSupport';
import { formatBytes } from './BuilderPageSupport';

type BuilderPrintStepProps = {
    readonly templateHtml: string;
    readonly assets: readonly AssetSummary[];
    readonly savedTemplates: readonly SavedPrintTemplate[];
    readonly activeTemplateName: string | undefined;
    readonly onSelectTemplate: (templateName: string) => void;
    readonly onRemoveTemplate: (templateName: string) => void;
    readonly onImportHtml: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
    readonly onImportAssets: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
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
                <div className="upload-card-header">
                    <span className="upload-card-icon" aria-hidden="true">
                        <FileCode2 size={18} />
                    </span>
                    <div className="upload-card-copy">
                        <h3>Shared print HTML</h3>
                        <p>Select a reusable HTML template or add a new one for this format.</p>
                    </div>
                </div>
                <SearchableDropdown
                    label="Shared print HTML"
                    onChange={onSelectTemplate}
                    options={savedTemplates.map((template) => ({
                        value: template.name,
                        label: template.name,
                        description: `Updated ${new Date(template.updatedAt).toLocaleDateString()}`,
                    }))}
                    value={selectedTemplateName}
                />
                <small>
                    Upload or choose a reusable template. Built-in default stays available.
                </small>
                <FileSelectButton
                    accept=".html,text/html"
                    className="button-file--wide"
                    onChange={(event) => {
                        void onImportHtml(event);
                    }}
                >
                    <Upload aria-hidden="true" size={18} />
                    <span>{templateHtml ? 'Add or replace HTML' : 'Upload HTML'}</span>
                </FileSelectButton>
                {templateHtml ? (
                    <IconButton
                        className="button-file button-file--wide"
                        icon={<Download aria-hidden="true" size={18} />}
                        onClick={() => {
                            const blob = new Blob([templateHtml], {
                                type: 'text/html;charset=utf-8',
                            });
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement('a');
                            anchor.href = url;
                            anchor.download = 'print-template.html';
                            anchor.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        Download HTML
                    </IconButton>
                ) : null}
                {selectedTemplateName && !isBuiltInTemplate(selectedTemplateName) ? (
                    <IconButton
                        className="button-file button-file--wide"
                        icon={<Trash2 aria-hidden="true" size={18} />}
                        onClick={() => {
                            onRemoveTemplate(selectedTemplateName);
                        }}
                    >
                        Remove HTML
                    </IconButton>
                ) : null}
                {templateHtml ? (
                    <small>{templateHtml.length.toLocaleString()} characters loaded</small>
                ) : null}
            </article>
            <article className="upload-card">
                <div className="upload-card-header">
                    <span className="upload-card-icon" aria-hidden="true">
                        <FileJson2 size={18} />
                    </span>
                    <div className="upload-card-copy">
                        <h3>Shared assets</h3>
                        <p>
                            Images and fonts are referenced with <code>{'{{Asset.Name}}'}</code>.
                            Existing assets remain visible here.
                        </p>
                    </div>
                </div>
                <FileSelectButton
                    accept=".png,.jpg,.jpeg,.webp,.svg,.woff,.woff2"
                    className="button-file--wide"
                    multiple
                    onChange={(event) => {
                        void onImportAssets(event);
                    }}
                >
                    <Plus aria-hidden="true" size={18} />
                    <span>Add or replace assets</span>
                </FileSelectButton>
            </article>
            <div className="asset-list span-2">
                {assets.map((asset) => (
                    <article key={asset.name}>
                        <code>{`{{Asset.${asset.name}}}`}</code>
                        <span>{formatBytes(asset.size)}</span>
                        <IconOnlyButton
                            aria-label={`Download ${asset.name}`}
                            icon={<Download aria-hidden="true" size={17} />}
                            onClick={() => {
                                const anchor = document.createElement('a');
                                anchor.href = `data:${asset.type};base64,${asset.dataBase64}`;
                                anchor.download = asset.name;
                                anchor.click();
                            }}
                        />
                        <IconOnlyButton
                            aria-label={`Remove ${asset.name}`}
                            icon={<Trash2 aria-hidden="true" size={17} />}
                            onClick={() => {
                                onRemoveAsset(asset.name);
                            }}
                        />
                    </article>
                ))}
            </div>
        </div>
    );
};
