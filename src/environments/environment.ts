export const environment = {
    production: false,
    apiUrl: 'http://localhost:8081/api',

    /*
     * Rutas de autenticación.
     *
     * La sesión viaja en una cookie HttpOnly emitida por
     * el backend, por lo que el frontend NUNCA lee el token.
     *
     * Las rutas se dejan aquí para confirmarlas con el backend
     * sin tener que tocar los servicios.
     */
    auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        perfil: '/usuarios/me',
        csrf: '/auth/csrf'
    }
};