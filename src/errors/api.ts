class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        this.name = "ClassevivaApiError";
    }
}

export default ApiError;