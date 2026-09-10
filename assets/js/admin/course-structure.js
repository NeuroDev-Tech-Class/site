// Course pages embed their unit list as JSON in <script id="unit-data">.
export async function fetchCourseStructure(courseId) {
  try {
    const res = await fetch(new URL(`courses/${courseId}.html`, document.baseURI));
    if (!res.ok) return null;
    const parsed = new DOMParser().parseFromString(await res.text(), 'text/html');
    const scriptEl = parsed.getElementById('unit-data');
    return scriptEl ? JSON.parse(scriptEl.textContent) : null;
  } catch {
    return null;
  }
}
