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
  const [progress, setProgress] = useState(0);

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

    if (ePort - sPort > 1000) {
      setError('Range too large. Max 1000 ports per scan.');
      return;
    }

    setError(null);
    setIsScanning(true);
    setResults([]);
    setLogs([]);
    setProgress(0);

    addLog(`Initializing scan on target: ${target}`);
    addLog(`Range: ${sPort} - ${ePort}`);

    try {

      const totalPorts = ePort - sPort + 1;

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

      setProgress(100);

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
    setProgress(0);
  };

  return (

    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff41] font-mono p-4 md:p-8">

      <div className="max-w-6xl mx-auto">

        <header className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-[#00ff41]/30 pb-6">

          <div className="flex items-center gap-4 mb-4 md:mb-0">

            <div className="p-3 bg-[#00ff41]/10 rounded-lg border border-[#00ff41]/50">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-3xl font-bold uppercase italic">CyberScan v1.0</h1>
              <p className="text-xs opacity-60">Advanced Network Reconnaissance Tool</p>
            </div>

          </div>

          <div className="flex items-center gap-6 text-sm">

            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isScanning ? 'animate-pulse text-red-500' : 'text-[#00ff41]'}`} />
              <span>SYSTEM: {isScanning ? 'SCANNING' : 'READY'}</span>
            </div>

          </div>

        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-4 space-y-6">

            <div className="bg-[#111] border border-[#00ff41]/20 p-6 rounded-xl">

              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" /> CONFIGURATION
              </h2>

              <div className="space-y-4">

                <div>
                  <label className="block text-xs uppercase mb-1 opacity-60">Target IP / URL</label>

                  <input
                    type="text"
                    placeholder="192.168.1.1 or google.com"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-black border border-[#00ff41]/30 rounded p-2"
                  />

                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <label className="block text-xs uppercase mb-1 opacity-60">Start Port</label>

                    <input
                      type="number"
                      value={startPort}
                      onChange={(e) => setStartPort(e.target.value)}
                      className="w-full bg-black border border-[#00ff41]/30 rounded p-2"
                    />

                  </div>

                  <div>

                    <label className="block text-xs uppercase mb-1 opacity-60">End Port</label>

                    <input
                      type="number"
                      value={endPort}
                      onChange={(e) => setEndPort(e.target.value)}
                      className="w-full bg-black border border-[#00ff41]/30 rounded p-2"
                    />

                  </div>

                </div>

                {error && (
                  <div className="text-red-500 text-xs">{error}</div>
                )}

                <button
                  onClick={startScan}
                  disabled={isScanning}
                  className="w-full py-3 rounded font-bold flex items-center justify-center gap-2 bg-[#00ff41] text-black"
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

                {isScanning && (

                  <div className="mt-4">

                    <div className="w-full bg-black border border-[#00ff41]/30 rounded h-3">

                      <div
                        className="bg-[#00ff41] h-3 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />

                    </div>

                    <p className="text-xs mt-1 opacity-60">
                      Scan Progress: {progress}%
                    </p>

                  </div>

                )}

              </div>

            </div>

          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">

            <div className="bg-black border border-[#00ff41]/30 rounded-xl h-[300px] flex flex-col">

              <div className="bg-[#111] px-4 py-2 border-b border-[#00ff41]/30 flex justify-between">

                <div className="flex items-center gap-2 text-xs">
                  <Terminal className="w-4 h-4" />
                  SYSTEM_LOGS
                </div>

                <button onClick={clearLogs}>
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>

              <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto text-sm">

                {logs.map((log, i) => (
                  <div key={i}>
                    &gt; {log}
                  </div>
                ))}

              </div>

            </div>

            <div className="bg-[#111] border border-[#00ff41]/20 rounded-xl p-4">

              <h2 className="font-bold mb-4">SCAN RESULTS</h2>

              {results.map((res) => (

                <div key={res.port} className="border border-[#00ff41]/20 p-3 mb-2 rounded">

                  <div className="flex justify-between">

                    <div className="font-bold text-white">
                      PORT {res.port}
                    </div>

                    <span className="text-xs bg-[#00ff41]/20 px-2 rounded">
                      OPEN
                    </span>

                  </div>

                  {res.banner && (
                    <pre className="text-xs mt-2 opacity-80">
                      {res.banner}
                    </pre>
                  )}

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  );

}

function getCommonService(port:number){

  const services:Record<number,string> = {
    21:'FTP',
    22:'SSH',
    23:'Telnet',
    25:'SMTP',
    53:'DNS',
    80:'HTTP',
    443:'HTTPS',
    3306:'MySQL',
    3389:'RDP',
    8080:'HTTP Proxy'
  };

  return services[port] || "Unknown";

}