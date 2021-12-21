export interface JSONResponse<T> {
    data?: T,
    errors?: Array<{message: string}>,
}