import "dotenv/config";
import { findLeagues } from "../lib/api-football";

async function main() {
  const leagues = await findLeagues("Colombia");
  console.log(JSON.stringify(leagues, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
