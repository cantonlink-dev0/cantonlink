/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    webpack: (config, { isServer }) => {
        // pino-pretty: mock on client; externalize on server
        config.resolve.alias = {
            ...config.resolve.alias,
            "@react-native-async-storage/async-storage": false,
            ...(isServer ? {} : { "pino-pretty": false }),
        };
        config.externals = [
            ...(Array.isArray(config.externals) ? config.externals : []),
            ...(isServer ? ["pino-pretty", "@grpc/grpc-js", "@grpc/proto-loader"] : []),
        ];
        return config;
    },
};

export default nextConfig;

