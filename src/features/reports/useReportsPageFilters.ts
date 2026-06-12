/** @format */

import { useMemo, useState } from 'react';

import { useRecordStore } from '../records/RecordStoreContext';
import { pageSize } from './ReportsPageSupport';

export const useReportsPageFilters = () => {
    const { records } = useRecordStore();
    const [reportId, setReportId] = useState('sales-register');
    const [customer, setCustomer] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [status, setStatus] = useState('All');
    const [preset, setPreset] = useState('All');
    const [visibleCount, setVisibleCount] = useState(pageSize);

    const browserMatchingRecords = useMemo(() => {
        const normalizedCustomer = customer.trim().toLocaleLowerCase();
        const normalizedInvoice = invoiceNumber.trim().toLocaleLowerCase();
        let result = records
            .filter((record) => record.status !== 'Draft' || status === 'Draft')
            .filter((record) => status === 'All' || record.status === status)
            .filter(
                (record) =>
                    !normalizedCustomer ||
                    record.customerName.toLocaleLowerCase().includes(normalizedCustomer),
            )
            .filter(
                (record) =>
                    !normalizedInvoice ||
                    record.documentNumber?.toLocaleLowerCase().includes(normalizedInvoice),
            )
            .filter((record) => !fromDate || record.invoiceDate >= fromDate)
            .filter((record) => !toDate || record.invoiceDate <= toDate)
            .sort(
                (left, right) =>
                    right.updatedAt.localeCompare(left.updatedAt) ||
                    left.recordId.localeCompare(right.recordId),
            );
        if (preset === 'Last100') result = result.slice(0, 100);
        return result;
    }, [customer, fromDate, invoiceNumber, preset, records, status, toDate]);

    const query = useMemo(
        () => ({
            reportId,
            customer,
            invoiceNumber,
            fromDate,
            toDate,
            status,
            preset,
            limit: pageSize,
        }),
        [customer, fromDate, invoiceNumber, preset, reportId, status, toDate],
    );

    const customers = [
        ...new Set(records.map((record) => record.customerName).filter(Boolean)),
    ].sort();

    const reset = () => {
        setCustomer('');
        setInvoiceNumber('');
        setFromDate('');
        setToDate('');
        setStatus('All');
        setPreset('All');
    };

    const applyPreset = (value: string) => {
        setPreset(value);
        if (value === 'Last100' || value === 'All') {
            setFromDate('');
            setToDate('');
            return;
        }
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        if (value === 'Today') {
            setFromDate(today);
            setToDate(today);
        }
        if (value === 'ThisMonth') {
            setFromDate(`${today.slice(0, 7)}-01`);
            setToDate(today);
        }
        if (value === 'FinancialYear') {
            const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
            setFromDate(`${String(year)}-04-01`);
            setToDate(today);
        }
    };

    return {
        applyPreset,
        browserMatchingRecords,
        customer,
        customers,
        fromDate,
        invoiceNumber,
        query,
        reportId,
        reset,
        toDate,
        setCustomer,
        setFromDate,
        setInvoiceNumber,
        setPreset,
        setReportId,
        setStatus,
        setToDate,
        status,
        preset,
        visibleCount,
        setVisibleCount,
    } as const;
};
