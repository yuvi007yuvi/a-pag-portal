import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ComplaintRecord, Stats } from '../utils/dataProcessor';

interface DataContextType {
    data: ComplaintRecord[];
    filteredData: ComplaintRecord[];
    stats: Stats | null;
    loading: boolean;
    dateFrom: string;
    dateTo: string;
    minDate: string;
    maxDate: string;
    setData: (data: ComplaintRecord[]) => void;
    setFilteredData: (data: ComplaintRecord[]) => void;
    setStats: (stats: Stats | null) => void;
    setLoading: (loading: boolean) => void;
    setDateFrom: (date: string) => void;
    setDateTo: (date: string) => void;
    setMinDate: (date: string) => void;
    setMaxDate: (date: string) => void;
    applyDateFilter: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<ComplaintRecord[]>([]);
    const [filteredData, setFilteredData] = useState<ComplaintRecord[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [minDate, setMinDate] = useState<string>('');
    const [maxDate, setMaxDate] = useState<string>('');

    const applyDateFilter = () => {
        if (!dateFrom || !dateTo) {
            setFilteredData(data);
            return;
        }

        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);

        const filtered = data.filter(record => {
            const complaintDate = new Date(record['Complaint Registered Date']);
            return complaintDate >= fromDate && complaintDate <= toDate;
        });

        setFilteredData(filtered);
    };

    return (
        <DataContext.Provider
            value={{
                data,
                filteredData,
                stats,
                loading,
                dateFrom,
                dateTo,
                minDate,
                maxDate,
                setData,
                setFilteredData,
                setStats,
                setLoading,
                setDateFrom,
                setDateTo,
                setMinDate,
                setMaxDate,
                applyDateFilter,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};
