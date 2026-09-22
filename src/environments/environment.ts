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

        /*
         * Endpoint que confirma si la cookie sigue siendo
         * válida y devuelve el usuario autenticado.
         * Debe responder con el usuario si la sesión es válida
         * y con 401/403 si no lo es.
         */
        perfil: '/usuarios/me'
    }
};