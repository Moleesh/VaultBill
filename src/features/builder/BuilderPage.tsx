/**
 * eslint-disable max-lines
 *
 * @format
 */

/** Builder workspace for document names, fields, calculations, print templates, and preview. */

import {
    ArrowDown,
    ArrowUp,
    Copy,
    Download,
    FileCode2,
    FileJson2,
    Pencil,
    Plus,
    Trash2,
    Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ChangeEvent, FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { AppDrawer } from '../../components/AppDrawer/AppDrawer';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import {
    builtInDefaultPrintAsset,
    builtInDefaultPrintTemplateHtml,
} from '../../db/startup/BuiltInDefaultPrintTemplate';
import {
    DocumentFormatConfigSchema,
    FieldTypeSchema,
    type DocumentFormatConfig,
} from '../../db/startup/ConfigSchemas';
import { evaluateFormula } from '../../engines/formulaEngine/FormulaEngine';
import { requestHostedApi } from '../../runtime/HostedApi';

const steps = [
    'Format',
    'Fields',
    'Line Items',
    'Calculations',
    'Print',
    'Preview & Save',
] as const;
const storageKey = 'vaultbill.builder.v24';
const htmlStorageKey = 'vaultbill.builder.template-html';
type BuilderStep = (typeof steps)[number];
type FieldConfig = DocumentFormatConfig['Fields'][number];
type AssetSummary = {
    readonly name: string;
    readonly type: string;
    readonly size: number;
    readonly dataBase64: string;
};
type StoredBuilderPackage = {
    readonly config: unknown;
    readonly templateHtml: string;
    readonly assets: readonly {
        readonly name: string;
        readonly type: string;
        readonly dataBase64: string;
    }[];
};

const cloneDefault = (): DocumentFormatConfig =>
    DocumentFormatConfigSchema.parse(JSON.parse(JSON.stringify(builtInDefaultFormat)) as unknown);

const builtInSampleAsset: AssetSummary = {
    name: builtInDefaultPrintAsset.name,
    type: builtInDefaultPrintAsset.type,
    size: new TextEncoder().encode(builtInDefaultPrintAsset.svg).length,
    dataBase64: window.btoa(builtInDefaultPrintAsset.svg),
};

const readConfig = (): DocumentFormatConfig => {
    try {
        return DocumentFormatConfigSchema.parse(
            JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as unknown,
        );
    } catch {
        return cloneDefault();
    }
};

const newField = (index: number): FieldConfig => ({
    FieldId: `Field${String(index + 1)}`,
    Label: `New field ${String(index + 1)}`,
    Type: 'Text',
    Required: false,
    Visible: true,
});

export const BuilderPage: FC = () => {
    const capabilities = useCapabilities();
    const [searchParams] = useSearchParams();
    const requestedFormatId = searchParams.get('format') ?? undefined;
    const [stepIndex, setStepIndex] = useState(() =>
        searchParams.get('step') === 'preview' ? steps.length - 1 : 0,
    );
    const [config, setConfig] = useState<DocumentFormatConfig>(readConfig);
    const [templateHtml, setTemplateHtml] = useState(
        () => window.localStorage.getItem(htmlStorageKey) ?? builtInDefaultPrintTemplateHtml,
    );
    const [assets, setAssets] = useState<readonly AssetSummary[]>(() => [builtInSampleAsset]);
    const [editing, setEditing] = useState<{ kind: 'document' | 'line'; index: number }>();
    const [message, setMessage] = useState('');
    const [importWarnings, setImportWarnings] = useState<readonly string[]>([]);
    const activeStep: BuilderStep = steps[stepIndex] ?? 'Format';
    const lineSection = config.LineItemSections[0];
    const editingField =
        editing?.kind === 'document'
            ? config.Fields[editing.index]
            : editing?.kind === 'line'
              ? lineSection?.Fields[editing.index]
              : undefined;
    const allFields = useMemo(
        () => [...config.Fields, ...(lineSection?.Fields ?? [])],
        [config.Fields, lineSection?.Fields],
    );
    const referencedFieldIds = useMemo(() => collectReferencedFieldIds(allFields), [allFields]);

    useEffect(() => {
        const applyPackage = (stored: StoredBuilderPackage | undefined) => {
            if (!stored) return;
            setConfig(DocumentFormatConfigSchema.parse(stored.config));
            setTemplateHtml(stored.templateHtml);
            setAssets(
                stored.assets.map((asset) => ({
                    ...asset,
                    size: base64ByteLength(asset.dataBase64),
                })),
            );
        };
        if (window.vaultBillDesktop) {
            void window.vaultBillDesktop.loadBuilderPackage(requestedFormatId).then(applyPackage);
        } else if (capabilities.isLanBrowser) {
            const query = requestedFormatId
                ? `?formatId=${encodeURIComponent(requestedFormatId)}`
                : '';
            void requestHostedApi<StoredBuilderPackage | undefined>(`/builder/package${query}`)
                .then(applyPackage)
                .catch((reason: unknown) => {
                    setMessage(
                        reason instanceof Error
                            ? reason.message
                            : 'Builder data could not be loaded.',
                    );
                });
        }
    }, [capabilities.isLanBrowser, requestedFormatId]);

    const validation = useMemo(() => {
        const result = DocumentFormatConfigSchema.safeParse(config);
        const errors = result.success ? [] : result.error.issues.map((issue) => issue.message);
        const ids = [
            ...config.Fields.map((field) => field.FieldId),
            ...(lineSection?.Fields.map((field) => field.FieldId) ?? []),
        ];
        if (new Set(ids).size !== ids.length) errors.push('Every field ID must be unique.');
        for (const field of [...config.Fields, ...(lineSection?.Fields ?? [])]) {
            if (field.Calculated && !field.Formula?.trim()) {
                errors.push(`${field.Label} is calculated but has no formula.`);
            }
        }
        errors.push(...validateCalculationGraph(allFields));
        if (!templateHtml.trim()) errors.push('Upload one HTML print template.');
        return errors;
    }, [allFields, config, lineSection?.Fields, templateHtml]);

    const updateFields = (kind: 'document' | 'line', fields: readonly FieldConfig[]) => {
        if (kind === 'document') {
            setConfig({ ...config, Fields: [...fields] });
            return;
        }
        if (!lineSection) return;
        setConfig({
            ...config,
            LineItemSections: [{ ...lineSection, Fields: [...fields] }],
        });
    };

    const exportJson = () => {
        const payload = JSON.stringify({ PackageVersion: 1, Format: config }, null, 2);
        const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${config.FormatId || 'vaultbill-format'}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const importJson = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024 && !confirmLargeFile(file.name, file.size)) return;
        void file.text().then((text) => {
            try {
                const raw = JSON.parse(text) as { PackageVersion?: unknown; Format?: unknown };
                const imported = DocumentFormatConfigSchema.parse(raw.Format ?? raw);
                const warnings = Object.keys(raw).filter(
                    (key) => !['PackageVersion', 'Format'].includes(key),
                );
                setConfig(imported);
                setImportWarnings(
                    warnings.map(
                        (key) =>
                            `Unknown package property "${key}" was preserved in the source file.`,
                    ),
                );
                setMessage(`Imported ${file.name}. Review every step before publishing.`);
            } catch (reason) {
                setMessage(
                    reason instanceof Error ? reason.message : 'The JSON package is invalid.',
                );
            }
        });
        event.currentTarget.value = '';
    };

    const importHtml = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) return;
        if (!file.name.toLocaleLowerCase().endsWith('.html')) {
            setMessage('Print templates must be a single .html file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024 && !confirmLargeFile(file.name, file.size)) return;
        void file.text().then((html) => {
            if (
                /<\s*(script|iframe|object|embed|form)\b/iu.test(html) ||
                /\son\w+\s*=/iu.test(html)
            ) {
                setMessage('The HTML contains blocked active content.');
                return;
            }
            setTemplateHtml(html);
            setMessage(`${file.name} uploaded and ready for final preview.`);
        });
        event.currentTarget.value = '';
    };

    const importAssets = (event: ChangeEvent<HTMLInputElement>) => {
        const files = [...(event.currentTarget.files ?? [])];
        const unusuallyLarge = files.filter((file) => file.size > 20 * 1024 * 1024);
        if (
            unusuallyLarge.length > 0 &&
            !window.confirm(
                `${String(unusuallyLarge.length)} selected asset(s) are unusually large. Continue loading them into the template package?`,
            )
        ) {
            event.currentTarget.value = '';
            return;
        }
        const allowed =
            /^(image\/(?:png|jpeg|webp|svg\+xml)|font\/woff2?|application\/font-woff)$/u;
        const accepted = files.filter(
            (file) => allowed.test(file.type) || /\.(woff2?|svg)$/iu.test(file.name),
        );
        void Promise.all(
            accepted.map(async (file) => ({
                name: file.name.replace(/\.[^.]+$/u, ''),
                type: file.type || mimeTypeFromName(file.name),
                size: file.size,
                dataBase64: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
            })),
        ).then((nextAssets) => {
            setAssets((current) => [
                ...current.filter((asset) => !nextAssets.some((next) => next.name === asset.name)),
                ...nextAssets,
            ]);
        });
        if (accepted.length !== files.length) setMessage('Some unsupported assets were skipped.');
        event.currentTarget.value = '';
    };

    return (
        <div className="page-stack builder-page">
            <div className="operational-header">
                <div>
                    <p className="eyebrow">Builder</p>
                    <h1>Document format builder</h1>
                    <p>
                        Build fields and calculations first. Preview the finished document at the
                        end.
                    </p>
                </div>
                <div className="builder-header-actions">
                    <label className="button-file">
                        <Upload aria-hidden="true" size={18} /> Import JSON
                        <input accept=".json,application/json" onChange={importJson} type="file" />
                    </label>
                    <button onClick={exportJson} type="button">
                        <Download aria-hidden="true" size={18} /> Export JSON
                    </button>
                </div>
            </div>
            <HorizontalProgress className="page-tabs builder-steps" label="Builder steps">
                {steps.map((step, index) => (
                    <button
                        aria-pressed={stepIndex === index}
                        key={step}
                        onClick={() => {
                            setStepIndex(index);
                        }}
                        type="button"
                    >
                        <small>{index + 1}</small>
                        {step}
                    </button>
                ))}
            </HorizontalProgress>
            <section className="builder-workspace builder-workspace--single">
                <header className="builder-step-header">
                    <div>
                        <p className="eyebrow">
                            Step {stepIndex + 1} of {steps.length}
                        </p>
                        <h2>{activeStep}</h2>
                    </div>
                    <p>{helperFor(activeStep)}</p>
                </header>

                {activeStep === 'Format' ? (
                    <div className="form-grid">
                        <label>
                            <span>Document name</span>
                            <input
                                value={config.FormatName}
                                onChange={(event) => {
                                    setConfig({ ...config, FormatName: event.currentTarget.value });
                                }}
                            />
                        </label>
                        <div className="helper-card span-2">
                            This is the name operators see when they create a record.
                        </div>
                    </div>
                ) : null}
                {activeStep === 'Fields' ? (
                    <FieldEditor
                        fields={config.Fields}
                        referencedFieldIds={referencedFieldIds}
                        onAdd={() => {
                            const fields = [...config.Fields, newField(config.Fields.length)];
                            updateFields('document', fields);
                            setEditing({ kind: 'document', index: fields.length - 1 });
                        }}
                        onChange={(fields) => {
                            updateFields('document', fields);
                        }}
                        onEdit={(index) => {
                            setEditing({ kind: 'document', index });
                        }}
                    />
                ) : null}
                {activeStep === 'Line Items' && lineSection ? (
                    <>
                        <div className="form-grid">
                            <label>
                                <span>Section label</span>
                                <input
                                    value={lineSection.Label}
                                    onChange={(event) => {
                                        setConfig({
                                            ...config,
                                            LineItemSections: [
                                                {
                                                    ...lineSection,
                                                    Label: event.currentTarget.value,
                                                },
                                            ],
                                        });
                                    }}
                                />
                            </label>
                            <label>
                                <span>Maximum rows</span>
                                <input
                                    min="1"
                                    type="number"
                                    value={lineSection.MaxRows}
                                    onChange={(event) => {
                                        setConfig({
                                            ...config,
                                            LineItemSections: [
                                                {
                                                    ...lineSection,
                                                    MaxRows: Number(event.currentTarget.value),
                                                },
                                            ],
                                        });
                                    }}
                                />
                            </label>
                        </div>
                        <FieldEditor
                            fields={lineSection.Fields}
                            referencedFieldIds={referencedFieldIds}
                            onAdd={() => {
                                const fields = [
                                    ...lineSection.Fields,
                                    newField(lineSection.Fields.length),
                                ];
                                updateFields('line', fields);
                                setEditing({ kind: 'line', index: fields.length - 1 });
                            }}
                            onChange={(fields) => {
                                updateFields('line', fields);
                            }}
                            onEdit={(index) => {
                                setEditing({ kind: 'line', index });
                            }}
                        />
                    </>
                ) : null}
                {activeStep === 'Calculations' ? (
                    <div className="calculation-list">
                        {[...config.Fields, ...(lineSection?.Fields ?? [])]
                            .filter((field) => field.Calculated)
                            .map((field) => (
                                <article key={field.FieldId}>
                                    <div>
                                        <strong>{field.Label}</strong>
                                        <code>{field.FieldId}</code>
                                    </div>
                                    <code>{field.Formula}</code>
                                    <small>
                                        {sampleFormula(field, allFields, config.CalculationPolicy)}
                                    </small>
                                    <button
                                        onClick={() => {
                                            const documentIndex = config.Fields.findIndex(
                                                (candidate) => candidate.FieldId === field.FieldId,
                                            );
                                            setEditing(
                                                documentIndex >= 0
                                                    ? { kind: 'document', index: documentIndex }
                                                    : {
                                                          kind: 'line',
                                                          index:
                                                              lineSection?.Fields.findIndex(
                                                                  (candidate) =>
                                                                      candidate.FieldId ===
                                                                      field.FieldId,
                                                              ) ?? 0,
                                                      },
                                            );
                                        }}
                                        type="button"
                                    >
                                        Edit formula
                                    </button>
                                </article>
                            ))}
                        <div className="helper-card">
                            <strong>Formula helper</strong>
                            <p>
                                Use same-row fields such as <code>Quantity * Rate</code>. Keep GST,
                                subtotal, grand total, and round-off formulas separate so the
                                preview stays easy to follow.
                            </p>
                        </div>
                    </div>
                ) : null}
                {activeStep === 'Print' ? (
                    <div className="print-upload-grid">
                        <article className="upload-card">
                            <FileCode2 aria-hidden="true" />
                            <h3>HTML template</h3>
                            <p>Upload one self-contained HTML file with embedded CSS.</p>
                            <small>
                                Unsafe scripts, frames, forms, and remote URLs are removed.
                            </small>
                            <label className="button-file">
                                <Upload aria-hidden="true" size={18} />{' '}
                                {templateHtml ? 'Replace HTML' : 'Upload HTML'}
                                <input accept=".html,text/html" onChange={importHtml} type="file" />
                            </label>
                            {templateHtml ? (
                                <small>
                                    {templateHtml.length.toLocaleString()} characters loaded
                                </small>
                            ) : null}
                        </article>
                        <article className="upload-card">
                            <FileJson2 aria-hidden="true" />
                            <h3>Shared assets</h3>
                            <p>
                                Images and fonts are referenced with <code>{'{{Asset.Name}}'}</code>
                                . Existing assets remain visible here.
                            </p>
                            <label className="button-file">
                                <Plus aria-hidden="true" size={18} /> Add or replace assets
                                <input
                                    accept=".png,.jpg,.jpeg,.webp,.svg,.woff,.woff2"
                                    multiple
                                    onChange={importAssets}
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
                                            const nextName = window
                                                .prompt('Asset name', asset.name)
                                                ?.trim();
                                            if (!nextName || nextName === asset.name) return;
                                            setAssets((current) =>
                                                current.map((candidate) =>
                                                    candidate.name === asset.name
                                                        ? { ...candidate, name: nextName }
                                                        : candidate,
                                                ),
                                            );
                                        }}
                                        type="button"
                                    >
                                        <Pencil aria-hidden="true" size={17} />
                                    </button>
                                    <button
                                        aria-label={`Download ${asset.name}`}
                                        onClick={() => {
                                            downloadBase64Asset(asset);
                                        }}
                                        type="button"
                                    >
                                        <Download aria-hidden="true" size={17} />
                                    </button>
                                    <button
                                        aria-label={`Remove ${asset.name}`}
                                        onClick={() => {
                                            setAssets((current) =>
                                                current.filter(
                                                    (candidate) => candidate.name !== asset.name,
                                                ),
                                            );
                                        }}
                                        type="button"
                                    >
                                        <Trash2 aria-hidden="true" size={17} />
                                    </button>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                {activeStep === 'Preview & Save' ? (
                    <div className="builder-final-preview">
                        <section
                            className="builder-preview-card"
                            aria-labelledby="builder-field-preview-title"
                        >
                            <h3 id="builder-field-preview-title">Field preview</h3>
                            <p>{config.FormatName} entry form</p>
                            <dl className="builder-preview-summary">
                                <div>
                                    <dt>Document fields</dt>
                                    <dd>{config.Fields.length}</dd>
                                </div>
                                <div>
                                    <dt>Line-item fields</dt>
                                    <dd>{lineSection?.Fields.length ?? 0}</dd>
                                </div>
                                <div>
                                    <dt>Assets</dt>
                                    <dd>{assets.length}</dd>
                                </div>
                                <div>
                                    <dt>Currency</dt>
                                    <dd>{config.CalculationPolicy.Currency}</dd>
                                </div>
                            </dl>
                            <div
                                className="builder-preview-surface"
                                aria-label="Document field preview"
                            >
                                <div className="builder-preview-grid">
                                    {config.Fields.map((field) => (
                                        <label key={field.FieldId}>
                                            <span>{field.Label}</span>
                                            <input
                                                readOnly
                                                value={previewValue(
                                                    field.SampleValue ??
                                                        field.DefaultValue ??
                                                        field.Label,
                                                )}
                                            />
                                        </label>
                                    ))}
                                </div>
                                {lineSection ? (
                                    <div
                                        className="builder-preview-table"
                                        aria-label="Line item preview"
                                    >
                                        <div
                                            className="builder-preview-table__row builder-preview-table__row--header"
                                            style={{
                                                gridTemplateColumns: `repeat(${String(lineSection.Fields.length || 1)}, minmax(8rem, 1fr))`,
                                            }}
                                        >
                                            {lineSection.Fields.map((field) => (
                                                <span key={field.FieldId}>{field.Label}</span>
                                            ))}
                                        </div>
                                        <div
                                            className="builder-preview-table__row builder-preview-table__row--body"
                                            style={{
                                                gridTemplateColumns: `repeat(${String(lineSection.Fields.length || 1)}, minmax(8rem, 1fr))`,
                                            }}
                                        >
                                            {lineSection.Fields.map((field) => (
                                                <span key={field.FieldId}>
                                                    {previewValue(
                                                        field.SampleValue ??
                                                            field.DefaultValue ??
                                                            'Sample',
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                        <section
                            className="builder-preview-card"
                            aria-labelledby="builder-print-preview-title"
                        >
                            <h3 id="builder-print-preview-title">Print preview</h3>
                            <p>{config.FormatName} template</p>
                            <iframe
                                sandbox=""
                                srcDoc={renderBuilderPreview(templateHtml, config, assets)}
                                title="Print template preview"
                            />
                        </section>
                        {validation.length > 0 ? (
                            <div className="feedback-info span-2">
                                <strong>Check before publishing</strong>
                                <ul>
                                    {validation.map((error) => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {importWarnings.map((warning) => (
                    <p className="feedback-info" key={warning}>
                        {warning}
                    </p>
                ))}
                {message ? (
                    <p className="feedback-info" role="status">
                        {message}
                    </p>
                ) : null}
                <footer className="wizard-actions">
                    <button
                        disabled={stepIndex === 0}
                        onClick={() => {
                            setStepIndex((current) => Math.max(0, current - 1));
                        }}
                        type="button"
                    >
                        Back
                    </button>
                    {stepIndex < steps.length - 1 ? (
                        <button
                            className="button-primary"
                            onClick={() => {
                                setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                            }}
                            type="button"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            className="button-primary"
                            disabled={validation.length > 0}
                            onClick={() => {
                                const orderedConfig = applyCalculationOrder(config);
                                const builderPackage = {
                                    config: orderedConfig,
                                    templateHtml,
                                    assets,
                                };
                                const publish = window.vaultBillDesktop
                                    ? window.vaultBillDesktop.saveBuilderPackage(builderPackage)
                                    : capabilities.isLanBrowser
                                      ? requestHostedApi('/builder/package', 'POST', builderPackage)
                                      : Promise.resolve().then(() => {
                                            window.localStorage.setItem(
                                                storageKey,
                                                JSON.stringify(config),
                                            );
                                            window.localStorage.setItem(
                                                htmlStorageKey,
                                                templateHtml,
                                            );
                                        });
                                void publish
                                    .then(() => {
                                        setMessage('Format, print template, and assets published.');
                                    })
                                    .catch((reason: unknown) => {
                                        setMessage(
                                            reason instanceof Error
                                                ? reason.message
                                                : 'Publish failed.',
                                        );
                                    });
                            }}
                            type="button"
                        >
                            Publish format
                        </button>
                    )}
                </footer>
            </section>
            <AppDrawer
                isOpen={Boolean(editingField)}
                onClose={() => {
                    setEditing(undefined);
                }}
                title={editingField ? `Edit ${editingField.Label}` : 'Edit field'}
            >
                {editingField && editing ? (
                    <FieldDrawer
                        field={editingField}
                        onChange={(field) => {
                            const fields =
                                editing.kind === 'document'
                                    ? config.Fields
                                    : (lineSection?.Fields ?? []);
                            updateFields(
                                editing.kind,
                                fields.map((candidate, index) =>
                                    index === editing.index ? field : candidate,
                                ),
                            );
                        }}
                    />
                ) : null}
            </AppDrawer>
        </div>
    );
};

const FieldEditor: FC<{
    readonly fields: readonly FieldConfig[];
    readonly referencedFieldIds: ReadonlySet<string>;
    readonly onAdd: () => void;
    readonly onChange: (fields: readonly FieldConfig[]) => void;
    readonly onEdit: (index: number) => void;
}> = ({ fields, referencedFieldIds, onAdd, onChange, onEdit }) => (
    <div className="builder-fields">
        <div className="section-heading">
            <div>
                <h3>Configured fields</h3>
                <p>Order matches the entry form.</p>
            </div>
            <button className="button-primary" onClick={onAdd} type="button">
                <Plus aria-hidden="true" size={18} /> Add field
            </button>
        </div>
        {fields.map((field, index) => (
            <article key={`${field.FieldId}-${String(index)}`}>
                <button
                    className="builder-fields__main"
                    onClick={() => {
                        onEdit(index);
                    }}
                    type="button"
                >
                    <strong>{`Edit ${field.Label}`}</strong>
                    <span>{field.Type}</span>
                    {field.Calculated ? <small>Calculated</small> : null}
                </button>
                <button
                    aria-label={`Move ${field.Label} up`}
                    disabled={index === 0}
                    onClick={() => {
                        onChange(move(fields, index, index - 1));
                    }}
                    type="button"
                >
                    <ArrowUp aria-hidden="true" size={17} />
                </button>
                <button
                    aria-label={`Move ${field.Label} down`}
                    disabled={index === fields.length - 1}
                    onClick={() => {
                        onChange(move(fields, index, index + 1));
                    }}
                    type="button"
                >
                    <ArrowDown aria-hidden="true" size={17} />
                </button>
                <button
                    aria-label={`Duplicate ${field.Label}`}
                    onClick={() => {
                        onChange([
                            ...fields.slice(0, index + 1),
                            {
                                ...field,
                                FieldId: `${field.FieldId}Copy`,
                                Label: `${field.Label} Copy`,
                            },
                            ...fields.slice(index + 1),
                        ]);
                    }}
                    type="button"
                >
                    <Copy aria-hidden="true" size={17} />
                </button>
                <button
                    aria-label={`Delete ${field.Label}`}
                    disabled={referencedFieldIds.has(field.FieldId)}
                    onClick={() => {
                        onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
                    }}
                    title={
                        referencedFieldIds.has(field.FieldId)
                            ? 'Remove formula references before deleting this field.'
                            : undefined
                    }
                    type="button"
                >
                    <Trash2 aria-hidden="true" size={17} />
                </button>
            </article>
        ))}
    </div>
);

const FieldDrawer: FC<{
    readonly field: FieldConfig;
    readonly onChange: (field: FieldConfig) => void;
}> = ({ field, onChange }) => (
    <div className="form-grid">
        <label>
            <span>Field ID</span>
            <input
                value={field.FieldId}
                onChange={(event) => {
                    onChange({ ...field, FieldId: event.currentTarget.value.replace(/\W/gu, '') });
                }}
            />
        </label>
        <label>
            <span>Label</span>
            <input
                value={field.Label}
                onChange={(event) => {
                    onChange({ ...field, Label: event.currentTarget.value });
                }}
            />
        </label>
        <SearchableDropdown
            label="Type"
            value={field.Type}
            onChange={(value) => {
                onChange({ ...field, Type: FieldTypeSchema.parse(value) });
            }}
            options={FieldTypeSchema.options.map((type) => ({ value: type, label: type }))}
        />
        <label>
            <span>Placeholder</span>
            <input
                value={field.Placeholder ?? ''}
                onChange={(event) => {
                    onChange({ ...field, Placeholder: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Default value</span>
            <input
                value={typeof field.DefaultValue === 'string' ? field.DefaultValue : ''}
                onChange={(event) => {
                    onChange({ ...field, DefaultValue: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Prefix</span>
            <input
                value={field.Prefix ?? ''}
                onChange={(event) => {
                    onChange({ ...field, Prefix: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Suffix</span>
            <input
                value={field.Suffix ?? ''}
                onChange={(event) => {
                    onChange({ ...field, Suffix: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Maximum length</span>
            <input
                min="1"
                type="number"
                value={field.MaxLength ?? ''}
                onChange={(event) => {
                    onChange(
                        updateOptionalNumber(field, 'MaxLength', event.currentTarget.valueAsNumber),
                    );
                }}
            />
        </label>
        <label>
            <span>Decimal precision</span>
            <input
                min="0"
                type="number"
                value={field.Precision ?? ''}
                onChange={(event) => {
                    onChange(
                        updateOptionalNumber(field, 'Precision', event.currentTarget.valueAsNumber),
                    );
                }}
            />
        </label>
        <label className="checkbox-field">
            <input
                checked={Boolean(field.Required)}
                onChange={(event) => {
                    onChange({ ...field, Required: event.currentTarget.checked });
                }}
                type="checkbox"
            />
            <span>Required</span>
        </label>
        <label className="checkbox-field">
            <input
                checked={field.Visible !== false}
                onChange={(event) => {
                    onChange({ ...field, Visible: event.currentTarget.checked });
                }}
                type="checkbox"
            />
            <span>Visible</span>
        </label>
        <label className="checkbox-field">
            <input
                checked={Boolean(field.ReadOnly)}
                onChange={(event) => {
                    onChange({ ...field, ReadOnly: event.currentTarget.checked });
                }}
                type="checkbox"
            />
            <span>Read only</span>
        </label>
        <label className="checkbox-field">
            <input
                checked={Boolean(field.Calculated)}
                onChange={(event) => {
                    onChange({
                        ...field,
                        Calculated: event.currentTarget.checked,
                        ReadOnly: event.currentTarget.checked || field.ReadOnly,
                    });
                }}
                type="checkbox"
            />
            <span>Calculated</span>
        </label>
        {field.Calculated ? (
            <label className="span-2">
                <span>Formula</span>
                <input
                    value={field.Formula ?? ''}
                    onChange={(event) => {
                        onChange({ ...field, Formula: event.currentTarget.value });
                    }}
                />
                <small>Examples: Quantity * Rate or SUM(Items.Amount)</small>
            </label>
        ) : null}
    </div>
);

const move = <T,>(items: readonly T[], from: number, to: number): readonly T[] => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
};

const helperFor = (step: BuilderStep): string =>
    ({
        Format: 'Choose the document name operators see when creating a record.',
        Fields: 'Add the business fields shown above the line-item table.',
        'Line Items': 'Design repeatable product or service rows with totals.',
        Calculations: 'Connect numeric fields with formulas, GST, and round-off.',
        Print: 'Upload one HTML file and the images or fonts it references.',
        'Preview & Save': 'Check field and print previews before publishing.',
    })[step];

const formatBytes = (size: number): string =>
    size < 1024 * 1024
        ? `${(size / 1024).toFixed(1)} KB`
        : `${(size / (1024 * 1024)).toFixed(1)} MB`;

const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return window.btoa(binary);
};

const base64ByteLength = (base64: string): number =>
    Math.floor((base64.length * 3) / 4) -
    (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);

const mimeTypeFromName = (name: string): string =>
    name.toLocaleLowerCase().endsWith('.woff2')
        ? 'font/woff2'
        : name.toLocaleLowerCase().endsWith('.woff')
          ? 'font/woff'
          : name.toLocaleLowerCase().endsWith('.svg')
            ? 'image/svg+xml'
            : 'application/octet-stream';

const confirmLargeFile = (name: string, size: number): boolean =>
    window.confirm(
        `${name} is ${formatBytes(size)}, which is unusually large. Continue loading it into Builder?`,
    );

const formulaReferences = (formula: string): readonly string[] =>
    [...formula.matchAll(/[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?/gu)]
        .map((match) => match[0])
        .filter((token) => !['SUM', 'COUNT', 'ITEMS'].includes(token.toLocaleUpperCase()))
        .map((token) => (token.startsWith('Items.') ? token.slice('Items.'.length) : token));

const collectReferencedFieldIds = (fields: readonly FieldConfig[]): ReadonlySet<string> =>
    new Set(fields.flatMap((field) => (field.Formula ? formulaReferences(field.Formula) : [])));

const numericFieldTypes = new Set(['Number', 'Decimal', 'Money', 'Quantity', 'Rate']);

const validateCalculationGraph = (fields: readonly FieldConfig[]): readonly string[] => {
    const byId = new Map(fields.map((field) => [field.FieldId, field]));
    const issues: string[] = [];
    const calculated = fields.filter((field) => field.Calculated && field.Formula);
    for (const field of calculated) {
        const references = formulaReferences(field.Formula ?? '');
        for (const reference of references) {
            const target = byId.get(reference);
            if (!target) issues.push(`${field.Label} references unknown field ${reference}.`);
            else if (!numericFieldTypes.has(target.Type)) {
                issues.push(
                    `${field.Label} cannot calculate with non-numeric field ${target.Label}.`,
                );
            }
        }
        if (/\/\s*0(?:\.0+)?(?:\D|$)/u.test(field.Formula ?? '')) {
            issues.push(`${field.Label} divides by zero.`);
        }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (fieldId: string): boolean => {
        if (visiting.has(fieldId)) return true;
        if (visited.has(fieldId)) return false;
        visiting.add(fieldId);
        const field = byId.get(fieldId);
        const cycle = formulaReferences(field?.Formula ?? '').some((reference) => {
            const target = byId.get(reference);
            return Boolean(target?.Calculated) && visit(reference);
        });
        visiting.delete(fieldId);
        visited.add(fieldId);
        return cycle;
    };
    if (calculated.some((field) => visit(field.FieldId))) {
        issues.push('Calculated fields contain a dependency cycle.');
    }
    return [...new Set(issues)];
};

const sampleFormula = (
    field: FieldConfig,
    fields: readonly FieldConfig[],
    policy: DocumentFormatConfig['CalculationPolicy'],
): string => {
    const formula = field.Formula?.trim();
    if (!formula) return 'Add a formula to see a sample result.';
    if (/\b(?:SUM|COUNT)\s*\(/iu.test(formula)) {
        return 'Sample result uses line-item rows in the final preview.';
    }
    const variables = Object.fromEntries(
        fields.map((candidate) => [
            candidate.FieldId,
            typeof candidate.SampleValue === 'string' || typeof candidate.SampleValue === 'number'
                ? candidate.SampleValue
                : typeof candidate.DefaultValue === 'string' ||
                    typeof candidate.DefaultValue === 'number'
                  ? candidate.DefaultValue
                  : '1',
        ]),
    );
    try {
        const result = evaluateFormula(
            formula,
            variables,
            policy,
            field.Precision ?? policy.MoneyPrecision,
        );
        return `Sample: ${field.Prefix ?? ''}${result.formatted}${field.Suffix ?? ''}`;
    } catch (reason) {
        return reason instanceof Error
            ? `Check formula: ${reason.message}`
            : 'Check formula syntax.';
    }
};

const applyCalculationOrder = (config: DocumentFormatConfig): DocumentFormatConfig => {
    const fields = [
        ...config.Fields,
        ...config.LineItemSections.flatMap((section) => section.Fields),
    ];
    const calculatedIds = new Set(
        fields.filter((field) => field.Calculated && field.Formula).map((field) => field.FieldId),
    );
    const ordered: string[] = [];
    const visited = new Set<string>();
    const visit = (fieldId: string) => {
        if (visited.has(fieldId)) return;
        visited.add(fieldId);
        const field = fields.find((candidate) => candidate.FieldId === fieldId);
        for (const reference of formulaReferences(field?.Formula ?? '')) {
            if (calculatedIds.has(reference)) visit(reference);
        }
        ordered.push(fieldId);
    };
    for (const fieldId of calculatedIds) visit(fieldId);
    const orderById = new Map(ordered.map((fieldId, index) => [fieldId, index + 1]));
    const apply = (field: FieldConfig): FieldConfig => {
        const order = orderById.get(field.FieldId);
        return order ? { ...field, CalculationOrder: order } : field;
    };
    return {
        ...config,
        Fields: config.Fields.map(apply),
        LineItemSections: config.LineItemSections.map((section) => ({
            ...section,
            Fields: section.Fields.map(apply),
        })),
    };
};

const renderBuilderPreview = (
    templateHtml: string,
    config: DocumentFormatConfig,
    assets: readonly AssetSummary[],
): string => {
    if (!templateHtml) {
        return '<main style="font-family:sans-serif;padding:2rem"><h1>Upload an HTML template</h1><p>Your resolved final preview will appear here.</p></main>';
    }
    const values: Record<string, string> = {
        'Company.Name': 'Sample Business',
        'Company.Address': '12 Market Road, Bengaluru',
        'Record.Number': 'GST-000001',
        'Record.Status': 'Finalized',
        'Record.IsCancelled': 'false',
        'Record.CancellationReason': '',
    };
    for (const field of [
        ...config.Fields,
        ...config.LineItemSections.flatMap((item) => item.Fields),
    ]) {
        const sample = field.SampleValue ?? field.DefaultValue ?? field.Label;
        values[`Record.${field.FieldId}`] = previewValue(sample);
    }
    for (const asset of assets) {
        values[`Asset.${asset.name}`] = `data:${asset.type};base64,${asset.dataBase64}`;
    }
    return templateHtml.replace(/\{\{\s*([^}]+?)\s*\}\}/gu, (_match, key: string) =>
        escapePreviewHtml(values[key.trim()] ?? '—'),
    );
};

const escapePreviewHtml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

const downloadBase64Asset = (asset: AssetSummary) => {
    const anchor = document.createElement('a');
    anchor.href = `data:${asset.type};base64,${asset.dataBase64}`;
    anchor.download = `${asset.name}.${extensionForMimeType(asset.type)}`;
    anchor.click();
};

const extensionForMimeType = (mimeType: string): string =>
    (
        ({
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'font/woff': 'woff',
            'font/woff2': 'woff2',
        }) as Readonly<Record<string, string>>
    )[mimeType] ?? 'bin';

const updateOptionalNumber = (
    field: FieldConfig,
    key: 'MaxLength' | 'Precision',
    value: number,
): FieldConfig => {
    const next = { ...field };
    if (Number.isFinite(value)) next[key] = value;
    else
        return Object.fromEntries(
            Object.entries(next).filter(([property]) => property !== key),
        ) as FieldConfig;
    return next;
};

const previewValue = (value: unknown): string => {
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value);
    }
    if (value === null || value === undefined) return '';
    return JSON.stringify(value);
};
