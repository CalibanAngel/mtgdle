// Invoke the existing import route only inside the API container.
async function main() {
  const response = await fetch('http://127.0.0.1:3000/scryfall/import/all?local=true&onlyExpansion=true', {
    method: 'POST',
    signal: AbortSignal.timeout(1800000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Import failed: HTTP ${response.status} ${JSON.stringify(result)}`);
  console.log(JSON.stringify({
    sets: result.sets?.inserted?.length ?? result.sets,
    cards: result.cards,
    playableCards: result.playableCards?.inserted?.length,
  }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
