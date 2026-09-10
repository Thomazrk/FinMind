// Fjerner følsomme felter og klipper lange værdier, før noget fra portalen når en agent.
// Et felt skjules, hvis dets navn indeholder et af ordene i skjulte_felter — uanset hvor
// dybt det ligger, og uanset hvilken samling det kom fra.
export function lavRens({ skjulte_felter = [], maks_tegn_pr_felt = 500, maks_liste = 20, maks_dybde = 3 } = {}) {
  const skjulte = skjulte_felter.map(s => String(s).toLowerCase());
  return function rens(data, dybde = 0) {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) return data.slice(0, maks_liste).map(v => rens(v, dybde + 1));
    if (data instanceof Date) return data.toISOString().slice(0, 10);
    if (typeof data?.toDate === 'function') return data.toDate().toISOString().slice(0, 10);
    if (typeof data === 'object') {
      if (dybde > maks_dybde) return '[…]';
      const ud = {};
      for (const [k, v] of Object.entries(data)) {
        ud[k] = skjulte.some(s => k.toLowerCase().includes(s)) ? '[skjult]' : rens(v, dybde + 1);
      }
      return ud;
    }
    if (typeof data === 'string' && data.length > maks_tegn_pr_felt) return data.slice(0, maks_tegn_pr_felt) + '…';
    return data;
  };
}
