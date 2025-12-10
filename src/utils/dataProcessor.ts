import Papa from 'papaparse';
import { findOfficer, ALLOWED_COMPLAINT_TYPES, ALLOWED_COMPLAINANT_NAMES } from '../data/officerMappings';

export interface ComplaintRecord {
    'Sr No': string;
    'compId': string;
    'Name': string;
    'Phone Number': string;
    'Zone': string;
    'Ward': string;
    'Status': string;
    'Complainttype': string;
    'complaintsubtype': string; // Key column for filtering and logic
    'Complaint Registered Date': string;
    // Officer assignment (populated after parsing)
    assignedOfficer?: string;
    assignedSupervisor?: string;
    [key: string]: string | undefined;
}

export interface Stats {
    total: number;
    open: number;
    closed: number;
    zones: Record<string, number>;
    statusDistribution: Record<string, number>;
    officers: Record<string, number>;
    supervisors: Record<string, number>;
}

export const parseCSV = (file: File): Promise<ComplaintRecord[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Assign officers to complaints
                let records = results.data as ComplaintRecord[];

                records.forEach(record => {
                    // NORMALIZE: Fix variations of "Muds -Silt sticking Road Side"
                    if (record['complaintsubtype'] && record['complaintsubtype'].includes('Muds')) {
                        record['complaintsubtype'] = 'Muds -Silt sticking Road Side';
                    }
                });

                // FILTER: Only keep allowed complaint types AND allowed complainants
                records = records.filter(record => {
                    const type = record['complaintsubtype'] || '';
                    const name = record['Name'] || '';

                    const isAllowedType = ALLOWED_COMPLAINT_TYPES.some(allowed => type.includes(allowed));

                    // Check if name matches any allowed complainant name (trimming whitespace)
                    const isAllowedComplainant = ALLOWED_COMPLAINANT_NAMES.some(allowed =>
                        name.trim().toLowerCase() === allowed.toLowerCase()
                    );

                    // Both conditions must be true
                    return isAllowedType && isAllowedComplainant;
                });

                records.forEach(record => {
                    const officer = findOfficer(
                        record['Zone'] || '',
                        record['Ward'] || '',
                        record['complaintsubtype'] || ''
                    );
                    if (officer) {
                        record.assignedOfficer = officer.officer;
                        record.assignedSupervisor = officer.supervisor;
                    }
                });
                resolve(records);
            },
            error: (error: any) => {
                reject(error);
            },
        });
    });
};

export const calculateStats = (data: ComplaintRecord[]): Stats => {
    const stats: Stats = {
        total: 0,
        open: 0,
        closed: 0,
        zones: {},
        statusDistribution: {},
        officers: {},
        supervisors: {},
    };

    data.forEach((row) => {
        // Basic validation
        if (!row['Zone']) return;

        stats.total++;

        // Zone stats
        const zone = row['Zone'] || 'Unknown';
        stats.zones[zone] = (stats.zones[zone] || 0) + 1;

        // Status stats
        const rawStatus = row['Status'] || 'Unknown';
        // Normalize status (Title Case)
        const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

        stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;

        if (status === 'Open' || status === 'Re-open') {
            stats.open++;
        } else if (status === 'Close') {
            stats.closed++;
        }

        // Officer stats
        if (row.assignedOfficer) {
            stats.officers[row.assignedOfficer] = (stats.officers[row.assignedOfficer] || 0) + 1;
        }

        // Supervisor stats
        if (row.assignedSupervisor) {
            stats.supervisors[row.assignedSupervisor] = (stats.supervisors[row.assignedSupervisor] || 0) + 1;
        }
    });

    return stats;
};
