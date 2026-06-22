import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import { HtmlRspackPlugin, type Configuration } from "@rspack/core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const reactVersion = "19.2.7";
const dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultApiOrigin = "http://localhost:4000";
const defaultApiRequestOrigin = "http://localhost:3000";

function normalizeOrigin(value: string | undefined, fallback: string) {
  const rawValue = value?.trim() || fallback;

  return new URL(rawValue).origin;
}

const apiOrigin = normalizeOrigin(process.env.API_ORIGIN, defaultApiOrigin);
const apiRequestOrigin = normalizeOrigin(process.env.API_REQUEST_ORIGIN, defaultApiRequestOrigin);

const config: Configuration = {
  context: dirname,
  entry: {
    main: "./src/main.tsx",
  },
  output: {
    clean: true,
    publicPath: "auto",
    path: path.resolve(dirname, "dist"),
  },
  devServer: {
    headers: {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Origin": "*",
    },
    historyApiFallback: true,
    hot: true,
    port: 3003,
    proxy: [
      {
        context: ["/api"],
        target: apiOrigin,
        changeOrigin: true,
        on: {
          proxyReq(proxyReq) {
            proxyReq.setHeader("origin", apiRequestOrigin);
          },
        },
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: {
              syntax: "typescript",
              tsx: true,
            },
            transform: {
              react: {
                runtime: "automatic",
              },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
        type: "javascript/auto",
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  plugins: [
    new HtmlRspackPlugin({
      chunks: ["main"],
      publicPath: "/",
      template: "./src/index.html",
    }),
    new ModuleFederationPlugin({
      name: "account",
      filename: "remoteEntry.js",
      dts: false,
      exposes: {
        "./AccountBadge": "./src/components/account/account-badge.tsx",
        "./AccountMenu": "./src/components/account/account-menu.tsx",
        "./LoginPage": "./src/components/account/login-page.tsx",
        "./RegisterPage": "./src/components/account/register-page.tsx",
        "./ProfilePage": "./src/components/account/profile-page.tsx",
        "./OrdersPage": "./src/components/account/orders-page.tsx",
        "./FavoritesPage": "./src/components/account/favorites-page.tsx",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: reactVersion,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: reactVersion,
        },
      },
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

export default config;
