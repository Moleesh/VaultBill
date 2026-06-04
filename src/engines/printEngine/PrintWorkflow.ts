import { buildRecordPrintValues } from './PrintValueMapper';
import { buildPrintOutputPlan } from './PrintOutputPlanner';
import { buildTestPrintValues } from './TestPrintValues';
import { compilePrintTemplate } from './TemplatePlaceholderCompiler';
import type { PrintCompileWarning } from './PrintTemplateTypes';
import type { PreparedPrintJob, PreparePrintJobInput } from './PrintWorkflowTypes';

export const preparePrintJob = (input: PreparePrintJobInput): PreparedPrintJob => {
  validateActionRecord(input);
  const warnings: PrintCompileWarning[] = [];
  const values =
    input.action === 'TestPrint'
      ? buildTestPrintValues(input.template.templateConfig)
      : buildRecordValues(input, warnings);
  const compiled = compilePrintTemplate({
    templateHtml: input.template.templateHtml,
    values,
    assets: input.assets,
  });
  const outputPlan = buildPrintOutputPlan(
    input.outputTarget,
    input.platform,
    input.requestedCopies,
    warnings,
    input.printerName,
  );

  return {
    action: input.action,
    html: compiled.html,
    outputPlan,
    warnings: [...warnings, ...compiled.warnings],
  };
};

const validateActionRecord = (input: PreparePrintJobInput) => {
  if (input.action === 'TestPrint') {
    return;
  }

  if (!input.record) {
    throw new Error(`${input.action} requires record data.`);
  }

  if (input.action === 'FinalPrint' && input.record.Status !== 'Finalized') {
    throw new Error('Final Print requires a finalized record.');
  }

  if (
    input.action === 'Reprint' &&
    input.record.Status !== 'Finalized' &&
    input.record.Status !== 'Cancelled'
  ) {
    throw new Error('Reprint requires a finalized or cancelled record.');
  }
};

const buildRecordValues = (
  input: PreparePrintJobInput,
  warnings: PrintCompileWarning[],
): Readonly<Record<string, unknown>> => {
  if (!input.record) {
    throw new Error(`${input.action} requires record data.`);
  }

  const mapped = buildRecordPrintValues(
    input.companyProfile
      ? {
          record: input.record,
          templateConfig: input.template.templateConfig,
          companyProfile: input.companyProfile,
        }
      : {
          record: input.record,
          templateConfig: input.template.templateConfig,
        },
  );
  warnings.push(...mapped.warnings);

  return mapped.values;
};
