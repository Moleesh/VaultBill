/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardMetric } from '../DashboardMetric';

describe('dashboard metric', () => {
    it('renders the label and value together', () => {
        render(<DashboardMetric label="Revenue" value="₹12,000" />);

        expect(screen.getByText('Revenue')).toBeVisible();
        expect(screen.getByText('₹12,000')).toBeVisible();
    });
});
