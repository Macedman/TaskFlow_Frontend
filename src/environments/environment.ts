// Production build (ng build). Local development uses environment.development.ts (port 5001)
// and the browser tests use environment.e2e.ts.
// TODO on deploy day: replace with the real address Render gives the backend service.
export const environment = {
    apiUrl: 'https://taskflow-api.onrender.com'
};
