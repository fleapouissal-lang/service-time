import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const buildIdPath = join(root, "apps", "web", ".next", "BUILD_ID");

if (!existsSync(buildIdPath)) {
  console.error(
    "\n✗ Aucun build de production trouvé (apps/web/.next/BUILD_ID manquant).",
  );
  console.error("  Lancez d'abord : npm run build:web");
  console.error("  Puis redémarrez : pm2 restart service-time\n");
  process.exit(1);
}
