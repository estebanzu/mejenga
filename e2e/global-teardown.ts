import { cleanupE2EData, getTestAdminId } from "./support/supabase";

export default async function globalTeardown(): Promise<void> {
  const adminId = await getTestAdminId();
  await cleanupE2EData(adminId);
}
