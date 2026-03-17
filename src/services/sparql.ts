/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SparqlResult {
  head: { vars: string[] };
  results: { bindings: any[] };
}

export async function executeSparql(query: string, endpoint: string = import.meta.env.VITE_SPARQL_ENDPOINT || "/sparql"): Promise<SparqlResult> {
  const url = endpoint.startsWith("http")
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin);
  url.searchParams.append("query", query);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/sparql-results+json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SPARQL Error: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/sparql-results+json") || contentType.includes("application/json")) {
    return response.json();
  }

  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("SPARQL response was not JSON. Check endpoint content negotiation and CORS settings.");
  }
}

export function formatResultsForGrid(result: SparqlResult) {
  const { vars } = result.head;
  const { bindings } = result.results;

  const columns = vars.map((v) => ({
    field: v,
    headerName: v.charAt(0).toUpperCase() + v.slice(1),
    flex: 1,
    minWidth: 150,
  }));

  const rows = bindings.map((b, index) => {
    const row: any = { id: index };
    vars.forEach((v) => {
      row[v] = b[v]?.value || "";
    });
    return row;
  });

  return { columns, rows };
}
