import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchAvailability, createBooking } from '../services/api';
import { CalendarCheck, Users, Package, CreditCard, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = ['Date', 'Service', 'Details', 'Confirm'];

const Booking: React.FC = () => {
  const { settings, menu, getLabel, businessConfig } = useApp();
  const [step, setStep] = useState(0);
  const [availability, setAvailability] = useState<{ date: string; available: boolean }[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(10);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  useEffect(() => {
    setLoadingDates(true);
    fetchAvailability(currentMonth)
      .then(setAvailability)
      .catch(() => setAvailability([]))
      .finally(() => setLoadingDates(false));
  }, [currentMonth]);

  const packages = settings.cateringPackages || [];
  const selectedPkg = packages.find(p => p.id === selectedPackage);
  const estimatedTotal = selectedPkg ? selectedPkg.price * guestCount : 0;
  const depositAmount = Math.ceil(estimatedTotal * 0.3);

  const navigateMonth = (delta: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const booking = await createBooking({
        customerName, customerEmail, customerPhone,
        eventDate: selectedDate,
        guestCount,
        packageId: selectedPackage || undefined,
        packageName: selectedPkg?.name,
        estimatedTotal,
        depositAmount,
        notes,
      });
      setBookingRef(booking.id);
      setBookingComplete(true);
    } catch (err) {
      alert('Booking failed. Please try again.');
    }
    setSubmitting(false);
  };

  if (bookingComplete) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{getLabel('booking')} Confirmed!</h2>
        <p className="text-gray-400 mb-4">Reference: <span className="text-bbq-gold font-mono">{bookingRef.slice(0, 8).toUpperCase()}</span></p>
        <p className="text-sm text-gray-500">We'll be in touch to confirm details. Check your email for confirmation.</p>
      </div>
    );
  }

  // Calendar rendering
  const [year, month] = currentMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Book {settings.businessName || 'Us'}</h1>
      <p className="text-gray-400 text-sm mb-8">Select a date, choose your {getLabel('package').toLowerCase()}, and lock it in.</p>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-bbq-red text-white' : 'bg-gray-800 text-gray-500'}`}>
              {i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-bbq-red' : 'bg-gray-800'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Date Selection */}
      {step === 0 && (
        <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronLeft size={18} /></button>
            <h3 className="text-white font-bold">{monthName}</h3>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-800 rounded-lg"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const avail = availability.find(a => a.date === dateStr);
              const isAvailable = avail?.available !== false;
              const isPast = new Date(dateStr) < new Date(new Date().toDateString());
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  disabled={isPast || !isAvailable}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-2 rounded-lg text-sm font-medium transition ${
                    isSelected ? 'bg-bbq-red text-white' :
                    isPast || !isAvailable ? 'text-gray-700 cursor-not-allowed' :
                    'text-white hover:bg-gray-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <button onClick={() => setStep(1)} className="mt-4 w-full py-3 bg-bbq-red text-white font-bold rounded-lg hover:bg-red-700 transition">
              Continue
            </button>
          )}
        </div>
      )}

      {/* Step 2: Package Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-white font-bold">Choose a {getLabel('package')}</h3>
          <div className="grid gap-3">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`text-left p-4 rounded-xl border transition ${
                  selectedPackage === pkg.id ? 'border-bbq-red bg-red-900/20' : 'border-gray-800 bg-gray-900/60 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-bold">{pkg.name}</p>
                    <p className="text-gray-400 text-sm mt-1">{pkg.description}</p>
                  </div>
                  <p className="text-bbq-gold font-bold">${pkg.price}/head</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="text-gray-400 text-sm">Guest count:</label>
            <input
              type="number" min={1} value={guestCount}
              onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-center"
            />
          </div>
          {selectedPackage && (
            <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
              <span className="text-gray-400">Estimated total:</span>
              <span className="text-white font-bold ml-2">${estimatedTotal.toFixed(2)}</span>
              <span className="text-gray-500 ml-2">(30% deposit: ${depositAmount.toFixed(2)})</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition">Back</button>
            <button onClick={() => setStep(2)} disabled={!selectedPackage} className="flex-1 py-3 bg-bbq-red text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50">Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-white font-bold">Your Details</h3>
          <input placeholder="Full Name" value={customerName} onChange={e => setCustomerName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500" />
          <input placeholder="Email" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500" />
          <input placeholder="Phone" type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500" />
          <textarea placeholder="Special requests or notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition">Back</button>
            <button onClick={() => setStep(3)} disabled={!customerName || !customerEmail}
              className="flex-1 py-3 bg-bbq-red text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50">Review</button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-white font-bold">Review Your {getLabel('booking')}</h3>
          <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800 space-y-3 text-sm">
            <Row label="Date" value={new Date(selectedDate).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
            <Row label={getLabel('package')} value={selectedPkg?.name || '—'} />
            <Row label="Guests" value={String(guestCount)} />
            <Row label="Total" value={`$${estimatedTotal.toFixed(2)}`} />
            <Row label="Deposit (30%)" value={`$${depositAmount.toFixed(2)}`} highlight />
            <hr className="border-gray-800" />
            <Row label="Name" value={customerName} />
            <Row label="Email" value={customerEmail} />
            {customerPhone && <Row label="Phone" value={customerPhone} />}
            {notes && <Row label="Notes" value={notes} />}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition">Back</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              {submitting ? 'Submitting...' : `Confirm ${getLabel('booking')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}</span>
    <span className={highlight ? 'text-bbq-gold font-bold' : 'text-white'}>{value}</span>
  </div>
);

export default Booking;
