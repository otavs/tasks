/** Port of the admin API (127.0.0.1 only): ADMIN_PORT, or the one after PORT. */
export const adminPort = () => Number(process.env.ADMIN_PORT || Number(process.env.PORT) + 1)
