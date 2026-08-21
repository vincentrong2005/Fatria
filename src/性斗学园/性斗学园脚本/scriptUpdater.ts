import { compare } from 'compare-versions';

export const SCRIPT_VERSION = '3.6.3';
export const SCRIPT_UPDATE_EVENT = 'fatria-script-update-status';

const JSDELIVR_HOST = 'cdn.jsdelivr.net';
const JSDELIVR_REPOSITORY_PREFIX = '/gh/vincentrong2005/Fatria@';
const SCRIPT_BUNDLE_PATH = '/dist/性斗学园/性斗学园脚本/index.js';
const SCRIPT_IMPORT_URL_PATTERN = /(\bimport\s*(?:\(\s*)?['"])(https:\/\/[^'"\s]+)(['"]\s*\)?)/g;

const UPDATE_MANIFEST_URL =
  'https://raw.githubusercontent.com/vincentrong2005/Fatria/main/src/%E6%80%A7%E6%96%97%E5%AD%A6%E5%9B%AD/%E6%80%A7%E6%96%97%E5%AD%A6%E5%9B%AD%E8%84%9A%E6%9C%AC/update-manifest.json';
const UPDATE_CHECK_STORAGE_KEY = 'fatria-sex-battle-academy-script-update-v2';
const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface ScriptUpdateManifest {
  version: string;
  /** Immutable Git tag holding this exact script release, for example `v3.6.0`. */
  releaseTag: string;
  changelog?: string[];
}

export interface ApplyScriptUpdateResult {
  updated: boolean;
  message: string;
  releaseTag?: string;
}

export interface ScriptUpdateState {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  isUsingMutableReference: boolean;
  status: 'idle' | 'checking' | 'available' | 'latest' | 'error';
  message: string;
  checkedAt?: number;
  manifest?: ScriptUpdateManifest;
}

interface ScriptUpdateCache {
  lastCheckedAt?: number;
  latestVersion?: string;
  dismissedVersion?: string;
  manifest?: ScriptUpdateManifest;
}

interface CheckScriptUpdateOptions {
  force?: boolean;
  silent?: boolean;
  prompt?: boolean;
}

const globalAny = globalThis as any;

let scriptUpdateState: ScriptUpdateState = {
  currentVersion: SCRIPT_VERSION,
  latestVersion: SCRIPT_VERSION,
  hasUpdate: false,
  isUsingMutableReference: false,
  status: 'idle',
  message: '尚未检查更新。',
};
let updateCheckScheduled = false;

export function getScriptUpdateState(): ScriptUpdateState {
  return cloneState(scriptUpdateState);
}

export function scheduleScriptUpdateCheck(delayMs = 4000): void {
  if (updateCheckScheduled) return;
  updateCheckScheduled = true;
  window.setTimeout(() => {
    void checkScriptUpdate({ force: true, prompt: true, silent: true });
  }, delayMs);
}

export function registerScriptUpdateGlobals(): void {
  globalAny.__fatriaScriptUpdater = {
    currentVersion: SCRIPT_VERSION,
    check: checkScriptUpdate,
    showGuide: showScriptUpdateGuide,
    getState: getScriptUpdateState,
  };
}

