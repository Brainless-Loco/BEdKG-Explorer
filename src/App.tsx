/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress, 
  IconButton,
  Modal,
  Fade,
  Backdrop,
  Divider,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Search, 
  Code, 
  Play, 
  Database, 
  MessageSquare, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { processNaturalLanguageQuery, extractSparql } from './services/gemini';
import { executeSparql, formatResultsForGrid, SparqlResult } from './services/sparql';
import Visualization from './components/Visualization';

// Prism for code highlighting
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-clike';

// Removing problematic language imports that cause runtime crashes in Vite
// SPARQL highlighting will be disabled for now to ensure the app is functional

import Editor from 'react-simple-code-editor';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>Something went wrong</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{this.state.error?.message || 'An unexpected error occurred.'}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Reload App</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [resultView, setResultView] = useState<'table' | 'viz'>('table');
  const [nlQuery, setNlQuery] = useState('');
  const [nlResponse, setNlResponse] = useState('');
  const [sparqlQuery, setSparqlQuery] = useState('PREFIX bedkg: <http://www.bike-csecu.com/datasets/BEdKG/>\nPREFIX qb: <http://purl.org/linked-data/cube#>\n\nSELECT * WHERE {\n  ?s ?p ?o\n} LIMIT 10');
  const [endpoint] = useState(import.meta.env.VITE_SPARQL_ENDPOINT || 'https://bike-csecu.com:8894/sparql');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [queryResults, setQueryResults] = useState<{ columns: GridColDef[], rows: any[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [nlResponse, sparqlQuery]);

  const handleNlSubmit = async () => {
    if (!nlQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await processNaturalLanguageQuery(nlQuery);
      setNlResponse(response);
      const extracted = extractSparql(response);
      if (extracted) {
        setSparqlQuery(extracted);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSparql = async (queryToRun: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await executeSparql(queryToRun, endpoint);
      const formatted = formatResultsForGrid(result);
      setQueryResults(formatted);
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to execute SPARQL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        py: 4 
      }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h3" component="h1" sx={{ 
              fontWeight: 900, 
              color: '#0f172a', 
              mb: 1, 
              letterSpacing: '-0.04em',
              textShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              BEdKG <span style={{ 
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Explorer</span>
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#475569', maxWidth: '600px', mx: 'auto', fontWeight: 500 }}>
              Bangladesh Education Knowledge Graph: Query structured educational data using Natural Language or SPARQL.
            </Typography>
          </motion.div>
        </Box>

        {/* Tabs */}
        <Paper elevation={0} sx={{ 
          borderRadius: 4, 
          mb: 4, 
          overflow: 'hidden', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{
              bgcolor: 'white',
              borderBottom: '1px solid #f1f5f9',
              '& .MuiTab-root': { 
                py: 3, 
                fontWeight: 700, 
                textTransform: 'none', 
                fontSize: '1.05rem',
                color: '#64748b',
                transition: 'all 0.2s',
                '&:hover': {
                  color: '#3b82f6',
                  bgcolor: '#f8fafc'
                }
              },
              '& .Mui-selected': { 
                color: '#3b82f6 !important',
                bgcolor: '#eff6ff'
              },
              '& .MuiTabs-indicator': { 
                bgcolor: '#3b82f6', 
                height: 4,
                borderRadius: '4px 4px 0 0'
              }
            }}
          >
            <Tab icon={<MessageSquare size={22} />} iconPosition="start" label="Natural Language AI" />
            <Tab icon={<Code size={22} />} iconPosition="start" label="SPARQL Editor" />
          </Tabs>

          <Box sx={{ p: 4, minHeight: '400px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 0 ? (
                <motion.div
                  key="nl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#1e293b' }}>
                      <MessageSquare size={20} className="text-blue-500" />
                      Ask anything about Bangladesh Education
                    </Typography>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="e.g., How many female students were there in 2024?"
                        value={nlQuery}
                        onChange={(e) => setNlQuery(e.target.value.slice(0, 500))}
                        sx={{ 
                          bgcolor: 'white',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)'
                            }
                          }
                        }}
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mt: 1.5
                      }}>
                        <Typography variant="caption" sx={{ color: nlQuery.length >= 450 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                          {nlQuery.length} / 500 characters
                        </Typography>
                        <Button 
                          variant="contained" 
                          size="large"
                          onClick={handleNlSubmit}
                          disabled={isLoading || !nlQuery.trim()}
                          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Search size={20} />}
                          sx={{ 
                            px: 6, 
                            borderRadius: 3, 
                            background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                            '&:hover': { 
                              background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
                              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.23)'
                            },
                            textTransform: 'none',
                            fontWeight: 700
                          }}
                        >
                          Ask AI
                        </Button>
                      </Box>
                    </Box>
                  </Box>

                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                  {nlResponse && (
                    <Paper elevation={0} sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      bgcolor: '#ffffff', 
                      border: '1px solid #e2e8f0',
                      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                    }}>
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>
                          AI Analysis
                        </Typography>
                      </Box>
                      <div className="prose prose-slate max-w-none prose-headings:text-blue-900 prose-p:text-slate-600">
                        <ReactMarkdown>{nlResponse}</ReactMarkdown>
                      </div>
                      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained" 
                          startIcon={<Play size={18} />}
                          onClick={() => handleRunSparql(sparqlQuery)}
                          sx={{ 
                            borderRadius: 3,
                            bgcolor: '#1e293b',
                            '&:hover': { bgcolor: '#0f172a' },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3
                          }}
                        >
                          Execute Generated Query
                        </Button>
                      </Box>
                    </Paper>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="sparql"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Code size={18} className="text-emerald-500" />
                    SPARQL Query Editor
                  </Typography>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 0, 
                      borderRadius: 3, 
                      overflow: 'hidden', 
                      border: '1px solid #cbd5e1',
                      bgcolor: '#1e293b',
                      mb: 3,
                      '& .container__editor': {
                        minHeight: '350px !important',
                        fontFamily: '"Fira Code", "Fira Mono", monospace !important',
                        fontSize: '14px !important',
                      },
                      '& textarea': {
                        outline: 'none !important',
                      }
                    }}
                  >
                    <Editor
                      value={sparqlQuery}
                      onValueChange={code => setSparqlQuery(code)}
                      highlight={code => {
                        try {
                          return Prism.highlight(code, Prism.languages.clike || {}, 'clike');
                        } catch (e) {
                          return code;
                        }
                      }}
                      padding={20}
                      className="container__editor"
                      style={{
                        fontFamily: '"Fira Code", "Fira Mono", monospace',
                        fontSize: 14,
                        color: '#f8fafc',
                        minHeight: 350
                      }}
                    />
                  </Paper>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
                    <Button 
                      variant="contained" 
                      onClick={() => handleRunSparql(sparqlQuery)}
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Play size={20} />}
                      sx={{ 
                        borderRadius: 3, 
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                        '&:hover': { 
                          background: 'linear-gradient(90deg, #059669, #047857)',
                          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.23)'
                        },
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        py: 1.5
                      }}
                    >
                      Execute Query
                    </Button>
                  </Box>
                  {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Paper>

        {/* Footer Info */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
            <Database size={16} />
            <Typography variant="body2">Virtuoso Endpoint: bike-csecu.com</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
            <ExternalLink size={16} />
            <Typography variant="body2">
              <a href="https://zenodo.org/records/17449564" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors">
                Dataset on Zenodo
              </a>
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Results Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={isModalOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '80vh',
            bgcolor: 'background.paper',
            borderRadius: 4,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Query Results</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={resultView}
                  exclusive
                  onChange={(_, v) => v && setResultView(v)}
                  size="small"
                >
                  <ToggleButton value="table">Table</ToggleButton>
                  <ToggleButton value="viz">Visualization</ToggleButton>
                </ToggleButtonGroup>
                <IconButton onClick={() => setIsModalOpen(false)}>
                  <ChevronRight style={{ transform: 'rotate(90deg)' }} />
                </IconButton>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ flexGrow: 1, width: '100%', overflow: 'auto' }}>
              {queryResults && (
                resultView === 'table' ? (
                  <DataGrid
                    rows={queryResults.rows}
                    columns={queryResults.columns}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    sx={{
                      border: 'none',
                      minHeight: 400,
                      '& .MuiDataGrid-columnHeaders': {
                        bgcolor: '#f8fafc',
                        fontWeight: 700
                      }
                    }}
                  />
                ) : (
                  <Visualization 
                    data={queryResults.rows} 
                    columns={queryResults.columns.map(c => c.field)} 
                  />
                )
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
    </ErrorBoundary>
  );
}
