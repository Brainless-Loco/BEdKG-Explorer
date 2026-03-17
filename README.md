# BEdKG Explorer

BEdKG Explorer is a web-based analytical interface for the Bangladesh Education Knowledge Graph (BEdKG). The system combines large language model driven natural language interpretation with standards-compliant SPARQL querying to support exploratory access to structured educational data. It is designed to lower the technical barrier to knowledge graph interrogation while preserving transparency through executable query generation, direct SPARQL editing, tabular result inspection, and visualization-oriented analysis.

The application operationalizes BEdKG as a multidimensional knowledge graph modeled with RDF Data Cube and QB4OLAP vocabularies. Users may formulate information needs in natural language, inspect the generated SPARQL query, execute the query against a configured endpoint, and review the returned observations and dimension members in an interactive interface. This workflow is intended for research, demonstration, and decision-support scenarios involving educational indicators, institutional characteristics, geographic roll-ups, and category-based aggregation across the Bangladesh education domain.

## Abstract-Style Overview

This project presents an interactive semantic exploration environment for the Bangladesh Education Knowledge Graph. The system integrates a natural language to SPARQL generation layer with a browser-based query workspace, enabling non-expert users to retrieve and interpret graph-structured educational data without manually composing formal queries from scratch. By grounding query generation in a compact schema context derived from the BEdKG TBox and ABox patterns, the interface improves identifier fidelity for case-sensitive measures, levels, and attributes. The resulting platform supports reproducible graph querying, human-readable explanation, direct query refinement, and result inspection for education-oriented analytical tasks.

## Development Status and Limitations

This project is under active development. While the natural language interface is designed to generate executable and interpretable SPARQL, some NL queries may produce incomplete or non-exact results depending on query ambiguity, model behavior, and schema coverage. For high-stakes analysis, users should review and validate generated SPARQL before drawing conclusions.

## Core Capabilities

- Natural language question answering over BEdKG through LLM-assisted SPARQL generation.
- Direct SPARQL authoring and execution against a configurable endpoint.
- Schema-aware prompt grounding using BEdKG vocabulary, level-member structure, and observation patterns.
- Interactive tabular result inspection and visualization workflow.
- Development-time proxy support for SPARQL endpoints that do not expose permissive browser CORS headers.

## System Architecture

- Frontend: React, TypeScript, Vite, Material UI.
- Query generation: Gemini models via the Google GenAI SDK.
- Data access: SPARQL over HTTP with JSON result handling.
- Knowledge representation: RDF Data Cube and QB4OLAP patterns over the Bangladesh Education Knowledge Graph.

## Project Structure

- [src/App.tsx](src/App.tsx): main application interface for natural language querying, SPARQL editing, and result presentation.
- [src/services/gemini.ts](src/services/gemini.ts): prompt construction and model invocation for natural language to SPARQL generation.
- [src/services/sparql.ts](src/services/sparql.ts): SPARQL request execution and result normalization.
- [src/constants/schemaContext.ts](src/constants/schemaContext.ts): condensed case-sensitive BEdKG schema context used to ground query generation.
- [src/components/Visualization.tsx](src/components/Visualization.tsx): visualization layer for returned query results.

## Local Setup

Prerequisite: Node.js 18 or later.

1. Install dependencies.

```bash
npm install
```

2. Create a local environment file named `.env.local` in the project root.

3. Add the required configuration.

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_SPARQL_PROXY_TARGET=http://localhost:8890
VITE_SPARQL_ENDPOINT=/sparql
```

4. Start the development server.

```bash
npm run dev
```

5. Open the application in the browser at `http://localhost:3000`.

## Endpoint Configuration

The development setup is configured to call the SPARQL endpoint through the Vite dev server using the same-origin path `/sparql`. This avoids browser CORS failures when the target triple store does not return the required cross-origin headers. By default, the proxy forwards requests to `http://localhost:8890`. If your SPARQL service is hosted elsewhere, update `VITE_SPARQL_PROXY_TARGET` accordingly and restart the development server.

## Typical Usage Workflow

1. Enter a natural language question about educational indicators, institutions, or geographic hierarchies.
2. Review the generated explanation and SPARQL query.
3. Execute the query against the configured BEdKG endpoint.
4. Inspect the returned bindings in table form and continue with interactive exploration.

## Research Relevance

BEdKG Explorer is suitable for semantic web demonstrations, knowledge graph usability studies, natural language interface experiments, and applied education analytics. The system is especially relevant where domain users need interpretable access to graph-structured public-sector data while retaining visibility into the formal query process.
