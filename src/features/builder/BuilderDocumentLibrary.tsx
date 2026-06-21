/** @format */

import { Copy, FilePlus2, Library, RefreshCcw } from 'lucide-react';
import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { IconButton } from '../../components/IconButton';
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
            <div className="builder-document-library-actions">
                <IconButton icon={<FilePlus2 aria-hidden="true" size={18} />} onClick={onCreateNew}>
                    New from default
                </IconButton>
                <IconButton
                    icon={<Copy aria-hidden="true" size={18} />}
                    onClick={onDuplicateCurrent}
                    variant="secondary"
                >
                    Duplicate current
                </IconButton>
                <IconButton
                    icon={<RefreshCcw aria-hidden="true" size={18} />}
                    onClick={() => {
                        void onLoadDocument(currentFormatId);
                    }}
                    variant="secondary"
                >
                    Edit current
                </IconButton>
            </div>
        </div>
        <div className="builder-document-library-current" aria-live="polite">
            <strong>{currentFormatName}</strong>
            <span>Current document</span>
        </div>
        <div className="builder-document-library-grid">
            {inventory.length > 0 ? (
                inventory.map((item) => (
                    <ActionButton
                        className={
                            item.formatId === currentFormatId
                                ? 'builder-document-library-item is-active'
                                : 'builder-document-library-item'
                        }
                        key={item.formatId}
                        onClick={() => {
                            void onLoadDocument(item.formatId);
                        }}
                    >
                        <span className="builder-document-library-item-name">
                            {item.formatName}
                        </span>
                        <span className="builder-document-library-item-meta">
                            {describeInventoryItem(item)}
                        </span>
                        <small>Document selected</small>
                    </ActionButton>
                ))
            ) : (
                <div className="helper-card builder-document-library-empty">
                    No saved document formats yet. Publish the current draft to add it here.
                </div>
            )}
        </div>
    </section>
);
