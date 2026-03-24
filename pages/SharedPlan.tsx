import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSharedPlan, respondToSharedPlan } from '../services/api';
import type { SharedPlan as SharedPlanType, SharedPlanResponse } from '../types';
import { Users, ThumbsUp, ThumbsDown, Send, Check, CalendarDays } from 'lucide-react';

const SharedPlan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<(SharedPlanType & { responses: SharedPlanResponse[]; menuItems: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Response form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [dietary, setDietary] = useState('');
  const [notes, setNotes] = useState('');
  const [votes, setVotes] = useState<Record<string, 'up' | 'down'>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchSharedPlan(id)
      .then(setPlan)
      .catch(() => setError('Plan not found or has expired.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = (itemId: string, vote: 'up' | 'down') => {
    setVotes(prev => {
      if (prev[itemId] === vote) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: vote };
    });
  };

  const handleSubmit = async () => {
    if (!id || !name) return;
    setSubmitting(true);
    try {
      await respondToSharedPlan(id, {
        respondentName: name,
        respondentEmail: email || undefined,
        headcount,
        dietaryPreferences: dietary || undefined,
        itemVotes: Object.keys(votes).length > 0 ? votes : undefined,
        notes: notes || undefined,
      });
      setSubmitted(true);
    } catch {
      alert('Failed to submit response.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading shared plan...</div>;
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>;
  if (!plan) return null;

  const totalHeadcount = plan.responses.reduce((sum, r) => sum + r.headcount, 0);

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Response Submitted!</h2>
        <p className="text-gray-400">Thanks {name}! The host will see your preferences.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">{plan.title}</h1>
        {plan.eventDate && (
          <p className="text-gray-400 flex items-center justify-center gap-2 mt-2">
            <CalendarDays size={16} />
            {new Date(plan.eventDate).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">Hosted by {plan.hostName}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
        <span className="flex items-center gap-1"><Users size={14} /> {plan.responses.length} responses</span>
        <span>{totalHeadcount} guests total</span>
      </div>

      {plan.status === 'finalized' && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 text-center text-yellow-400 text-sm">
          This plan has been finalized. No more responses accepted.
        </div>
      )}

      {/* Menu Items to Vote On */}
      {plan.menuItems && plan.menuItems.length > 0 && plan.status === 'open' && (
        <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800">
          <h3 className="text-white font-bold mb-3">Vote on the Menu</h3>
          <div className="space-y-2">
            {plan.menuItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">${item.price}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(item.id, 'up')}
                    className={`p-2 rounded-lg transition ${votes[item.id] === 'up' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-green-400'}`}
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    onClick={() => handleVote(item.id, 'down')}
                    className={`p-2 rounded-lg transition ${votes[item.id] === 'down' ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-400 hover:text-red-400'}`}
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSVP Form */}
      {plan.status === 'open' && (
        <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800 space-y-4">
          <h3 className="text-white font-bold">RSVP</h3>
          <input placeholder="Your Name *" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500" />
          <input placeholder="Email (optional)" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500" />
          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-sm">How many attending?</label>
            <input type="number" min={1} value={headcount} onChange={e => setHeadcount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-center" />
          </div>
          <input placeholder="Dietary requirements" value={dietary} onChange={e => setDietary(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500" />
          <textarea placeholder="Any notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none" />
          <button
            onClick={handleSubmit} disabled={!name || submitting}
            className="w-full py-3 bg-bbq-red text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={16} /> {submitting ? 'Sending...' : 'Submit Response'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SharedPlan;
