import "dotenv/config";
import { syncFixtures } from "../lib/api-football";

async function main() {
  const result = await syncFixtures();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
