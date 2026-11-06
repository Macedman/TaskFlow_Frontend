// Used by `ng serve --configuration e2e` (see playwright.config.ts): the browser tests
// talk to their own backend on 5002, which runs against taskflow_test, never the dev API
export const environment = {
    apiUrl: 'http://localhost:5002'
};
