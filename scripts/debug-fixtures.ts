import "dotenv/config";

async function main() {
  const apiKey = process.env.API_FOOTBALL_KEY!;
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=239&season=2026`,
    { headers: { "x-apisports-key": apiKey } },
  );
  const data = await res.json();
  console.log("status:", res.status);
  console.log("results:", data.results);
  console.log("errors:", JSON.stringify(data.errors));
  console.log("paging:", JSON.stringify(data.paging));
  console.log("first item:", JSON.stringify(data.response?.[0], null, 2));
}

main();
