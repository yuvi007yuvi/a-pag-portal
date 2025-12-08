import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { parseCSV, calculateStats } from '../utils/dataProcessor';
import { useData } from '../context/DataContext';

export const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const { setData, setFilteredData, setStats, setLoading, setMinDate, setMaxDate, setDateFrom, setDateTo } = useData();

    const handleFileSelect = async (file: File) => {
        try {
            setLoading(true);
            const records = await parseCSV(file);
            setData(records);

            // Find min and max dates
            const dates = records
                .map(r => r['Complaint Registered Date'])
                .filter(d => d)
                .map(d => new Date(d))
                .filter(d => !isNaN(d.getTime()));

            if (dates.length > 0) {
                const minD = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxD = new Date(Math.max(...dates.map(d => d.getTime())));
                const minDateStr = minD.toISOString().split('T')[0];
                const maxDateStr = maxD.toISOString().split('T')[0];

                setMinDate(minDateStr);
                setMaxDate(maxDateStr);
                setDateFrom(minDateStr);
                setDateTo(maxDateStr);
            }

            setFilteredData(records);
            const calculatedStats = calculateStats(records);
            setStats(calculatedStats);

            // Redirect to dashboard after successful upload
            navigate('/dashboard');
        } catch (error) {
            console.error("Error parsing CSV:", error);
            alert("Error parsing CSV file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-20 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Analyze Complaint Data</h2>
            <p className="text-slate-500 mb-8">Upload your CSV file to generate detailed reports and insights.</p>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <FileUpload onFileSelect={handleFileSelect} label="Complaint-Data.csv" />
            </div>
        </div>
    );
};
