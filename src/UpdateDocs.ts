import DocsUpdater from "./base/docs";

(async () => {
    const docsUpdater = new DocsUpdater();
    await docsUpdater.updateDocs();
})();