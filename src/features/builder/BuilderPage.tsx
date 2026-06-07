/* eslint-disable max-lines */
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  FileCode2,
  FileJson2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChangeEvent, FC } from 'react';

import { AppDrawer } from '../../components/AppDrawer/AppDrawer';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import {
  DocumentFormatConfigSchema,
  FieldTypeSchema,
  type DocumentFormatConfig,
} from '../../db/startup/ConfigSchemas';

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
type AssetSummary = { readonly name: string; readonly type: string; readonly size: number };

const cloneDefault = (): DocumentFormatConfig =>
  DocumentFormatConfigSchema.parse(JSON.parse(JSON.stringify(builtInDefaultFormat)) as unknown);

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
  const [stepIndex, setStepIndex] = useState(0);
  const [config, setConfig] = useState<DocumentFormatConfig>(readConfig);
  const [templateHtml, setTemplateHtml] = useState(
    () => window.localStorage.getItem(htmlStorageKey) ?? '',
  );
  const [assets, setAssets] = useState<readonly AssetSummary[]>([]);
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
    if (!templateHtml.trim()) errors.push('Upload one HTML print template.');
    return errors;
  }, [config, lineSection?.Fields, templateHtml]);

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
            (key) => `Unknown package property "${key}" was preserved in the source file.`,
          ),
        );
        setMessage(`Imported ${file.name}. Review every step before publishing.`);
      } catch (reason) {
        setMessage(reason instanceof Error ? reason.message : 'The JSON package is invalid.');
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
    void file.text().then((html) => {
      if (/<\s*(script|iframe|object|embed|form)\b/iu.test(html) || /\son\w+\s*=/iu.test(html)) {
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
    const allowed = /^(image\/(?:png|jpeg|webp|svg\+xml)|font\/woff2?|application\/font-woff)$/u;
    const accepted = files.filter(
      (file) => allowed.test(file.type) || /\.(woff2?|svg)$/iu.test(file.name),
    );
    setAssets((current) => [
      ...current.filter((asset) => !accepted.some((file) => file.name === asset.name)),
      ...accepted.map((file) => ({
        name: file.name.replace(/\.[^.]+$/u, ''),
        type: file.type,
        size: file.size,
      })),
    ]);
    if (accepted.length !== files.length) setMessage('Some unsupported assets were skipped.');
    event.currentTarget.value = '';
  };

  return (
    <div className="page-stack builder-page">
      <div className="operational-header">
        <div>
          <p className="eyebrow">Builder</p>
          <h1>Document format builder</h1>
          <p>Build fields and calculations first. Preview the finished document at the end.</p>
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
              <span>Format name</span>
              <input
                value={config.FormatName}
                onChange={(event) => {
                  setConfig({ ...config, FormatName: event.currentTarget.value });
                }}
              />
            </label>
            <label>
              <span>Format ID</span>
              <input
                value={config.FormatId}
                onChange={(event) => {
                  setConfig({ ...config, FormatId: event.currentTarget.value.replace(/\W/gu, '') });
                }}
              />
            </label>
          </div>
        ) : null}
        {activeStep === 'Fields' ? (
          <FieldEditor
            fields={config.Fields}
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
                      LineItemSections: [{ ...lineSection, Label: event.currentTarget.value }],
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
                        { ...lineSection, MaxRows: Number(event.currentTarget.value) },
                      ],
                    });
                  }}
                />
              </label>
            </div>
            <FieldEditor
              fields={lineSection.Fields}
              onAdd={() => {
                const fields = [...lineSection.Fields, newField(lineSection.Fields.length)];
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
                                  (candidate) => candidate.FieldId === field.FieldId,
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
                Use same-row fields such as <code>Quantity * Rate</code>. Document totals may use{' '}
                <code>SUM(Items.Amount)</code> or <code>COUNT(Items)</code>.
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
              <small>Unsafe scripts, frames, forms, and remote URLs are removed.</small>
              <label className="button-file">
                <Upload aria-hidden="true" size={18} />{' '}
                {templateHtml ? 'Replace HTML' : 'Upload HTML'}
                <input accept=".html,text/html" onChange={importHtml} type="file" />
              </label>
              {templateHtml ? (
                <small>{templateHtml.length.toLocaleString()} characters loaded</small>
              ) : null}
            </article>
            <article className="upload-card">
              <FileJson2 aria-hidden="true" />
              <h3>Shared assets</h3>
              <p>
                Images and fonts are referenced with <code>{'{{Asset.Name}}'}</code>.
              </p>
              <label className="button-file">
                <Plus aria-hidden="true" size={18} /> Add assets
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
                    aria-label={`Remove ${asset.name}`}
                    onClick={() => {
                      setAssets((current) =>
                        current.filter((candidate) => candidate.name !== asset.name),
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
            <div>
              <p className="eyebrow">Configuration</p>
              <h3>{config.FormatName}</h3>
              <dl>
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
            </div>
            <iframe
              sandbox=""
              srcDoc={
                templateHtml ||
                '<main style="font-family:sans-serif;padding:2rem"><h1>Upload an HTML template</h1><p>Your final document preview will appear here.</p></main>'
              }
              title="Print template preview"
            />
            {validation.length > 0 ? (
              <div className="feedback-warning span-2">
                <strong>Resolve before publishing</strong>
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
          <p className="feedback-warning" key={warning}>
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
                window.localStorage.setItem(storageKey, JSON.stringify(config));
                window.localStorage.setItem(htmlStorageKey, templateHtml);
                setMessage('Format and print template published.');
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
                editing.kind === 'document' ? config.Fields : (lineSection?.Fields ?? []);
              updateFields(
                editing.kind,
                fields.map((candidate, index) => (index === editing.index ? field : candidate)),
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
  readonly onAdd: () => void;
  readonly onChange: (fields: readonly FieldConfig[]) => void;
  readonly onEdit: (index: number) => void;
}> = ({ fields, onAdd, onChange, onEdit }) => (
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
          <strong>{field.Label}</strong>
          <code>{field.FieldId}</code>
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
              { ...field, FieldId: `${field.FieldId}Copy`, Label: `${field.Label} Copy` },
              ...fields.slice(index + 1),
            ]);
          }}
          type="button"
        >
          <Copy aria-hidden="true" size={17} />
        </button>
        <button
          aria-label={`Delete ${field.Label}`}
          onClick={() => {
            onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
          }}
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
    Format: 'Choose the short name operators see when creating a record.',
    Fields: 'Add the business fields shown above the line-item table.',
    'Line Items': 'Design repeatable product or service rows.',
    Calculations: 'Connect numeric fields with formulas and totals.',
    Print: 'Upload one HTML file and the images or fonts it references.',
    'Preview & Save': 'Validate the combined format and print output before publishing.',
  })[step];

const formatBytes = (size: number): string =>
  size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
