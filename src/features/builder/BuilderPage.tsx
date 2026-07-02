/** @format */

import type { FC } from 'react';

import { BuilderPageWorkspace } from './BuilderPageWorkspace';

import { useBuilderPageController } from './useBuilderPageController';

/** Renders the document-format builder route. */
export const BuilderPage: FC = () => {
    const controller = useBuilderPageController();
    return <BuilderPageWorkspace controller={controller} />;
};
