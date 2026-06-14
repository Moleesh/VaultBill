/** @format */

import { Copy, FilePlus2, Library, RefreshCcw } from 'lucide-react';
import type { FC } from 'react';

import type { BuilderInventoryItem } from './BuilderDocumentLibrarySupport';
import { describeInventoryItem } from './BuilderDocumentLibrarySupport';

type BuilderDocumentLibraryProps = {
    readonly currentFormatId: string;
    readonly currentFormatName: string;
    readonly inventory: readonly BuilderInventoryItem[];
    readonly onCreateNew: () => void;
    readonly onDuplicateCurrent: () => void;
    readonly onLoadDocument: (formatId: string) => Promise<void> | void;
};

/** Shows the SysAdmin document library and quick actions for working with multiple formats. */
export const BuilderDocumentLibrary: FC<BuilderDocumentLibraryProps> = ({
    currentFormatId,
    currentFormatName,
    inventory,
    onCreateNew,
    onDuplicateCurrent,
    onLoadDocument,
}) => (
    <section className="builder-document-library" aria-labelledby="builder-document-library-title">
        <div className="section-heading">
            <div>
                <p className="eyebrow">
                    <Library aria-hidden="true" size={14} /> Documents
                </p>
                <h2 id="builder-document-library-title">Document library</h2>
                <p>
                    Switch between saved formats, create a fresh one, or duplicate the current
                    layout when you want a close variant.
                </p>
            </div>
            <div className="builder-document-library__actions">
                <button onClick={onCreateNew} type="button">
                    <FilePlus2 aria-hidden="true" size={18} /> New from default
                </button>
                <button className="button-secondary" onClick={onDuplicateCurrent} type="button">
                    <Copy aria-hidden="true" size={18} /> Duplicate current
                </button>
                <button
                    className="button-secondary"
                    onClick={() => {
                        void onLoadDocument(currentFormatId);
                    }}
                    type="button"
                >
                    <RefreshCcw aria-hidden="true" size={18} /> Reload current
                </button>
            </div>
        </div>
        <div className="builder-document-library__current" aria-live="polite">
            <strong>{currentFormatName}</strong>
            <span>Current document</span>
        </div>
        <div className="builder-document-library__grid">
            {inventory.length > 0 ? (
                inventory.map((item) => (
                    <button
                        className={
                            item.formatId === currentFormatId
                                ? 'builder-document-library__item is-active'
                                : 'builder-document-library__item'
                        }
                        key={item.formatId}
                        onClick={() => {
                            void onLoadDocument(item.formatId);
                        }}
                        type="button"
                    >
                        <span className="builder-document-library__item-name">
                            {item.formatName}
                        </span>
                        <span className="builder-document-library__item-meta">
                            {describeInventoryItem(item)}
                        </span>
                        <small>Document selected</small>
                    </button>
                ))
            ) : (
                <div className="helper-card builder-document-library__empty">
                    No saved document formats yet. Publish the current draft to add it here.
                </div>
            )}
        </div>
    </section>
);
