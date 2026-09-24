// Deterministic ids (LMS-ROADMAP section 3), so rerunning the extractor or the import changes nothing.
import { createHash } from 'node:crypto';

const hash = text => createHash('sha1').update(text).digest('hex').slice(0, 10);

export const unitId = (courseId, unitIndex, title) => `u_${hash(`${courseId}|${unitIndex}|${title}`)}`;
export const itemId = (courseId, unitIndex, itemIndex, source) =>
  `i_${hash(`${courseId}|${unitIndex}|${itemIndex}|${source}`)}`;
export const lessonId = pathUnderPdfs => `l_${hash(pathUnderPdfs)}`;
export const checkpointId = itemIdValue => `c_${hash(`checkpoint|${itemIdValue}`)}`;
export const testId = itemIdValue => `t_${hash(`test|${itemIdValue}`)}`;
