class DocsError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "DocsGenerationError";
    }
}

export default DocsError;