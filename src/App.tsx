import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Shield, Search, Activity, Globe, Cpu, AlertCircle, CheckCircle2, Loader2, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanResult {
  port: number;
  status: string;
  banner?: string;
}

export default function App() {
  const [target, setTarget] = useState('');
  const [startPort, setStartPort] = useState('1');
  const [endPort, setEndPort] = useState('100');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const startScan = async () => {
    if (!target) {
      setError('Please provide a target IP or URL');
      return;
    }

    const sPort = parseInt(startPort);
    const ePort = parseInt(endPort);

    if (isNaN(sPort) || isNaN(ePort) || sPort < 1 || ePort > 65535 || sPort > ePort) {
      setError('Invalid port range (1-65535)');
      return;
    }

    if (ePort - sPort > 500) {
      setError('Range too large. Max 500 ports per scan for stability.');
      return;
    }

    setError(null);
    setIsScanning(true);
    setResults([]);
    setLogs([]);
    addLog(`Initializing scan on target: ${target}`);
    addLog(`Range: ${sPort} - ${ePort}`);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, startPort: sPort, endPort: ePort }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Scan failed');
      }

      const data = await response.json();
      setResults(data.results);
      addLog(`Scan complete. Found ${data.results.length} open ports.`);
      if (data.results.length === 0) {
        addLog('No open ports detected in the specified range.');
      }
    } catch (err: any) {
      setError(err.message);
      addLog(`ERROR: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black p-4 md:p-8">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-[#00ff41]/30 pb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-[#00ff41]/10 rounded-lg border border-[#00ff41]/50 shadow-[0_0_15px_rgba(0,255,65,0.2)]">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase italic">CyberScan v1.0</h1>
              <p className="text-xs text-[#00ff41]/60">Advanced Network Reconnaissance Tool</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isScanning ? 'animate-pulse text-red-500' : 'text-[#00ff41]'}`} />
              <span>SYSTEM: {isScanning ? 'SCANNING' : 'READY'}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>SECURE_NODE: ACTIVE</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111] border border-[#00ff41]/20 p-6 rounded-xl shadow-2xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" /> CONFIGURATION
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase mb-1 opacity-60">Target IP / URL</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input 
                      type="text" 
                      placeholder="e.g. 192.168.1.1 or google.com"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full bg-black border border-[#00ff41]/30 rounded p-2 pl-10 focus:outline-none focus:border-[#00ff41] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase mb-1 opacity-60">Start Port</label>
                    <input 
                      type="number" 
                      value={startPort}
                      onChange={(e) => setStartPort(e.target.value)}
                      className="w-full bg-black border border-[#00ff41]/30 rounded p-2 focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase mb-1 opacity-60">End Port</label>
                    <input 
                      type="number" 
                      value={endPort}
                      onChange={(e) => setEndPort(e.target.value)}
                      className="w-full bg-black border border-[#00ff41]/30 rounded p-2 focus:outline-none focus:border-[#00ff41]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2 rounded border border-red-500/30">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  onClick={startScan}
                  disabled={isScanning}
                  className={`w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${
                    isScanning 
                    ? 'bg-[#00ff41]/20 text-[#00ff41]/50 cursor-not-allowed' 
                    : 'bg-[#00ff41] text-black hover:bg-[#00ff41]/80 active:scale-95 shadow-[0_0_20px_rgba(0,255,65,0.3)]'
                  }`}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      EXECUTING...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      INITIATE SCAN
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-[#111] border border-[#00ff41]/20 p-6 rounded-xl">
              <h3 className="text-xs uppercase opacity-60 mb-4">Session Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-black border border-[#00ff41]/10 rounded">
                  <div className="text-2xl font-bold">{results.length}</div>
                  <div className="text-[10px] opacity-50 uppercase">Open Ports</div>
                </div>
                <div className="p-3 bg-black border border-[#00ff41]/10 rounded">
                  <div className="text-2xl font-bold">{isScanning ? '...' : '0'}</div>
                  <div className="text-[10px] opacity-50 uppercase">Vulnerabilities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Panel */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Log Terminal */}
            <div className="bg-black border border-[#00ff41]/30 rounded-xl overflow-hidden flex flex-col h-[300px] shadow-2xl">
              <div className="bg-[#111] px-4 py-2 border-b border-[#00ff41]/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Terminal className="w-4 h-4" />
                  <span>SYSTEM_LOGS</span>
                </div>
                <button onClick={clearLogs} className="hover:text-white transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div 
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto text-sm space-y-1 scrollbar-thin scrollbar-thumb-[#00ff41]/20"
              >
                {logs.length === 0 && (
                  <div className="opacity-30 italic">Waiting for input...</div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-[#00ff41]/40 mr-2">{'>'}</span>
                    {log}
                  </div>
                ))}
                {isScanning && (
                  <div className="flex items-center gap-2 animate-pulse">
                    <span className="text-[#00ff41]/40 mr-2">{'>'}</span>
                    Scanning ports... <Loader2 className="w-3 h-3 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Results Display */}
            <div className="bg-[#111] border border-[#00ff41]/20 rounded-xl flex-1 overflow-hidden flex flex-col shadow-2xl">
              <div className="bg-[#1a1a1a] px-4 py-3 border-b border-[#00ff41]/30 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="font-bold">SCAN RESULTS</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="popLayout">
                  {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {results.map((res, i) => (
                        <motion.div 
                          key={res.port}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-black border border-[#00ff41]/20 p-4 rounded-lg hover:border-[#00ff41]/50 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="text-xl font-bold text-white">PORT {res.port}</div>
                              <span className="px-2 py-0.5 bg-[#00ff41]/20 text-[#00ff41] text-[10px] rounded uppercase font-bold">Open</span>
                            </div>
                            <div className="text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                              SERVICE: {getCommonService(res.port)}
                            </div>
                          </div>
                          {res.banner && (
                            <div className="mt-2 p-3 bg-[#0a0a0a] border border-[#00ff41]/10 rounded text-xs">
                              <div className="text-[#00ff41]/40 uppercase text-[9px] mb-1">Banner Details:</div>
                              <pre className="whitespace-pre-wrap break-all opacity-80 leading-relaxed">
                                {res.banner}
                              </pre>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    !isScanning && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                        <Search className="w-16 h-16 mb-4" />
                        <p className="text-xl italic uppercase tracking-widest">No Active Data</p>
                      </div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="mt-12 text-center text-[10px] opacity-30 uppercase tracking-[0.3em]">
        Authorized Personnel Only // Encrypted Session // Node_{Math.floor(Math.random() * 9999)}
      </footer>
    </div>
  );
}

function getCommonService(port: number): string {
  const services: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    8080: 'HTTP-Proxy',
    27017: 'MongoDB'
  };
  return services[port] || 'Unknown';
}
