/** @format */

import type { FC } from 'react';

import { Copy, FilePlus2, Library, PencilLine, Trash2 } from 'lucide-react';

import { IconButton } from '../../components/IconButton';
import type { BuilderInventoryItem } from './BuilderDocumentLibrarySupport';
import { describeInventoryItem } from './BuilderDocumentLibrarySupport';

type BuilderDocumentLibraryProps = {
    readonly currentFormatId: string;
    readonly currentFormatName: string;
    readonly inventory: readonly BuilderInventoryItem[];
    readonly onCreateNew: () => void;
    readonly onDeleteDocument: (item: BuilderInventoryItem) => Promise<void> | void;
    readonly onDuplicateDocument: (formatId: string) => Promise<void> | void;
    readonly onLoadDocument: (formatId: string) => Promise<void> | void;
};

/** Shows the Builder document inventory with contextual actions per saved format. */
export const BuilderDocumentLibrary: FC<BuilderDocumentLibraryProps> = ({
    currentFormatId,
    currentFormatName,
    inventory,
    onCreateNew,
    onDeleteDocument,
    onDuplicateDocument,
    onLoadDocument,
}) => {
    const currentDocumentSaved = inventory.some((item) => item.formatId === currentFormatId);

    return (
        <section
            className="builder-document-library"
            aria-labelledby="builder-document-library-title"
        >
            <div className="section-heading">
                <div>
                    <p className="eyebrow">
                        <Library aria-hidden="true" size={14} /> Documents
                    </p>
                    <h2 id="builder-document-library-title">Document library</h2>
                    <p>
                        Review saved formats and manage each one with clear edit, duplicate, and
                        delete actions.
                    </p>
                </div>
                <div className="builder-document-library-actions">
                    <IconButton
                        icon={<FilePlus2 aria-hidden="true" size={18} />}
                        onClick={onCreateNew}
                    >
                        New document
                    </IconButton>
                </div>
            </div>

            {!currentDocumentSaved ? (
                <div className="builder-document-library-current" aria-live="polite">
                    <strong>{currentFormatName}</strong>
                    <span>Current draft is not published yet.</span>
                </div>
            ) : null}

            <div className="builder-document-library-list" role="list" aria-label="Saved documents">
                {inventory.length > 0 ? (
                    inventory.map((item) => {
                        const isCurrent = item.formatId === currentFormatId;

                        return (
                            <article
                                className={`builder-document-library-row${isCurrent ? ' is-current' : ''}`}
                                key={item.formatId}
                                role="listitem"
                            >
                                <div className="builder-document-library-row-copy">
                                    <div className="builder-document-library-row-title">
                                        <strong>{item.formatName}</strong>
                                        {isCurrent ? (
                                            <span className="builder-document-library-badge">
                                                Current
                                            </span>
                                        ) : null}
                                        {item.isDefault ? (
                                            <span className="builder-document-library-badge builder-document-library-badge--default">
                                                Default
                                            </span>
                                        ) : null}
                                    </div>
                                    <span className="builder-document-library-item-meta">
                                        {describeInventoryItem(item)}
                                    </span>
                                </div>
                                <div className="builder-document-library-row-actions">
                                    <IconButton
                                        icon={<PencilLine aria-hidden="true" size={18} />}
                                        onClick={() => {
                                            void onLoadDocument(item.formatId);
                                        }}
                                        variant={isCurrent ? 'primary' : 'secondary'}
                                    >
                                        Edit
                                    </IconButton>
                                    <IconButton
                                        icon={<Copy aria-hidden="true" size={18} />}
                                        onClick={() => {
                                            void onDuplicateDocument(item.formatId);
                                        }}
                                        variant="secondary"
                                    >
                                        Duplicate
                                    </IconButton>
                                    <IconButton
                                        disabled={item.isDefault}
                                        icon={<Trash2 aria-hidden="true" size={18} />}
                                        onClick={() => {
                                            void onDeleteDocument(item);
                                        }}
                                        variant="secondary"
                                    >
                                        Delete
                                    </IconButton>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <div className="helper-card builder-document-library-empty">
                        No saved document formats yet. Publish the current draft to add it here.
                    </div>
                )}
            </div>
        </section>
    );
};
