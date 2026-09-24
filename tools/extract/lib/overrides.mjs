// Fixes that live only in the extracted copy, so the live site's files stay untouched until cutover:
//   tools/extract/overrides/lessons/<path under assets/pdfs>  replaces that page's body (title and course tag kept)
//   tools/extract/overrides/courses.json                       exact find/replace patches on a course page
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const LESSONS = 'tools/extract/overrides/lessons';
const COURSES = 'tools/extract/overrides/courses.json';

export function loadOverrides(siteRoot) {
  const root = join(siteRoot, LESSONS);
  const overrides = new Map();
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else overrides.set(full.slice(root.length + 1).split('\\').join('/'), readFileSync(full, 'utf8'));
    }
  };
  if (existsSync(root)) walk(root);
  return overrides;
}

export function loadCoursePatches(siteRoot) {
  const path = join(siteRoot, COURSES);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}

/** Each patch must match exactly once, so a patch can never silently stop applying or hit the wrong place. */
export function applyCoursePatches(html, patches, where) {
  return patches.reduce((out, { find, replace }) => {
    const times = out.split(find).length - 1;
    if (times !== 1) throw new Error(`${where}: a course patch matched ${times} times, expected once: ${find}`);
    return out.replace(find, () => replace);
  }, html);
}

export function unusedOverrides(overridePaths, knownPaths) {
  return overridePaths.filter(path => !knownPaths.has(path));
}