export async function checkScriptUpdate(options: CheckScriptUpdateOptions = {}): Promise<ScriptUpdateState> {
  const cache = readUpdateCache();
  const now = Date.now();
  if (!options.force && cache.lastCheckedAt && now - cache.lastCheckedAt < UPDATE_CHECK_INTERVAL_MS) {
    applyCachedUpdateState(cache);
    const state = getScriptUpdateState();
    if (state.hasUpdate && state.manifest) {
      notifyAvailableScriptUpdate(state.manifest, cache, options);
    }
    return state;
  }

  setScriptUpdateState({
    status: 'checking',
    message: '正在检查脚本更新...',
  });

  try {
    const manifest = await fetchUpdateManifest();
    const latestVersion = normalizeVersion(manifest.version);
    const hasNewerVersion = compare(SCRIPT_VERSION, latestVersion, '<');
    const isUsingMutableReference = isCurrentScriptUsingMainReference();
    const hasUpdate = hasNewerVersion || isUsingMutableReference;

    writeUpdateCache({
      ...cache,
      lastCheckedAt: now,
      latestVersion,
      manifest,
    });

    setScriptUpdateState({
      latestVersion,
      hasUpdate,
      isUsingMutableReference,
      status: hasUpdate ? 'available' : 'latest',
      message: hasNewerVersion
        ? `发现新版本 v${latestVersion}，请清除浏览器缓存后刷新浏览器。（帖子内标注也有只刷新单个脚本缓存的办法）`
        : isUsingMutableReference
          ? `当前使用 @main 链接，可固定到 v${latestVersion} 以避免后续缓存延迟。`
          : `当前已是最新版 v${SCRIPT_VERSION}。`,
      checkedAt: now,
      manifest,
    });

    if (hasUpdate) {
      notifyAvailableScriptUpdate(manifest, cache, options);
    } else if (!options.silent && options.force) {
      notifySuccess(`当前已是最新版 v${SCRIPT_VERSION}。`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '检查更新失败';
    setScriptUpdateState({
      status: 'error',
      hasUpdate: false,
      message,
    });
    if (!options.silent) {
      notifyError(message);
    }
    console.warn('[性斗学园脚本] 检查脚本更新失败:', error);
  }

  return getScriptUpdateState();
}

export function showScriptUpdateGuide(manifestOverride?: ScriptUpdateManifest): void {
  const manifest = manifestOverride ?? scriptUpdateState.manifest;
  if (!manifest) {
    window.alert('尚未读取到更新信息。请先点击“检查更新”。');
    return;
  }

  window.alert(buildUpdateGuideText(manifest));
  writeUpdateCache({
    ...readUpdateCache(),
    dismissedVersion: normalizeVersion(manifest.version),
  });
}

/**
 * Replace this script's official jsDelivr import in the character script library
 * with the immutable release URL described by the update manifest.
 */
export async function applyScriptUpdate(manifestOverride?: ScriptUpdateManifest): Promise<ApplyScriptUpdateResult> {
  const manifest = manifestOverride ?? scriptUpdateState.manifest;
  if (!manifest) {
    return { updated: false, message: '尚未读取到更新信息，请先检查更新。' };
  }

  const releaseTag = normalizeReleaseTag(manifest.releaseTag);
  if (!releaseTag) {
    return { updated: false, message: '更新清单缺少有效的发布标签，无法自动更新。' };
  }

  const releaseUrl = getReleaseScriptUrl(releaseTag);
  try {
    const response = await fetch(releaseUrl, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok) {
      return {
        updated: false,
        message: `发布标签 ${releaseTag} 尚不可用（HTTP ${response.status}），请稍后重试。`,
      };
    }
  } catch (error) {
    console.warn('[性斗学园脚本] 校验发布标签失败:', error);
    return { updated: false, message: '无法校验发布标签，请检查网络后重试。' };
  }

  const scriptId = getScriptId();
  let foundCurrentScript = false;
  let updatedImport = false;

  try {
    updateScriptTreesWith(
      trees =>
        trees.map(tree =>
          updateScriptTreeImport(tree, scriptId, releaseTag, result => {
            foundCurrentScript ||= result.found;
            updatedImport ||= result.updated;
          }),
        ),
      { type: 'character' },
    );
  } catch (error) {
    console.error('[性斗学园脚本] 写入角色脚本库失败:', error);
    return { updated: false, message: '写入角色脚本库失败，请检查酒馆助手权限后重试。' };
  }

  if (!foundCurrentScript) {
    return { updated: false, message: '当前脚本不在角色脚本库中，未修改任何内容。' };
  }
  if (!updatedImport) {
    return {
      updated: false,
      message: '当前脚本不是官方 jsDelivr 外链，已为安全起见保留原内容。',
    };
  }

  return {
    updated: true,
    message: `已改为固定版本 ${releaseTag}，正在重新加载脚本。`,
    releaseTag,
  };
}

async function promptScriptUpdateGuide(manifest: ScriptUpdateManifest): Promise<void> {
  const latestVersion = normalizeVersion(manifest.version);
  const action = isCurrentScriptUsingMainReference() ? '固定到发布版本' : '更新到新版本';
  const confirmed = window.confirm(
    `发现性斗学园脚本可${action} v${latestVersion}。\n\n当前运行版本：v${SCRIPT_VERSION}\n\n是否立即更新？`,
  );
  if (confirmed) {
    const result = await applyScriptUpdate(manifest);
    if (result.updated) {
      notifySuccess(result.message);
      window.setTimeout(() => window.location.reload(), 450);
    } else {
      notifyError(result.message);
    }
    return;
  }

  writeUpdateCache({
    ...readUpdateCache(),
    dismissedVersion: latestVersion,
  });
}

function notifyAvailableScriptUpdate(
  manifest: ScriptUpdateManifest,
  cache: ScriptUpdateCache,
  options: CheckScriptUpdateOptions,
): void {
  const latestVersion = normalizeVersion(manifest.version);
  if (options.prompt && cache.dismissedVersion !== latestVersion) {
    void promptScriptUpdateGuide(manifest);
    return;
  }

  if (!options.silent) {
    notifyInfo(`发现脚本新版本 v${latestVersion}，请清除浏览器缓存后重新加载。`);
  }
}

async function fetchUpdateManifest(): Promise<ScriptUpdateManifest> {
  const response = await fetch(UPDATE_MANIFEST_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`读取更新清单失败：HTTP ${response.status}`);
  }

  const manifest = (await response.json()) as Partial<ScriptUpdateManifest>;
  return normalizeManifest(manifest);
}

function normalizeManifest(manifest: Partial<ScriptUpdateManifest>): ScriptUpdateManifest {
  const version = normalizeVersion(manifest.version);
  if (!version) {
    throw new Error('更新清单缺少 version。');
  }
  const releaseTag = normalizeReleaseTag(manifest.releaseTag);
  if (!releaseTag) {
    throw new Error('更新清单缺少 releaseTag。');
  }
  return {
    version,
    releaseTag,
    changelog: Array.isArray(manifest.changelog) ? manifest.changelog.map(safeString).filter(Boolean) : [],
  };
}

function applyCachedUpdateState(cache: ScriptUpdateCache): void {
  const latestVersion = normalizeVersion(cache.latestVersion || SCRIPT_VERSION) || SCRIPT_VERSION;
  const hasNewerVersion = compare(SCRIPT_VERSION, latestVersion, '<');
  const isUsingMutableReference = isCurrentScriptUsingMainReference();
  const hasUpdate = hasNewerVersion || isUsingMutableReference;
  setScriptUpdateState({
    latestVersion,
    hasUpdate,
    isUsingMutableReference,
    status: hasUpdate ? 'available' : 'latest',
    message: hasNewerVersion
      ? `发现新版本 v${latestVersion}，请清除浏览器缓存后重新加载脚本。`
      : isUsingMutableReference
        ? `当前使用 @main 链接，可固定到 v${latestVersion} 以避免后续缓存延迟。`
        : `当前已是最新版 v${SCRIPT_VERSION}。`,
    checkedAt: cache.lastCheckedAt,
    manifest:
      cache.manifest ??
      (hasUpdate ? { version: latestVersion, releaseTag: `v${latestVersion}`, changelog: [] } : undefined),
  });
}

function normalizeVersion(version: unknown): string {
  return safeString(version).replace(/^v/i, '');
}

function normalizeReleaseTag(value: unknown): string {
  const tag = safeString(value).replace(/^@/, '');
  return /^[A-Za-z0-9._-]+$/.test(tag) ? tag : '';
}

function getReleaseScriptUrl(releaseTag: string): string {
  return `https://${JSDELIVR_HOST}${JSDELIVR_REPOSITORY_PREFIX}${encodeURIComponent(releaseTag)}${SCRIPT_BUNDLE_PATH}`;
}

function isCurrentScriptUsingMainReference(): boolean {
  try {
    const script = findScriptById(getScriptTrees({ type: 'character' }), getScriptId());
    return script ? hasOfficialScriptReference(script.content, 'main') : false;
  } catch (error) {
    console.warn('[性斗学园脚本] 无法读取当前脚本链接:', error);
    return false;
  }
}

function findScriptById(trees: ScriptTree[], targetScriptId: string): Script | null {
  for (const tree of trees) {
    if (tree.type === 'script' && tree.id === targetScriptId) {
      return tree;
    }
    if (tree.type === 'folder') {
      const script = findScriptById(tree.scripts, targetScriptId);
      if (script) return script;
    }
  }
  return null;
}

interface ScriptTreeUpdateResult {
  found: boolean;
  updated: boolean;
}

function updateScriptTreeImport(
  tree: ScriptTree,
  targetScriptId: string,
  releaseTag: string,
  notify: (result: ScriptTreeUpdateResult) => void,
): ScriptTree {
  if (tree.type === 'folder') {
    return {
      ...tree,
      scripts: tree.scripts.map(script => updateScriptTreeImport(script, targetScriptId, releaseTag, notify) as Script),
    };
  }

  if (tree.id !== targetScriptId) {
    return tree;
  }

  const content = replaceOfficialScriptImport(tree.content, releaseTag);
  notify({ found: true, updated: content !== tree.content });
  return content === tree.content ? tree : { ...tree, content };
}

function replaceOfficialScriptImport(content: string, releaseTag: string): string {
  return content.replace(SCRIPT_IMPORT_URL_PATTERN, (whole, prefix: string, urlText: string, suffix: string) => {
    const replacement = replaceOfficialScriptUrl(urlText, releaseTag);
    return replacement ? `${prefix}${replacement}${suffix}` : whole;
  });
}

function hasOfficialScriptReference(content: string, expectedReference: string): boolean {
  for (const match of content.matchAll(SCRIPT_IMPORT_URL_PATTERN)) {
    const reference = getOfficialScriptReference(match[2]);
    if (reference === expectedReference) return true;
  }
  return false;
}

function replaceOfficialScriptUrl(urlText: string, releaseTag: string): string | null {
  try {
    const url = new URL(urlText);
    const bundlePathIndex = getOfficialScriptBundlePathIndex(url);
    if (bundlePathIndex < 0) {
      return null;
    }

    url.pathname = `${JSDELIVR_REPOSITORY_PREFIX}${encodeURIComponent(releaseTag)}${url.pathname.slice(bundlePathIndex)}`;
    return url.href;
  } catch {
    return null;
  }
}

function getOfficialScriptReference(urlText: string): string | null {
  try {
    const url = new URL(urlText);
    const bundlePathIndex = getOfficialScriptBundlePathIndex(url);
    if (bundlePathIndex < 0) return null;
    return decodeURIComponent(url.pathname.slice(JSDELIVR_REPOSITORY_PREFIX.length, bundlePathIndex));
  } catch {
    return null;
  }
}

function getOfficialScriptBundlePathIndex(url: URL): number {
  if (
    url.protocol !== 'https:' ||
    url.hostname !== JSDELIVR_HOST ||
    !url.pathname.startsWith(JSDELIVR_REPOSITORY_PREFIX)
  ) {
    return -1;
  }

  const bundlePathIndex = url.pathname.indexOf('/dist/', JSDELIVR_REPOSITORY_PREFIX.length);
  return bundlePathIndex >= 0 && decodeURIComponent(url.pathname.slice(bundlePathIndex)) === SCRIPT_BUNDLE_PATH
    ? bundlePathIndex
    : -1;
}

function buildUpdateGuideText(manifest: ScriptUpdateManifest): string {
  const latestVersion = normalizeVersion(manifest.version);
  const changelog = manifest.changelog?.filter(Boolean).slice(0, 6) ?? [];
  const changelogText = changelog.length > 0 ? `\n\n更新内容：\n${changelog.map(item => `- ${item}`).join('\n')}` : '';
  return [
    `性斗学园脚本已有新版本 v${latestVersion}。`,
    '',
    `当前运行版本：v${SCRIPT_VERSION}`,
    '',
    '在设置页点击“更新至指定版本”后，脚本会尝试把角色脚本库中的官方 jsDelivr 链接改为固定发布标签。',
    '如果当前条目不是官方外链、是内联脚本，或发布标签尚不可用，则不会自动改写。',
    '',
    '常用处理方法：',
    '1. 优先点击设置页的“更新至指定版本”。',
    '2. 如果按钮提示当前条目不是官方外链，请手动将 import 改为带 `@vX.Y.Z` 的固定版本链接。',
    '3. 若发布标签尚不可用，请等待发布完成后再检查更新。',
    changelogText,
  ].join('\n');
}

function setScriptUpdateState(patch: Partial<ScriptUpdateState>): void {
  scriptUpdateState = {
    ...scriptUpdateState,
    ...patch,
    currentVersion: SCRIPT_VERSION,
  };
  window.dispatchEvent(new CustomEvent(SCRIPT_UPDATE_EVENT, { detail: getScriptUpdateState() }));
}

function cloneState(state: ScriptUpdateState): ScriptUpdateState {
  return {
    ...state,
    manifest: state.manifest
      ? {
          ...state.manifest,
          changelog: [...(state.manifest.changelog ?? [])],
        }
      : undefined,
  };
}

function readUpdateCache(): ScriptUpdateCache {
  try {
    const raw = window.localStorage?.getItem(UPDATE_CHECK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ScriptUpdateCache;
    return {
      lastCheckedAt: Number.isFinite(Number(parsed.lastCheckedAt)) ? Number(parsed.lastCheckedAt) : undefined,
      latestVersion: normalizeVersion(parsed.latestVersion),
      dismissedVersion: normalizeVersion(parsed.dismissedVersion),
      manifest: parsed.manifest ? normalizeManifest(parsed.manifest) : undefined,
    };
  } catch {
    return {};
  }
}

function writeUpdateCache(cache: ScriptUpdateCache): void {
  try {
    window.localStorage?.setItem(UPDATE_CHECK_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // 更新缓存失败不影响脚本本体使用。
  }
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function notifyInfo(message: string): void {
  if (typeof toastr !== 'undefined') {
    toastr.info(message, '性斗学园脚本更新');
  }
}

function notifySuccess(message: string): void {
  if (typeof toastr !== 'undefined') {
    toastr.success(message, '性斗学园脚本更新');
  }
}

function notifyError(message: string): void {
  if (typeof toastr !== 'undefined') {
    toastr.error(message, '性斗学园脚本更新');
  }
}
