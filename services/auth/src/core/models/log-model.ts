export interface LogModel {
    id: string;
    service_type: string;
    code: number;
    message: string;
    stacktrace: any;
    created_at: string;
}