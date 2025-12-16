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

const normalizeSupervisorName = (name: string): string => {
    if (!name) return '';
    // Extract Base Name and Type (SS/NS) from "Name SS12"
    // This merges "Jitendra SS8" & "Jitendra SS9" -> "Jitendra SS"
    // But keeps "Sanjay SS" and "Sanjay NS" distinct
    const match = name.match(/^(.*?)\s+(SS|NS)\d+/i);
    if (match) {
        return `${match[1].trim()} ${match[2].toUpperCase()}`;
    }
    // Fallback: remove simple suffixes matching the pattern if simpler regex needed, 
    // or just return trimmed name if it doesn't match standard format.
    // For safety, if it doesn't match the strict SS/NS pattern, check loose pattern
    return name.replace(/\s+(?:SS|NS)\d+.*$/i, '').trim();
};

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

                    // NORMALIZE: Fix "54-Pratam Nagar" typo in Ward
                    if (record['Ward'] && record['Ward'].includes('54-Pratam Nagar')) {
                        record['Ward'] = record['Ward'].replace('54-Pratam Nagar', '54-Pratap Nagar');
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
                        // Normalize supervisor name to aggregate same person across wards
                        record.assignedSupervisor = normalizeSupervisorName(officer.supervisor);
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
            // It should already be normalized in parseCSV, but we use the value in the record.
            const supName = row.assignedSupervisor;
            stats.supervisors[supName] = (stats.supervisors[supName] || 0) + 1;
        }
    });

    return stats;
};
