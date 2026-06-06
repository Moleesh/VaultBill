/* eslint-disable max-lines */
import { useState } from 'react';
import type { FC } from 'react';

import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import {
  DocumentFormatConfigSchema,
  type DocumentFormatConfig,
} from '../../db/startup/ConfigSchemas';

const steps = ['Format', 'Fields', 'Line Items', 'Calculations', 'Print', 'Test'] as const;
const currentStorageKey = 'vaultbill.builder.current';
const previousStorageKey = 'vaultbill.builder.previous';

type BuilderStep = (typeof steps)[number];

const cloneDefaultConfig = (): DocumentFormatConfig =>
  DocumentFormatConfigSchema.parse(JSON.parse(JSON.stringify(builtInDefaultFormat)) as unknown);

const readConfig = (): DocumentFormatConfig => {
  const stored = window.localStorage.getItem(currentStorageKey);
  if (!stored) return cloneDefaultConfig();

  try {
    return DocumentFormatConfigSchema.parse(JSON.parse(stored) as unknown);
  } catch {
    return cloneDefaultConfig();
  }
};

export const BuilderPage: FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [config, setConfig] = useState<DocumentFormatConfig>(readConfig);
  const [message, setMessage] = useState('No unsaved configuration changes.');
  const [validationError, setValidationError] = useState('');
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  const activeStep: BuilderStep = steps[stepIndex] ?? 'Format';
  const affectedReferences = [
    `${String(config.Fields.length)} document fields`,
    `${String(config.LineItemSections.length)} line-item section`,
    'GST Invoice print template',
    'Sales register report',
  ];

  const validate = (): boolean => {
    const result = DocumentFormatConfigSchema.safeParse(config);
    setValidationError(
      result.success ? '' : (result.error.issues[0]?.message ?? 'Invalid config.'),
    );
    setMessage(result.success ? 'Configuration is valid and ready to save.' : 'Validation failed.');
    return result.success;
  };

  const save = () => {
    if (!validate()) return;
    const current = window.localStorage.getItem(currentStorageKey);
    if (current) window.localStorage.setItem(previousStorageKey, current);
    window.localStorage.setItem(currentStorageKey, JSON.stringify(config));
    setMessage('Configuration saved. The previous version can be restored.');
    setIsSaveConfirmationOpen(false);
  };

  const restore = () => {
    const previous = window.localStorage.getItem(previousStorageKey);
    if (!previous) {
      setMessage('No previous configuration snapshot is available.');
      return;
    }
    const restored = DocumentFormatConfigSchema.safeParse(JSON.parse(previous) as unknown);
    if (!restored.success) {
      setValidationError('The previous snapshot is invalid and was not restored.');
      return;
    }
    setConfig(restored.data);
    setValidationError('');
    setMessage('Previous configuration restored. Save to make it current.');
  };

  return (
    <div className="page-stack builder-page">
      <div className="operational-header">
        <div>
          <p className="eyebrow">Builder</p>
          <h1>Document format builder</h1>
          <p>Shape a format in six guided steps, then validate and test it before saving.</p>
        </div>
        <button onClick={restore} type="button">
          Restore previous
        </button>
      </div>
      <HorizontalProgress className="page-tabs builder-steps" label="Builder steps">
        {steps.map((step, index) => (
          <button
            aria-current={index === stepIndex ? 'step' : undefined}
            aria-pressed={index === stepIndex}
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
      <section className="builder-workspace">
        <div className="builder-editor">
          <div>
            <p className="eyebrow">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <h2>{activeStep}</h2>
            <p className="field-note">
              {activeStep === 'Format' && 'Name the format operators will select in Records.'}
              {activeStep === 'Fields' && 'Review and edit the fields shown above line items.'}
              {activeStep === 'Line Items' && 'Set safe row limits for products and services.'}
              {activeStep === 'Calculations' && 'Choose money precision and rounding behavior.'}
              {activeStep === 'Print' && 'Set the print-template label used by this format.'}
              {activeStep === 'Test' && 'Validate the complete contract and inspect references.'}
            </p>
          </div>

          {activeStep === 'Format' ? (
            <div className="form-grid">
              <label>
                <span>Format name</span>
                <input
                  onChange={(event) => {
                    setConfig({ ...config, FormatName: event.currentTarget.value });
                  }}
                  value={config.FormatName}
                />
              </label>
              <label>
                <span>Format ID</span>
                <input readOnly value={config.FormatId} />
              </label>
              <label className="span-2">
                <span>Description</span>
                <textarea
                  onChange={(event) => {
                    setConfig({ ...config, Description: event.currentTarget.value });
                  }}
                  value={config.Description ?? ''}
                />
              </label>
            </div>
          ) : null}

          {activeStep === 'Fields' ? (
            <div className="builder-field-list">
              {config.Fields.map((field, index) => (
                <label key={field.FieldId}>
                  <span>{field.FieldId}</span>
                  <input
                    onChange={(event) => {
                      const fields = config.Fields.map((candidate, fieldIndex) =>
                        fieldIndex === index
                          ? { ...candidate, Label: event.currentTarget.value }
                          : candidate,
                      );
                      setConfig({ ...config, Fields: fields });
                    }}
                    value={field.Label}
                  />
                </label>
              ))}
            </div>
          ) : null}

          {activeStep === 'Line Items' ? (
            <div className="form-grid">
              <label>
                <span>Minimum rows</span>
                <input
                  min="0"
                  onChange={(event) => {
                    const section = config.LineItemSections[0];
                    if (!section) return;
                    setConfig({
                      ...config,
                      LineItemSections: [
                        { ...section, MinRows: Number(event.currentTarget.value) },
                      ],
                    });
                  }}
                  type="number"
                  value={config.LineItemSections[0]?.MinRows ?? 0}
                />
              </label>
              <label>
                <span>Maximum rows</span>
                <input
                  min="1"
                  onChange={(event) => {
                    const section = config.LineItemSections[0];
                    if (!section) return;
                    setConfig({
                      ...config,
                      LineItemSections: [
                        { ...section, MaxRows: Number(event.currentTarget.value) },
                      ],
                    });
                  }}
                  type="number"
                  value={config.LineItemSections[0]?.MaxRows ?? 1}
                />
              </label>
            </div>
          ) : null}

          {activeStep === 'Calculations' ? (
            <div className="form-grid">
              <label>
                <span>Currency</span>
                <input
                  onChange={(event) => {
                    setConfig({
                      ...config,
                      CalculationPolicy: {
                        ...config.CalculationPolicy,
                        Currency: event.currentTarget.value,
                      },
                    });
                  }}
                  value={config.CalculationPolicy.Currency}
                />
              </label>
              <label>
                <span>Money precision</span>
                <input
                  min="0"
                  onChange={(event) => {
                    setConfig({
                      ...config,
                      CalculationPolicy: {
                        ...config.CalculationPolicy,
                        MoneyPrecision: Number(event.currentTarget.value),
                      },
                    });
                  }}
                  type="number"
                  value={config.CalculationPolicy.MoneyPrecision}
                />
              </label>
            </div>
          ) : null}

          {activeStep === 'Print' ? (
            <div className="form-grid">
              <label>
                <span>Print template</span>
                <input
                  onChange={(event) => {
                    setConfig({ ...config, PrintTemplateName: event.currentTarget.value });
                  }}
                  value={
                    typeof config.PrintTemplateName === 'string'
                      ? config.PrintTemplateName
                      : 'GST Invoice Standard'
                  }
                />
              </label>
              <div className="feedback-info">
                Remote assets and scripts are blocked. Templates may use approved database assets.
              </div>
            </div>
          ) : null}

          {activeStep === 'Test' ? (
            <div className="builder-test">
              <button className="button-primary" onClick={validate} type="button">
                Validate configuration
              </button>
              <div>
                <h3>Affected references</h3>
                <ul>
                  {affectedReferences.map((reference) => (
                    <li key={reference}>{reference}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {validationError ? <p className="feedback-error">{validationError}</p> : null}
          <p className="feedback-info" role="status">
            {message}
          </p>
          <a href="/help#builder">Open Builder help</a>
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
                  if (validate())
                    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                }}
                type="button"
              >
                Next
              </button>
            ) : (
              <button
                className="button-primary"
                onClick={() => {
                  if (validate()) setIsSaveConfirmationOpen(true);
                }}
                type="button"
              >
                Review and save
              </button>
            )}
          </footer>
        </div>
        <aside className="builder-preview" aria-label="Configuration preview">
          <p className="eyebrow">Live preview</p>
          <h2>{config.FormatName || 'Untitled format'}</h2>
          <p>{config.Description}</p>
          <dl>
            <div>
              <dt>Fields</dt>
              <dd>{config.Fields.length}</dd>
            </div>
            <div>
              <dt>Line item columns</dt>
              <dd>{config.LineItemSections[0]?.Fields.length ?? 0}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>{config.CalculationPolicy.Currency}</dd>
            </div>
          </dl>
        </aside>
      </section>
      <AppConfirmDialog
        confirmLabel="Save configuration"
        description={`This updates ${affectedReferences.join(', ')}. VaultBill will snapshot the current configuration first.`}
        isOpen={isSaveConfirmationOpen}
        onCancel={() => {
          setIsSaveConfirmationOpen(false);
        }}
        onConfirm={save}
        title="Save validated format?"
      />
    </div>
  );
};
