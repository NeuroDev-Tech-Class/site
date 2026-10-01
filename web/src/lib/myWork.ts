// The student's handed-in work: the most recent pieces for My Courses, and one item's attempts for its feedback;
// and the certificates their coach has let them view
import { getMyCertificates, getMyWork, type MyCertificate, type Submission } from './api'
import { useApprovedId } from './courseProgress'
import { createRemote, type Remote } from './remote'

const RECENT = 'recent'
const work = createRemote(key => getMyWork(key === RECENT ? undefined : key))

export const useRecentWork = (): Remote<Submission[]> => work.useRemote(RECENT, useApprovedId())

/** Newest attempt first */
export const useItemWork = (itemId: string): Remote<Submission[]> => work.useRemote(itemId, useApprovedId())

const certificates = createRemote(() => getMyCertificates())

export const useMyCertificates = (): Remote<MyCertificate[]> => certificates.useRemote('mine', useApprovedId())
