import { commonSupport45Ids } from "./commonSupportBatch.fixtures";
import { deployment45Ids } from "./deploymentSupportBatch.fixtures";
import { proxyDebuff45Ids } from "./proxyDebuffSupportBatch.fixtures";
import { elemental50Ids } from "./elementalSupportBatch.fixtures";
import { physical50Ids } from "./physicalSupportBatch.fixtures";
import { resource50Ids } from "./resourceSupportBatch.fixtures";
import { specialist50Ids } from "./specialistSupportBatch.fixtures";
import { reviewedSkillSupportsFor } from "./skillSupportPreferences";

// Historical capture suites still check every previously reviewed link.
// Each later batch has independent all-focus compatibility and behavior coverage.
export const preCommon45SupportsFor = (skillId: string,supportIds?: unknown) =>
  reviewedSkillSupportsFor(skillId,supportIds).filter(support => !commonSupport45Ids.has(support.id) && !deployment45Ids.has(support.id) && !proxyDebuff45Ids.has(support.id) && !elemental50Ids.has(support.id) && !physical50Ids.has(support.id) && !resource50Ids.has(support.id) && !specialist50Ids.has(support.id));
