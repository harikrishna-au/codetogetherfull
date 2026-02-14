module.exports = {
    apps: [{
        name: "codetogether-api",
        script: "./dist/server.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: "production",
            PORT: 4000
        }
    }]
};
