import React, { useState } from 'react';
import {
  checkPasswordLeak,
  generateSecurePassword,
  PasswordAnalysisResult,
} from '../lib/tools/passwordLeakChecker';
import { analyzeSuspiciousLink, LinkAnalysisResult } from '../lib/tools/linkScanner';
import { checkEmailBreaches, EmailBreachAnalysis } from '../lib/tools/breachMonitor';
import { useScan } from '../context/ScanContext';
import {
  KeyRound,
  Link,
  Mail,
  CheckCircle2,
  Lock,
  Sparkles,
  Wifi,
  Layers,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export type ToolId =
  | 'password_check'
  | 'email_breach'
  | 'password_gen'
  | 'link_scanner'
  | 'network_inspect'
  | 'permission_inspect';

export const ToolsScreen: React.FC = () => {
  const { scanResult, addVaultCredential } = useScan();
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);

  // 1. Password Leak Check State
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordResult, setPasswordResult] = useState<PasswordAnalysisResult | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);

  // 2. Password Generator State
  const [genLength, setGenLength] = useState(16);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState(() => generateSecurePassword({ length: 16 }));
  const [copiedGen, setCopiedGen] = useState(false);
  const [isSavedToVault, setIsSavedToVault] = useState(false);
  const [showSaveVaultModal, setShowSaveVaultModal] = useState(false);
  const [vaultService, setVaultService] = useState('');
  const [vaultUsername, setVaultUsername] = useState('');
  const [vaultNotes, setVaultNotes] = useState('');
  const [vault2FA, setVault2FA] = useState(true);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // 3. Link Scanner State
  const [linkInput, setLinkInput] = useState('');
  const [linkResult, setLinkResult] = useState<LinkAnalysisResult | null>(null);

  // 4. Breach Radar State
  const [emailInput, setEmailInput] = useState('');
  const [breachResult, setBreachResult] = useState<EmailBreachAnalysis | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const signals = scanResult?.signals ?? [];
  const appSignals = signals.filter((s) => s.category === 'apps');

  const handleTestPassword = async (pwd?: string) => {
    const target = pwd || passwordInput;
    if (!target) return;
    setIsCheckingPassword(true);
    const res = await checkPasswordLeak(target);
    setPasswordResult(res);
    setIsCheckingPassword(false);
  };

  const handleRegeneratePassword = () => {
    const pwd = generateSecurePassword({
      length: genLength,
      includeSymbols: genSymbols,
      includeNumbers: genNumbers,
    });
    setGeneratedPassword(pwd);
    setCopiedGen(false);
    setIsSavedToVault(false);
  };

  const handleCopyGenerated = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopiedGen(true);
    setTimeout(() => setCopiedGen(false), 2000);
  };

  const handleSaveToVaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultService.trim()) return;

    addVaultCredential({
      service: vaultService.trim(),
      username: vaultUsername.trim() || 'user',
      password: generatedPassword,
      notes: vaultNotes.trim() || undefined,
      has2FA: vault2FA,
    });

    setIsSavedToVault(true);
    setShowSaveVaultModal(false);
    setVaultService('');
    setVaultUsername('');
    setVaultNotes('');
  };

  const handleScanLink = (url?: string) => {
    const target = url || linkInput;
    if (!target.trim()) return;
    const res = analyzeSuspiciousLink(target);
    setLinkResult(res);
  };

  const handleCheckBreaches = async (email?: string) => {
    const target = email || emailInput;
    if (!target.trim()) return;
    setIsCheckingEmail(true);
    const res = await checkEmailBreaches(target);
    setBreachResult(res);
    setIsCheckingEmail(false);
  };

  const handleBackFromGen = () => {
    if (!isSavedToVault && generatedPassword) {
      setShowExitPrompt(true);
    } else {
      setSelectedTool(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-[#E0DAD0] pb-3">
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
          Security Tools Workspace
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Run focused on-device diagnostic tools and privacy-preserving checks.
        </p>
      </div>

      {/* Main Tools Catalog (when no single tool is maximized) */}
      {!selectedTool && (
        <div className="space-y-6">
          {/* GROUP 1: Credential Security */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Credential Security
              </h3>
              <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Privacy-Preserving
              </span>
            </div>

            <div className="space-y-2">
              {/* Tool 1.1: Password Check */}
              <div
                onClick={() => setSelectedTool('password_check')}
                className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer space-y-2 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 mt-0.5">
                      <KeyRound size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900">Password Security Check</h4>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">k-Anonymity</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        Test password entropy and public leak exposure without transmitting plaintext.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 mt-1 shrink-0" />
                </div>
              </div>

              {/* Tool 1.2: Email Breach Radar */}
              <div
                onClick={() => setSelectedTool('email_breach')}
                className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer space-y-2 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 mt-0.5">
                      <Mail size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900">Email Breach Radar</h4>
                        <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">On-Device Index</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        Check whether an email address appears in verified corporate database leaks.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 mt-1 shrink-0" />
                </div>
              </div>

              {/* Tool 1.3: Password Generator */}
              <div
                onClick={() => setSelectedTool('password_gen')}
                className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer space-y-2 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700 border border-neutral-200 mt-0.5">
                      <Lock size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900">Secure Password Generator</h4>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">100% Local</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        Generate a strong random password locally and save it to the demo vault.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 mt-1 shrink-0" />
                </div>
              </div>
            </div>
          </section>

          {/* GROUP 2: Web & Network */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Web & Network Safety
              </h3>
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Transport Security
              </span>
            </div>

            <div className="space-y-2">
              {/* Tool 2.1: Link Scanner */}
              <div
                onClick={() => setSelectedTool('link_scanner')}
                className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer space-y-2 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 mt-0.5">
                      <Link size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900">Suspicious Link Scanner</h4>
                        <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Heuristic Engine</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        Analyze URLs for phishing, brand typosquatting, punycode spoofing, and raw IP usage.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 mt-1 shrink-0" />
                </div>
              </div>

              {/* Tool 2.2: Network Security Inspector */}
              <div
                onClick={() => setSelectedTool('network_inspect')}
                className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer space-y-2 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 mt-0.5">
                      <Wifi size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900">Network Security Inspector</h4>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Demo Signals</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        Inspect active Wi-Fi encryption (WPA2/WPA3), captive portals, and VPN tunnel security.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 mt-1 shrink-0" />
                </div>
              </div>
            </div>
          </section>

          {/* GROUP 3: Device & Permissions */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Device & System
              </h3>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                On-Device
              </span>
            </div>

            <div className="space-y-2">
              <div
                onClick={() => setSelectedTool('permission_inspect')}
                className="p-4 bg-white border border-[#E0DAD0] rounded-[22px] hover:border-neutral-400 active:scale-[0.99] transition-standard cursor-pointer space-y-2 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 mt-0.5">
                      <Layers size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900">Permission Inspector</h4>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Demo Signals</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        Review high-risk declared capabilities (SMS, Camera, Location, Contacts) across installed apps.
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400 mt-1 shrink-0" />
                </div>
              </div>
            </div>
          </section>

          {/* GROUP 4: Future Architecture Slots */}
          <section className="space-y-2.5 opacity-75">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-0.5">
              Future Security Capabilities
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 bg-neutral-50/80 border border-dashed border-neutral-300 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">QR Safety Scanner</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded">COMING SOON</span>
                </div>
                <p className="text-[11px] text-neutral-500">Heuristic threat checking before resolving QR redirects.</p>
              </div>

              <div className="p-3 bg-neutral-50/80 border border-dashed border-neutral-300 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">TLS & Header Inspector</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded">COMING SOON</span>
                </div>
                <p className="text-[11px] text-neutral-500">HSTS, CSP, and certificate chain validator.</p>
              </div>

              <div className="p-3 bg-neutral-50/80 border border-dashed border-neutral-300 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">2FA Readiness Check</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded">COMING SOON</span>
                </div>
                <p className="text-[11px] text-neutral-500">Multi-factor coverage checklist across critical services.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ACTIVE WORKSPACE: TOOL 1 - Password Security Check */}
      {selectedTool === 'password_check' && (
        <article className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTool(null)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Tools Directory
          </button>

          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0 mt-0.5">
                <KeyRound size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Password Security Check
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                    K-ANONYMITY
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Evaluates entropy and queries the Have I Been Pwned database using <strong>k-Anonymity (first 5 SHA-1 characters)</strong>. Plaintext passwords never leave your browser.
                </p>
              </div>
            </div>

            {/* Demo shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-600" /> Sample tests:
              </span>
              <button
                type="button"
                onClick={() => {
                  setPasswordInput('Password123!');
                  handleTestPassword('Password123!');
                }}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-200 text-[11px] text-neutral-700 cursor-pointer transition-colors"
              >
                "Password123!" (Leaked)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordInput('K8#mZ$9vL@2qW!');
                  handleTestPassword('K8#mZ$9vL@2qW!');
                }}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-200 text-[11px] text-neutral-700 cursor-pointer transition-colors"
              >
                "K8#mZ$9vL@2qW!" (Clean)
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTestPassword();
              }}
              className="space-y-3 pt-1"
            >
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Enter password to evaluate:
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter a password to test..."
                  className="w-full h-11 px-3.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-standard shadow-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingPassword || !passwordInput}
                className="w-full h-11 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 active:scale-[0.98] transition-standard disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isCheckingPassword ? 'Checking breach registers...' : 'Evaluate Password'}
              </button>
            </form>

            {passwordResult && (
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <div className="bg-neutral-50/80 p-4 border border-neutral-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200/70 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Password Analysis
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      passwordResult.isLeaked ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {passwordResult.isLeaked ? 'Compromised' : 'Secure'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Strength</span>
                      <span className="font-semibold text-neutral-900">{passwordResult.entropyLabel}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Entropy</span>
                      <span className="font-semibold font-mono text-neutral-900">{passwordResult.entropyBits} bits</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Estimated Risk</span>
                      <span className={`font-semibold ${passwordResult.isLeaked ? 'text-red-700' : 'text-emerald-700'}`}>
                        {passwordResult.isLeaked ? 'Critical' : 'Low'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Public Exposure</span>
                      <span className="font-semibold font-mono text-neutral-900">
                        {passwordResult.isLeaked ? `${passwordResult.leakCount.toLocaleString()} matches` : 'No match'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-xs rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Check size={13} className="text-emerald-700" />
                      <span>Password is processed locally on this device.</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Check size={13} className="text-emerald-700" />
                      <span>Plaintext password is never transmitted or stored.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      )}

      {/* ACTIVE WORKSPACE: TOOL 2 - Email Breach Radar */}
      {selectedTool === 'email_breach' && (
        <article className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTool(null)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Tools Directory
          </button>

          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0 mt-0.5">
                <Mail size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Email Breach Radar
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md">
                    LOCAL INDEX
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Checks your email address against verified public breach dumps (Adobe, Canva, LinkedIn, Dropbox, etc.) without revealing your email to third-party ad trackers.
                </p>
              </div>
            </div>

            {/* Demo shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-600" /> Sample tests:
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmailInput('breached.user@example.com');
                  handleCheckBreaches('breached.user@example.com');
                }}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-200 text-[11px] text-neutral-700 cursor-pointer transition-colors"
              >
                "breached.user@..." (3 Exposures)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailInput('clean.account@secure.org');
                  handleCheckBreaches('clean.account@secure.org');
                }}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-200 text-[11px] text-neutral-700 cursor-pointer transition-colors"
              >
                "clean.account@..." (Safe)
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckBreaches();
              }}
              className="space-y-3 pt-1"
            >
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Email address to evaluate:
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full h-11 px-3.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-standard shadow-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingEmail || !emailInput}
                className="w-full h-11 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 active:scale-[0.98] transition-standard disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isCheckingEmail ? 'Searching breach database...' : 'Scan Email for Exposures'}
              </button>
            </form>

            {breachResult && (
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <div className="bg-neutral-50/80 p-4 border border-neutral-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200/70 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Breach Radar Results
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      breachResult.isCompromised ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {breachResult.isCompromised ? `${breachResult.breachCount} Exposures Detected` : 'Zero Exposures'}
                    </span>
                  </div>

                  {/* List of Breaches */}
                  {breachResult.breaches.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-neutral-700 block">Identified Corporate Breaches:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {breachResult.breaches.map((b) => (
                          <div key={b.name} className="p-2.5 bg-white border border-neutral-200 rounded-xl space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-semibold text-neutral-900 text-xs">{b.title}</span>
                              <span className="font-mono text-[10px] text-neutral-400">{b.breachDate.slice(0, 4)}</span>
                            </div>
                            <span className="text-[10px] text-red-700 font-medium block">
                              {b.dataClasses.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Potentially Exposed Fields */}
                      <div className="pt-2 border-t border-neutral-200/70 text-xs space-y-1">
                        <span className="font-semibold text-neutral-800">Potentially Exposed Data Classes:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {breachResult.exposedDataClasses.map((dc) => (
                            <span key={dc} className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded text-[11px] font-medium">
                              {dc}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Actions */}
                      <div className="pt-2 border-t border-neutral-200/70 text-xs space-y-1">
                        <span className="font-semibold text-neutral-800">Recommended Next Steps:</span>
                        <ul className="list-disc list-inside text-neutral-600 space-y-0.5 text-xs">
                          {breachResult.remediationAdvice.map((adv, idx) => (
                            <li key={idx}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>No known corporate exposures found for this account.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>
      )}

      {/* ACTIVE WORKSPACE: TOOL 3 - Password Generator with Save to Vault */}
      {selectedTool === 'password_gen' && (
        <article className="space-y-4">
          <button
            type="button"
            onClick={handleBackFromGen}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Tools Directory
          </button>

          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-800 border border-neutral-200 shrink-0 mt-0.5">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Secure Password Generator
                </h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Generates cryptographically random credentials on device using <code>crypto.getRandomValues</code> with high entropy.
                </p>
              </div>
            </div>

            {/* Generated Password Output Box */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs">
                <span className="font-mono text-sm sm:text-base font-bold text-neutral-900 break-all select-all tracking-wider">
                  {generatedPassword}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyGenerated}
                    className="h-8 px-3 bg-neutral-900 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-neutral-800 active:scale-[0.98] transition-standard cursor-pointer"
                  >
                    {copiedGen ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedGen ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSaveVaultModal(true)}
                    className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-standard cursor-pointer ${
                      isSavedToVault
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.98]'
                    }`}
                  >
                    {isSavedToVault ? <ShieldCheck size={13} /> : <Plus size={13} />}
                    <span>{isSavedToVault ? 'In Vault' : 'Save to Vault'}</span>
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1 text-neutral-700">
                    <span>Length:</span>
                    <span className="font-mono font-bold">{genLength} characters</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="32"
                    value={genLength}
                    onChange={(e) => setGenLength(parseInt(e.target.value, 10))}
                    className="w-full accent-neutral-900 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-1.5 text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genSymbols}
                      onChange={(e) => setGenSymbols(e.target.checked)}
                      className="accent-neutral-900"
                    />
                    <span>Include Special Symbols (!@#$)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genNumbers}
                      onChange={(e) => setGenNumbers(e.target.checked)}
                      className="accent-neutral-900"
                    />
                    <span>Include Numbers (2-9)</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="w-full h-10 bg-white border border-neutral-300 text-neutral-800 rounded-xl font-medium hover:bg-neutral-100 active:scale-[0.98] transition-standard flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Generate New Password</span>
                </button>
              </div>
            </div>
          </div>

          {/* Save to Vault In-Place Modal */}
          {showSaveVaultModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white border border-[#E0DAD0] rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Save Generated Password to Vault
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSaveVaultModal(false)}
                    className="text-neutral-400 hover:text-neutral-800 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveToVaultSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Account / Service:
                    </label>
                    <input
                      type="text"
                      required
                      value={vaultService}
                      onChange={(e) => setVaultService(e.target.value)}
                      placeholder="e.g. netflix.com, campus.edu"
                      className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Username / Email:
                    </label>
                    <input
                      type="text"
                      required
                      value={vaultUsername}
                      onChange={(e) => setVaultUsername(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Generated Password:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={generatedPassword}
                      className="w-full h-10 px-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-700 font-mono text-xs select-all"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Optional Notes:
                    </label>
                    <input
                      type="text"
                      value={vaultNotes}
                      onChange={(e) => setVaultNotes(e.target.value)}
                      placeholder="e.g. Work subscription"
                      className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vault2FA}
                      onChange={(e) => setVault2FA(e.target.checked)}
                      className="accent-neutral-900"
                    />
                    <span className="text-neutral-700 font-medium">Two-Factor Authentication is enabled</span>
                  </label>

                  <div className="pt-2 border-t border-neutral-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSaveVaultModal(false)}
                      className="flex-1 h-10 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-standard cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-10 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition-standard shadow-xs cursor-pointer"
                    >
                      Save Securely
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Exit Confirmation Dialog */}
          {showExitPrompt && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white border border-[#E0DAD0] rounded-[24px] max-w-sm w-full p-6 space-y-4 shadow-xl">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Save this password before leaving?
                  </h3>
                  <p className="text-xs text-neutral-500">
                    You generated a secure password that has not yet been saved to your Offline Vault.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExitPrompt(false);
                      setShowSaveVaultModal(true);
                    }}
                    className="w-full h-10 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-standard cursor-pointer"
                  >
                    Save to Vault
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExitPrompt(false);
                      setSelectedTool(null);
                    }}
                    className="w-full h-10 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-standard cursor-pointer"
                  >
                    Discard & Leave
                  </button>
                </div>
              </div>
            </div>
          )}
        </article>
      )}

      {/* ACTIVE WORKSPACE: TOOL 4 - Suspicious Link Scanner */}
      {selectedTool === 'link_scanner' && (
        <article className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTool(null)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Tools Directory
          </button>

          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0 mt-0.5">
                <Link size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Suspicious Link Scanner
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                    HEURISTIC ENGINE
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Evaluates target URLs against brand typosquatting, deceptive login paths, IDN punycode spoofing, and raw IP hosts.
                </p>
              </div>
            </div>

            {/* Demo shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-600" /> Sample tests:
              </span>
              <button
                type="button"
                onClick={() => {
                  const s = 'https://secure-paypa1-login.xyz/verify';
                  setLinkInput(s);
                  handleScanLink(s);
                }}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-200 text-[11px] text-neutral-700 cursor-pointer transition-colors"
              >
                "paypa1-login.xyz" (Phishing)
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = 'https://github.com/google/security';
                  setLinkInput(s);
                  handleScanLink(s);
                }}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-200 text-[11px] text-neutral-700 cursor-pointer transition-colors"
              >
                "github.com" (Clean)
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScanLink();
              }}
              className="space-y-3 pt-1"
            >
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Paste URL to inspect:
                </label>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://example-banking.xyz/verify"
                  className="w-full h-11 px-3.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-standard shadow-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={!linkInput}
                className="w-full h-11 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 active:scale-[0.98] transition-standard disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Inspect Link Safety
              </button>
            </form>

            {linkResult && (
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <div className="bg-neutral-50/80 p-4 border border-neutral-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200/70 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Link Analysis Summary
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      linkResult.verdict === 'MALICIOUS'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : linkResult.verdict === 'SUSPICIOUS'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {linkResult.verdict === 'MALICIOUS' ? 'HIGH RISK' : linkResult.verdict === 'SUSPICIOUS' ? 'CAUTION' : 'SAFE'}
                    </span>
                  </div>

                  {/* Heuristics Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Typosquatting</span>
                      <span className={`font-semibold ${linkResult.hasTyposquatting ? 'text-red-700' : 'text-emerald-700'}`}>
                        {linkResult.hasTyposquatting ? 'Detected' : 'No'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Punycode Spoofing</span>
                      <span className={`font-semibold ${linkResult.hasPunycode ? 'text-red-700' : 'text-emerald-700'}`}>
                        {linkResult.hasPunycode ? 'Detected' : 'No'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Raw IP Host</span>
                      <span className={`font-semibold ${linkResult.isIpHost ? 'text-red-700' : 'text-emerald-700'}`}>
                        {linkResult.isIpHost ? 'Detected' : 'No'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Suspicious TLD</span>
                      <span className={`font-semibold ${linkResult.hasSuspiciousTld ? 'text-red-700' : 'text-emerald-700'}`}>
                        {linkResult.hasSuspiciousTld ? 'Detected' : 'Standard'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Deceptive Path</span>
                      <span className={`font-semibold ${linkResult.hasDeceptivePath ? 'text-red-700' : 'text-emerald-700'}`}>
                        {linkResult.hasDeceptivePath ? 'Detected' : 'Standard'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Domain Age</span>
                      <span className="font-semibold text-neutral-400 font-mono">— (Restricted)</span>
                    </div>
                  </div>

                  {/* Red flags */}
                  {linkResult.redFlags.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200/70 text-xs space-y-1">
                      <span className="font-semibold text-red-700 block">Why this verdict was assigned:</span>
                      <ul className="list-disc list-inside text-neutral-700 space-y-0.5">
                        {linkResult.redFlags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Guidance */}
                  <div className="pt-2 border-t border-neutral-200/70 text-xs space-y-1">
                    <span className="font-semibold text-neutral-800 block">Safety Guidance:</span>
                    <ul className="list-disc list-inside text-neutral-600 space-y-0.5">
                      {linkResult.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      )}

      {/* ACTIVE WORKSPACE: TOOL 5 - Network Security Inspector */}
      {selectedTool === 'network_inspect' && (
        <article className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTool(null)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Tools Directory
          </button>

          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0 mt-0.5">
                <Wifi size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Network Security Inspector
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                    DEMO SIGNALS
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Evaluates network transport encryption, active VPN routing and captive hotspot exposure. Values shown come from the demo signal provider, not from your network.
                </p>
              </div>
            </div>

            <div className="bg-neutral-50/80 p-4 border border-neutral-200 rounded-2xl divide-y divide-neutral-200/70 text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2">
                <div>
                  <span className="font-semibold text-neutral-900 block">Wi-Fi Transport Encryption</span>
                  <span className="text-[11px] text-neutral-500">Protocol cipher standard (WPA2/WPA3)</span>
                </div>
                <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  WPA3 Enterprise (Secure)
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-semibold text-neutral-900 block">Active VPN Tunnel</span>
                  <span className="text-[11px] text-neutral-500">Virtual Private Network interface status</span>
                </div>
                <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Active (Encrypted)
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="font-semibold text-neutral-900 block">Captive Portal Detection</span>
                  <span className="text-[11px] text-neutral-500">Unencrypted public hotspot interceptor</span>
                </div>
                <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  None Detected
                </span>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* ACTIVE WORKSPACE: TOOL 6 - Permission Inspector */}
      {selectedTool === 'permission_inspect' && (
        <article className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTool(null)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Tools Directory
          </button>

          <div className="bg-white p-5 border border-[#E0DAD0] rounded-[22px] space-y-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0 mt-0.5">
                <Layers size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Application Permission Inspector
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                    DEMO SIGNALS
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Inspects high-risk permissions declared by installed applications. Values shown come from the demo signal provider, not from your device.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {appSignals.map((sig) => (
                <div key={sig.id} className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-900">{sig.id}</span>
                    <span className="font-mono text-neutral-500">{String(sig.value)}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block font-mono">Provenance: {sig.provenance}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      )}
    </div>
  );
};
