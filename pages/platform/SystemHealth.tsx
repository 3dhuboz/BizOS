import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, RefreshCw, CheckCircle, AlertTriangle, XCircle, CreditCard, Mail, MessageSquare, Brain, Globe, Key, Save, Eye, EyeOff, Shield } from 'lucide-react';
import { fetchSystemHealth } from '../../services/platformApi';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/Toast';

interface HealthData {
  tables: Record<string, number>;
  latencyMs: number;
  timestamp: string;
}

const SystemHealth: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const { toast } = useToast();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Local form state for platform-level settings
  const [devApiKey, setDevApiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [squareAppId, setSquareAppId] = useState(settings.squareApplicationId || '');
  const [squareToken, setSquareToken] = useState(settings.squareAccessToken || '');
  const [squareLocationId, setSquareLocationId] = useState(settings.squareLocationId || '');
  const [squareEnv, setSquareEnv] = useState<string>(settings.squareEnvironment || 'sandbox');
  const [emailProvider, setEmailProvider] = useState<string>(settings.emailSettings?.provider || 'sendgrid');
  const [emailApiKey, setEmailApiKey] = useState(settings.emailSettings?.apiKey || '');
  const [emailFrom, setEmailFrom] = useState(settings.emailSettings?.fromEmail || '');
  const [emailFromName, setEmailFromName] = useState(settings.emailSettings?.fromName || '');
  const [emailAdmin, setEmailAdmin] = useState(settings.emailSettings?.adminEmail || '');
  const [smsAccountSid, setSmsAccountSid] = useState(settings.smsSettings?.accountSid || '');
  const [smsAuthToken, setSmsAuthToken] = useState(settings.smsSettings?.authToken || '');
  const [smsFrom, setSmsFrom] = useState(settings.smsSettings?.fromNumber || '');
  const [smsAdmin, setSmsAdmin] = useState(settings.smsSettings?.adminPhone || '');
  const [fbAppId, setFbAppId] = useState(settings.facebookAppId || '');
  const [fbPageToken, setFbPageToken] = useState(settings.facebookPageAccessToken || '');

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHealth(); }, []);

  const toggleSecret = (key: string) => setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        openrouterApiKey: openrouterKey || undefined,
        squareApplicationId: squareAppId || undefined,
        squareAccessToken: squareToken || undefined,
        squareLocationId: squareLocationId || undefined,
        squareEnvironment: squareEnv as any,
        squareConnected: !!(squareAppId && squareToken),
        emailSettings: {
          enabled: !!(emailApiKey && emailFrom),
          provider: emailProvider as any,
          apiKey: emailApiKey || undefined,
          fromEmail: emailFrom,
          fromName: emailFromName,
          adminEmail: emailAdmin,
        },
        smsSettings: {
          enabled: !!(smsAccountSid && smsAuthToken),
          accountSid: smsAccountSid,
          authToken: smsAuthToken,
          fromNumber: smsFrom,
          adminPhone: smsAdmin,
        },
        smsConnected: !!(smsAccountSid && smsAuthToken),
        facebookAppId: fbAppId || undefined,
        facebookPageAccessToken: fbPageToken || undefined,
        facebookConnected: !!(fbAppId && fbPageToken),
      } as any);
      toast('Settings saved', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  const getLatencyStatus = (ms: number) => {
    if (ms < 50) return { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Excellent', icon: CheckCircle };
    if (ms < 200) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Moderate', icon: AlertTriangle };
    return { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'High', icon: XCircle };
  };

  const latency = health?.latencyMs ?? 0;
  const status = getLatencyStatus(latency);
  const StatusIcon = status.icon;
  const tableEntries = health?.tables ? Object.entries(health.tables).sort(([a], [b]) => a.localeCompare(b)) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">System & Integrations</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* ── Database Health ── */}
      <Section icon={Database} title="Database Health" subtitle="Cloudflare D1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon size={16} className={status.color} />
            <span className={`text-sm font-medium ${status.color}`}>{status.label} — {latency}ms</span>
          </div>
          <button onClick={loadHealth} disabled={loading} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
          <div className={`h-full rounded-full ${latency < 50 ? 'bg-green-500' : latency < 200 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, (latency / 500) * 100)}%` }} />
        </div>
        <details className="text-xs">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-300">Table row counts ({tableEntries.length} tables)</summary>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-1">
            {tableEntries.map(([table, count]) => (
              <div key={table} className="flex justify-between px-2 py-1 bg-gray-800/30 rounded">
                <span className="text-gray-400 font-mono">{table}</span>
                <span className="text-white font-medium">{count}</span>
              </div>
            ))}
          </div>
        </details>
        {health?.timestamp && (
          <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1"><Clock size={10} /> {new Date(health.timestamp).toLocaleString()}</p>
        )}
      </Section>

      {/* ── AI Configuration ── */}
      <Section icon={Brain} title="AI Configuration" subtitle="OpenRouter / Gemini">
        <SecretField label="OpenRouter API Key" value={openrouterKey} onChange={setOpenrouterKey}
          placeholder="sk-or-..." show={showSecrets['ai']} toggle={() => toggleSecret('ai')} />
        <p className="text-[10px] text-gray-500 mt-1">Powers AI chat, social content generation, image generation, and smart scheduling. Get a key from <a href="https://openrouter.ai/keys" target="_blank" className="text-purple-400 hover:underline">openrouter.ai</a></p>
      </Section>

      {/* ── Payment Gateway ── */}
      <Section icon={CreditCard} title="Payment Gateway" subtitle="Square">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Application ID" value={squareAppId} onChange={setSquareAppId} placeholder="sq0idp-..." />
          <Field label="Location ID" value={squareLocationId} onChange={setSquareLocationId} placeholder="L..." />
        </div>
        <SecretField label="Access Token" value={squareToken} onChange={setSquareToken}
          placeholder="EAAAl..." show={showSecrets['sq']} toggle={() => toggleSecret('sq')} />
        <div className="flex items-center gap-3 mt-2">
          <label className="text-xs text-gray-400">Environment:</label>
          <select value={squareEnv} onChange={e => setSquareEnv(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs">
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${squareAppId && squareToken ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
            {squareAppId && squareToken ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </Section>

      {/* ── Email ── */}
      <Section icon={Mail} title="Email" subtitle="Transactional email service">
        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-gray-400">Provider:</label>
          <select value={emailProvider} onChange={e => setEmailProvider(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs">
            <option value="sendgrid">SendGrid</option>
            <option value="smtp">AWS SES</option>
            <option value="mailgun">Mailgun</option>
          </select>
        </div>
        <SecretField label="API Key" value={emailApiKey} onChange={setEmailApiKey}
          placeholder="SG...." show={showSecrets['email']} toggle={() => toggleSecret('email')} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <Field label="From Email" value={emailFrom} onChange={setEmailFrom} placeholder="noreply@yourbiz.com" />
          <Field label="From Name" value={emailFromName} onChange={setEmailFromName} placeholder="Your Business" />
          <Field label="Admin Email" value={emailAdmin} onChange={setEmailAdmin} placeholder="admin@yourbiz.com" />
        </div>
      </Section>

      {/* ── SMS ── */}
      <Section icon={MessageSquare} title="SMS" subtitle="MessageBird / Twilio">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Account SID" value={smsAccountSid} onChange={setSmsAccountSid} placeholder="AC..." />
          <SecretField label="Auth Token" value={smsAuthToken} onChange={setSmsAuthToken}
            placeholder="Token" show={showSecrets['sms']} toggle={() => toggleSecret('sms')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Field label="From Number" value={smsFrom} onChange={setSmsFrom} placeholder="+61400000000" />
          <Field label="Admin Phone" value={smsAdmin} onChange={setSmsAdmin} placeholder="+61400000000" />
        </div>
      </Section>

      {/* ── Social Media ── */}
      <Section icon={Globe} title="Social Media" subtitle="Facebook / Instagram">
        <Field label="Facebook App ID" value={fbAppId} onChange={setFbAppId} placeholder="123456789..." />
        <SecretField label="Page Access Token" value={fbPageToken} onChange={setFbPageToken}
          placeholder="EAAG..." show={showSecrets['fb']} toggle={() => toggleSecret('fb')} />
      </Section>

      {/* ── Platform Security ── */}
      <Section icon={Shield} title="Platform Security" subtitle="Authentication keys">
        <p className="text-xs text-gray-400 mb-2">These are set as Cloudflare Pages environment variables, not in the database.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">DEV_API_KEY</p>
            <p className="text-xs text-gray-300 font-mono">Set in CF env vars</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">CLERK_PUBLISHABLE_KEY</p>
            <p className="text-xs text-gray-300 font-mono">Set in CF env vars</p>
          </div>
        </div>
      </Section>
    </div>
  );
};

// ── Reusable Components ──

const Section = ({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-800/50 flex items-center gap-3">
      <Icon size={16} className="text-purple-400" />
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-[10px] text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div>
    <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:border-purple-500 outline-none transition placeholder-gray-600" />
  </div>
);

const SecretField = ({ label, value, onChange, placeholder, show, toggle }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; show: boolean; toggle: () => void }) => (
  <div>
    <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">{label}</label>
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-white text-xs focus:border-purple-500 outline-none transition placeholder-gray-600 font-mono" />
      <button type="button" onClick={toggle} className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

export default SystemHealth;
