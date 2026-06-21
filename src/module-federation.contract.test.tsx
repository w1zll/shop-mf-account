import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ComponentType } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import rspackConfig from "../rspack.config";
import * as AccountBadgeModule from "./components/account/account-badge";
import * as AccountMenuModule from "./components/account/account-menu";
import * as FavoritesPageModule from "./components/account/favorites-page";
import * as LoginPageModule from "./components/account/login-page";
import * as OrdersPageModule from "./components/account/orders-page";
import * as ProfilePageModule from "./components/account/profile-page";
import * as RegisterPageModule from "./components/account/register-page";
import { resetAccountQueryClientForTests } from "./lib/account-query";

type ModuleFederationOptions = {
  dts?: boolean;
  filename: string;
  exposes: Record<string, string>;
  name: string;
  shared: Record<string, { requiredVersion?: string; singleton?: boolean }>;
};

type FederationPlugin = {
  _options: ModuleFederationOptions;
};

type ExposedModule = {
  default: ComponentType<never>;
} & Record<string, unknown>;

type Manifest = {
  id: string;
  name: string;
  metaData: {
    globalName: string;
    remoteEntry: {
      name: string;
      path: string;
    };
  };
  exposes: Array<{
    assets: {
      js: {
        async: string[];
        sync: string[];
      };
    };
    name: string;
    path: string;
  }>;
  shared: Array<{
    name: string;
    requiredVersion: string;
    singleton: boolean;
    version: string;
  }>;
};

const expectedExposes = {
  "./AccountBadge": "./src/components/account/account-badge.tsx",
  "./AccountMenu": "./src/components/account/account-menu.tsx",
  "./LoginPage": "./src/components/account/login-page.tsx",
  "./RegisterPage": "./src/components/account/register-page.tsx",
  "./ProfilePage": "./src/components/account/profile-page.tsx",
  "./OrdersPage": "./src/components/account/orders-page.tsx",
  "./FavoritesPage": "./src/components/account/favorites-page.tsx",
} as const;

const expectedExposeNames = Object.keys(expectedExposes).map((expose) => expose.slice(2));
const distPath = path.resolve(process.cwd(), "dist");
const manifestPath = path.join(distPath, "mf-manifest.json");

const exposedModules = [
  {
    expose: "./AccountBadge",
    exportName: "AccountBadge",
    module: AccountBadgeModule as unknown as ExposedModule,
  },
  {
    expose: "./AccountMenu",
    exportName: "AccountMenu",
    module: AccountMenuModule as unknown as ExposedModule,
  },
  {
    expose: "./LoginPage",
    exportName: "LoginPage",
    module: LoginPageModule as unknown as ExposedModule,
  },
  {
    expose: "./RegisterPage",
    exportName: "RegisterPage",
    module: RegisterPageModule as unknown as ExposedModule,
  },
  {
    expose: "./ProfilePage",
    exportName: "ProfilePage",
    module: ProfilePageModule as unknown as ExposedModule,
  },
  {
    expose: "./OrdersPage",
    exportName: "OrdersPage",
    module: OrdersPageModule as unknown as ExposedModule,
  },
  {
    expose: "./FavoritesPage",
    exportName: "FavoritesPage",
    module: FavoritesPageModule as unknown as ExposedModule,
  },
] as const;

const authResponse = {
  user: {
    id: "user-1",
    email: "demo@example.com",
    name: "Demo User",
    avatarUrl: null,
    bonusBalanceCents: 12_500,
    role: "USER",
  },
};

const favoritesResponse = {
  items: [],
};

