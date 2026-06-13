/** @format */

import type { FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AssetSummary } from './BuilderPageSupport';
import { renderBuilderPreview } from './BuilderPagePreviewSupport';

type BuilderPrintPreviewStepProps = {
    readonly config: DocumentFormatConfig;
    readonly assets: readonly AssetSummary[];
    readonly templateHtml: string;
    readonly validation: readonly string[];
};

/** Shows the final rendered HTML output before the builder publishes the format. */
export const BuilderPrintPreviewStep: FC<BuilderPrintPreviewStepProps> = ({
    config,
    assets,
    templateHtml,
    validation,
}) => (
    <>
        <section className="builder-preview-card" aria-labelledby="builder-print-preview-title">
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
    </>
);
