
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const SHELL: string;
	export const LSCOLORS: string;
	export const LESS: string;
	export const CONDA_EXE: string;
	export const POWERSHELL_UPDATECHECK: string;
	export const POWERSHELL_TELEMETRY_OPTOUT: string;
	export const SSH_AUTH_SOCK: string;
	export const DOTNET_CLI_TELEMETRY_OPTOUT: string;
	export const GEMINI_API_KEY: string;
	export const NMAP_PRIVILEGED: string;
	export const LIBVA_DRIVER_NAME: string;
	export const PWD: string;
	export const LOGNAME: string;
	export const QT_QPA_PLATFORMTHEME: string;
	export const XDG_SESSION_TYPE: string;
	export const CONDA_PREFIX: string;
	export const FZF_DEFAULT_COMMAND: string;
	export const MOTD_SHOWN: string;
	export const COMMAND_NOT_FOUND_INSTALL_PROMPT: string;
	export const HOME: string;
	export const LANG: string;
	export const LS_COLORS: string;
	export const CONDA_PROMPT_MODIFIER: string;
	export const SSH_CONNECTION: string;
	export const NVM_DIR: string;
	export const XDG_SESSION_CLASS: string;
	export const TERM: string;
	export const FZF_CTRL_T_COMMAND: string;
	export const ZSH: string;
	export const USER: string;
	export const GIT_PAGER: string;
	export const FZF_ALT_C_COMMAND: string;
	export const CONDA_SHLVL: string;
	export const FZF_CTRL_T_OPTS: string;
	export const SHLVL: string;
	export const PAGER: string;
	export const XDG_SESSION_ID: string;
	export const CONDA_PYTHON_EXE: string;
	export const XDG_RUNTIME_DIR: string;
	export const SSH_CLIENT: string;
	export const CONDA_DEFAULT_ENV: string;
	export const GEMINI_CLI: string;
	export const GOOGLE_API_KEY: string;
	export const GEMINI_CLI_NO_RELAUNCH: string;
	export const XDG_DATA_DIRS: string;
	export const PATH: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const FZF_DEFAULT_OPTS: string;
	export const SSH_TTY: string;
	export const OLDPWD: string;
	export const _: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		SHELL: string;
		LSCOLORS: string;
		LESS: string;
		CONDA_EXE: string;
		POWERSHELL_UPDATECHECK: string;
		POWERSHELL_TELEMETRY_OPTOUT: string;
		SSH_AUTH_SOCK: string;
		DOTNET_CLI_TELEMETRY_OPTOUT: string;
		GEMINI_API_KEY: string;
		NMAP_PRIVILEGED: string;
		LIBVA_DRIVER_NAME: string;
		PWD: string;
		LOGNAME: string;
		QT_QPA_PLATFORMTHEME: string;
		XDG_SESSION_TYPE: string;
		CONDA_PREFIX: string;
		FZF_DEFAULT_COMMAND: string;
		MOTD_SHOWN: string;
		COMMAND_NOT_FOUND_INSTALL_PROMPT: string;
		HOME: string;
		LANG: string;
		LS_COLORS: string;
		CONDA_PROMPT_MODIFIER: string;
		SSH_CONNECTION: string;
		NVM_DIR: string;
		XDG_SESSION_CLASS: string;
		TERM: string;
		FZF_CTRL_T_COMMAND: string;
		ZSH: string;
		USER: string;
		GIT_PAGER: string;
		FZF_ALT_C_COMMAND: string;
		CONDA_SHLVL: string;
		FZF_CTRL_T_OPTS: string;
		SHLVL: string;
		PAGER: string;
		XDG_SESSION_ID: string;
		CONDA_PYTHON_EXE: string;
		XDG_RUNTIME_DIR: string;
		SSH_CLIENT: string;
		CONDA_DEFAULT_ENV: string;
		GEMINI_CLI: string;
		GOOGLE_API_KEY: string;
		GEMINI_CLI_NO_RELAUNCH: string;
		XDG_DATA_DIRS: string;
		PATH: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		FZF_DEFAULT_OPTS: string;
		SSH_TTY: string;
		OLDPWD: string;
		_: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