const ordersResponse = {
  items: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

function createResponse(body: unknown, status = 200) {
  return {
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
  } as Response;
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
}

function createFetchMock() {
  return vi.fn((input: RequestInfo | URL) => {
    const url = getRequestUrl(input);

    if (url.endsWith("/users/me")) {
      return Promise.resolve(createResponse(authResponse));
    }

    if (url.endsWith("/favorites")) {
      return Promise.resolve(createResponse(favoritesResponse));
    }

    if (url.includes("/orders")) {
      return Promise.resolve(createResponse(ordersResponse));
    }

    if (url.endsWith("/auth/csrf")) {
      return Promise.resolve(createResponse({ csrfToken: "csrf-token" }));
    }

    return Promise.resolve(createResponse({ message: "Unexpected request" }, 500));
  });
}

function isFederationPlugin(plugin: unknown): plugin is FederationPlugin {
  return typeof plugin === "object" && plugin !== null && "_options" in plugin;
}

function getFederationOptions(): ModuleFederationOptions {
  const plugins: readonly unknown[] = rspackConfig.plugins ?? [];
  const federationPlugin = plugins.find(isFederationPlugin);

  if (!federationPlugin) {
    throw new Error("ModuleFederationPlugin was not found in rspack config");
  }

  return federationPlugin._options;
}

function readManifest() {
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));

  return manifest as Manifest;
}

function assertAssetExists(assetName: string) {
  expect(existsSync(path.join(distPath, assetName))).toBe(true);
}

afterEach(() => {
  cleanup();
  resetAccountQueryClientForTests();
  vi.unstubAllGlobals();
});

describe("Module Federation source contract", () => {
  it("keeps remote name, entry file and expose names stable", () => {
    const options = getFederationOptions();

    expect(options.name).toBe("account");
    expect(options.filename).toBe("remoteEntry.js");
    expect(options.dts).toBe(false);
    expect(options.exposes).toEqual(expectedExposes);
  });

  it("keeps React shared as singleton with the current React version", () => {
    const options = getFederationOptions();

    expect(options.shared.react).toMatchObject({
      requiredVersion: React.version,
      singleton: true,
    });
    expect(options.shared["react-dom"]).toMatchObject({
      requiredVersion: React.version,
      singleton: true,
    });
  });

  it("exports default and named components for every expose", () => {
    for (const exposedModule of exposedModules) {
      expect(typeof exposedModule.module.default).toBe("function");
      expect(exposedModule.module[exposedModule.exportName]).toBe(exposedModule.module.default);
    }
  });

  it.each(exposedModules)("renders $expose without host-specific wrappers", async ({ module }) => {
    vi.stubGlobal("fetch", createFetchMock());

    const Component = module.default as ComponentType<Record<string, unknown>>;
    const { container } = render(<Component />);

    await waitFor(() => {
      expect(container.firstElementChild).toBeTruthy();
    });
  });
});

describe.skipIf(!existsSync(manifestPath))("Module Federation build manifest contract", () => {
  it("emits manifest and remote entry for the account remote", () => {
    const manifest = readManifest();

    expect(manifest.id).toBe("account");
    expect(manifest.name).toBe("account");
    expect(manifest.metaData.globalName).toBe("account");
    expect(manifest.metaData.remoteEntry.name).toBe("remoteEntry.js");
    assertAssetExists("remoteEntry.js");
  });

  it("emits the expected exposes and their JS assets", () => {
    const manifest = readManifest();

    expect(manifest.exposes.map((expose) => expose.path)).toEqual(Object.keys(expectedExposes));
    expect(manifest.exposes.map((expose) => expose.name)).toEqual(expectedExposeNames);

    for (const expose of manifest.exposes) {
      expect(expose.assets.js.sync).toContain(`__federation_expose_${expose.name}.js`);

      for (const assetName of [...expose.assets.js.sync, ...expose.assets.js.async]) {
        assertAssetExists(assetName);
      }
    }
  });

  it("emits React shared dependencies as singleton", () => {
    const manifest = readManifest();

    expect(
      manifest.shared.map((dependency) => ({
        name: dependency.name,
        requiredVersion: dependency.requiredVersion,
        singleton: dependency.singleton,
        version: dependency.version,
      })),
    ).toEqual(
      expect.arrayContaining([
        {
          name: "react",
          requiredVersion: React.version,
          singleton: true,
          version: React.version,
        },
        {
          name: "react-dom",
          requiredVersion: React.version,
          singleton: true,
          version: React.version,
        },
      ]),
    );
  });
});
