import { analyticsService } from '@/services/analytics.service';
import { SystemAnalytics, ShelterAnalytics, UserAnalytics } from '@/services/analytics.service';
import { toast } from 'react-toastify';

export interface ExportOptions {
    format: 'json' | 'csv' | 'pdf' | 'excel';
    filename?: string;
    includeCharts?: boolean;
    includeMetadata?: boolean;
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    filters?: any;
}

export interface ExportData {
    analytics: SystemAnalytics | ShelterAnalytics | UserAnalytics;
    metadata: {
        exportDate: string;
        period: string;
        type: 'system' | 'shelter' | 'user';
        entityId?: string;
        filters?: any;
    };
    charts?: {
        type: string;
        data: any;
        title: string;
    }[];
}

class AnalyticsExportService {
    /**
     * Export analytics data in various formats
     */
    async exportAnalytics(
        data: SystemAnalytics | ShelterAnalytics | UserAnalytics,
        options: ExportOptions
    ): Promise<void> {
        try {
            const exportData = this.prepareExportData(data, options);

            switch (options.format) {
                case 'json':
                    this.exportAsJSON(exportData, options.filename);
                    break;
                case 'csv':
                    this.exportAsCSV(exportData, options.filename);
                    break;
                case 'pdf':
                    await this.exportAsPDF(exportData, options);
                    break;
                case 'excel':
                    await this.exportAsExcel(exportData, options);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${options.format}`);
            }

            toast.success(`Analytics data exported as ${options.format.toUpperCase()}`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error(`Failed to export analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Export system analytics
     */
    async exportSystemAnalytics(options: ExportOptions): Promise<void> {
        try {
            const analytics = await analyticsService.getSystemAnalytics();
            await this.exportAnalytics(analytics, {
                ...options,
                filename: options.filename || `system-analytics-${this.getTimestamp()}`,
            });
        } catch (error) {
            console.error('System analytics export error:', error);
            throw error;
        }
    }

    /**
     * Export shelter analytics
     */
    async exportShelterAnalytics(shelterId: string, options: ExportOptions): Promise<void> {
        try {
            const analytics = await analyticsService.getShelterAnalytics(shelterId);
            await this.exportAnalytics(analytics, {
                ...options,
                filename: options.filename || `shelter-${shelterId}-analytics-${this.getTimestamp()}`,
            });
        } catch (error) {
            console.error('Shelter analytics export error:', error);
            throw error;
        }
    }

    /**
     * Export user analytics
     */
    async exportUserAnalytics(userId: string, options: ExportOptions): Promise<void> {
        try {
            const analytics = await analyticsService.getUserAnalytics(userId);
            await this.exportAnalytics(analytics, {
                ...options,
                filename: options.filename || `user-${userId}-analytics-${this.getTimestamp()}`,
            });
        } catch (error) {
            console.error('User analytics export error:', error);
            throw error;
        }
    }

    /**
     * Export comparative analytics
     */
    async exportComparativeAnalytics(
        currentPeriod: { period: '7d' | '30d' | '90d' | '1y' },
        previousPeriod: { period: '7d' | '30d' | '90d' | '1y' },
        type: 'system' | 'shelter' | 'user',
        entityId?: string,
        options: ExportOptions = { format: 'json' }
    ): Promise<void> {
        try {
            const comparativeData = await analyticsService.getComparativeAnalytics(
                currentPeriod,
                previousPeriod,
                type,
                entityId
            );

            const exportData: ExportData = {
                analytics: comparativeData.current,
                metadata: {
                    exportDate: new Date().toISOString(),
                    period: `${currentPeriod.period} vs ${previousPeriod.period}`,
                    type,
                    entityId,
                    filters: { currentPeriod, previousPeriod },
                },
            };

            switch (options.format) {
                case 'json':
                    this.exportAsJSON(exportData, options.filename || `comparative-analytics-${this.getTimestamp()}`);
                    break;
                case 'csv':
                    this.exportAsCSV(exportData, options.filename || `comparative-analytics-${this.getTimestamp()}`);
                    break;
                default:
                    throw new Error(`Unsupported format for comparative analytics: ${options.format}`);
            }

            toast.success('Comparative analytics exported successfully');
        } catch (error) {
            console.error('Comparative analytics export error:', error);
            throw error;
        }
    }

    /**
     * Prepare export data with metadata
     */
    private prepareExportData(
        data: SystemAnalytics | ShelterAnalytics | UserAnalytics,
        options: ExportOptions
    ): ExportData {
        const exportData: ExportData = {
            analytics: data,
            metadata: {
                exportDate: new Date().toISOString(),
                period: options.dateRange ?
                    `${options.dateRange.startDate} to ${options.dateRange.endDate}` :
                    'All time',
                type: this.determineAnalyticsType(data),
                filters: options.filters,
            },
        };

        if (options.includeMetadata) {
            exportData.metadata = {
                ...exportData.metadata,
                generatedBy: 'PawfectFriends Analytics',
                version: '1.0.0',
                exportOptions: options,
            };
        }

        return exportData;
    }

    /**
     * Determine analytics type from data structure
     */
    private determineAnalyticsType(data: any): 'system' | 'shelter' | 'user' {
        if (data.users && data.shelters && data.pets) {
            return 'system';
        } else if (data.overview && data.trends && data.demographics) {
            return 'shelter';
        } else if (data.profile && data.activity && data.preferences) {
            return 'user';
        }
        return 'system'; // Default fallback
    }

    /**
     * Export as JSON
     */
    private exportAsJSON(data: ExportData, filename?: string): void {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadBlob(blob, `${filename || 'analytics'}.json`);
    }

    /**
     * Export as CSV
     */
    private exportAsCSV(data: ExportData, filename?: string): void {
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(blob, `${filename || 'analytics'}.csv`);
    }

    /**
     * Export as PDF (placeholder - would require PDF generation library)
     */
    private async exportAsPDF(data: ExportData, options: ExportOptions): Promise<void> {
        // This would require a PDF generation library like jsPDF or Puppeteer
        // For now, we'll show a placeholder message
        toast.info('PDF export feature coming soon! Use JSON or CSV export for now.');

        // Placeholder implementation
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadBlob(blob, `${options.filename || 'analytics'}.json`);
    }

    /**
     * Export as Excel (placeholder - would require Excel generation library)
     */
    private async exportAsExcel(data: ExportData, options: ExportOptions): Promise<void> {
        // This would require an Excel generation library like xlsx or ExcelJS
        // For now, we'll show a placeholder message
        toast.info('Excel export feature coming soon! Use JSON or CSV export for now.');

        // Placeholder implementation
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadBlob(blob, `${options.filename || 'analytics'}.json`);
    }

    /**
     * Convert data to CSV format
     */
    private convertToCSV(data: ExportData): string {
        const rows: string[] = [];

        // Add metadata
        rows.push('Analytics Export Data');
        rows.push(`Export Date,${data.metadata.exportDate}`);
        rows.push(`Period,${data.metadata.period}`);
        rows.push(`Type,${data.metadata.type}`);
        rows.push(''); // Empty row

        // Add analytics data
        rows.push('Analytics Data');

        if (data.metadata.type === 'system') {
            const systemData = data.analytics as SystemAnalytics;
            rows.push('Metric,Value');
            rows.push(`Total Users,${systemData.users?.total || 0}`);
            rows.push(`Active Users,${systemData.users?.active || 0}`);
            rows.push(`Total Shelters,${systemData.shelters?.total || 0}`);
            rows.push(`Approved Shelters,${systemData.shelters?.approved || 0}`);
            rows.push(`Total Pets,${systemData.pets?.total || 0}`);
            rows.push(`Approved Pets,${systemData.pets?.approved || 0}`);
            rows.push(`Total Adoptions,${systemData.adoptions?.total || 0}`);
            rows.push(`Approved Adoptions,${systemData.adoptions?.approved || 0}`);
            rows.push(`Success Rate,${systemData.adoptions?.successRate || 0}%`);
        } else if (data.metadata.type === 'shelter') {
            const shelterData = data.analytics as ShelterAnalytics;
            rows.push('Metric,Value');
            rows.push(`Total Pets,${shelterData.overview?.totalPets || 0}`);
            rows.push(`Total Adoptions,${shelterData.overview?.totalAdoptions || 0}`);
            rows.push(`Success Rate,${shelterData.overview?.successRate || 0}%`);
            rows.push(`Avg Processing Time,${shelterData.overview?.avgProcessingTime || 0} days`);
            rows.push(`Total Reviews,${shelterData.overview?.totalReviews || 0}`);
            rows.push(`Average Rating,${shelterData.overview?.averageRating || 0}`);
        } else if (data.metadata.type === 'user') {
            const userData = data.analytics as UserAnalytics;
            rows.push('Metric,Value');
            rows.push(`Total Views,${userData.profile?.totalViews || 0}`);
            rows.push(`Total Favorites,${userData.profile?.totalFavorites || 0}`);
            rows.push(`Total Inquiries,${userData.profile?.totalInquiries || 0}`);
            rows.push(`Avg Response Time,${userData.profile?.avgResponseTime || 0} hours`);
            rows.push(`Total Logins,${userData.activity?.totalLogins || 0}`);
            rows.push(`Avg Session Duration,${userData.activity?.avgSessionDuration || 0} minutes`);
        }

        return rows.join('\n');
    }

    /**
     * Download blob as file
     */
    private downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get timestamp for filename
     */
    private getTimestamp(): string {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Generate export summary
     */
    generateExportSummary(data: ExportData): string {
        const summary = [];

        summary.push(`Analytics Export Summary`);
        summary.push(`=====================`);
        summary.push(`Export Date: ${new Date(data.metadata.exportDate).toLocaleString()}`);
        summary.push(`Period: ${data.metadata.period}`);
        summary.push(`Type: ${data.metadata.type}`);

        if (data.metadata.type === 'system') {
            const systemData = data.analytics as SystemAnalytics;
            summary.push(`Total Users: ${systemData.users?.total || 0}`);
            summary.push(`Total Shelters: ${systemData.shelters?.total || 0}`);
            summary.push(`Total Pets: ${systemData.pets?.total || 0}`);
            summary.push(`Total Adoptions: ${systemData.adoptions?.total || 0}`);
        } else if (data.metadata.type === 'shelter') {
            const shelterData = data.analytics as ShelterAnalytics;
            summary.push(`Total Pets: ${shelterData.overview?.totalPets || 0}`);
            summary.push(`Total Adoptions: ${shelterData.overview?.totalAdoptions || 0}`);
            summary.push(`Success Rate: ${shelterData.overview?.successRate || 0}%`);
        } else if (data.metadata.type === 'user') {
            const userData = data.analytics as UserAnalytics;
            summary.push(`Total Views: ${userData.profile?.totalViews || 0}`);
            summary.push(`Total Favorites: ${userData.profile?.totalFavorites || 0}`);
            summary.push(`Total Inquiries: ${userData.profile?.totalInquiries || 0}`);
        }

        return summary.join('\n');
    }
}

export const analyticsExportService = new AnalyticsExportService();
