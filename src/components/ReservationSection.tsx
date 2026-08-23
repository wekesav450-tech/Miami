import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Phone, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reservation, UserProfile } from '../types';
import { api } from '../services/api';

interface ReservationSectionProps {
  user: UserProfile | null;
  onReservationCreated?: (res: Reservation) => void;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({
  user,
  onReservationCreated,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [reservationDate, setReservationDate] = useState(today);
  const [reservationTime, setReservationTime] = useState('13:00');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [seatingArea, setSeatingArea] = useState('Terrace Garden Lake Breeze');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  React.useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.full_name);
      if (!customerPhone) setCustomerPhone(user.phone);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Please enter a valid Kenyan phone number (e.g. 0741775878)');
      return;
    }

    if (!reservationDate || reservationDate < today) {
      setErrorMessage('Reservation date cannot be in the past');
      return;
    }

    if (!reservationTime) {
      setErrorMessage('Please select a reservation time');
      return;
    }

    if (guestsCount < 1 || guestsCount > 50) {
      setErrorMessage('Number of guests must be between 1 and 50');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullNotes = seatingArea
        ? `[Seating: ${seatingArea}] ${specialRequests}`.trim()
        : specialRequests;

      const res = await api.reservations.create({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        number_of_guests: guestsCount,
        special_requests: fullNotes || undefined,
      });

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }

      setConfirmedReservation(res.reservation);
      if (onReservationCreated) {
        onReservationCreated(res.reservation);
      }
    } catch (err: any) {
      console.error('Reservation booking error:', err);
      setErrorMessage(err.message || 'Failed to submit reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reserve" className="py-16 bg-[#F3F2EE] text-[#1A1A1A] border-b-2 border-[#1A1A1A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider mb-3 shadow-[2px_2px_0px_0px_#1A1A1A]">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Table Reservations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Reserve Your Dining Experience
          </h2>
          <p className="mt-3 text-stone-700 text-sm sm:text-base font-medium">
            Whether for an intimate dinner, family gathering, birthday feast or business lunch in Naivasha. We hold your table and prepare a memorable feast.
          </p>
        </div>

        {/* Reservation Card */}
        <div className="max-w-4xl mx-auto bg-white border-2 border-[#1A1A1A] rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_#1A1A1A]">
          {confirmedReservation ? (
            <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 border-2 border-[#1A1A1A] text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#1A1A1A]">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                  Reservation Received
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">
                  Table Booked for {confirmedReservation.customer_name}
                </h3>
                <p className="text-sm text-stone-700 mt-2">
                  We look forward to hosting you at New Miami Restaurant on{' '}
                  <strong className="text-[#1A1A1A] bg-[#F3F2EE] px-2 py-0.5 rounded border border-[#1A1A1A]">{confirmedReservation.reservation_date}</strong> at{' '}
                  <strong className="text-[#1A1A1A] bg-[#F3F2EE] px-2 py-0.5 rounded border border-[#1A1A1A]">{confirmedReservation.reservation_time}</strong> for{' '}
                  <strong className="text-[#1A1A1A] bg-[#F3F2EE] px-2 py-0.5 rounded border border-[#1A1A1A]">{confirmedReservation.number_of_guests} guest(s)</strong>.
                </p>
              </div>

              <div className="bg-[#F3F2EE] p-4 rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between text-stone-700">
                  <span className="font-semibold">Booking Reference:</span>
                  <span className="font-mono text-[#1A1A1A] font-extrabold">{confirmedReservation.id}</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span className="font-semibold">Status:</span>
                  <span className="capitalize font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-800">
                    {confirmedReservation.status}
                  </span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span className="font-semibold">Contact Phone:</span>
                  <span className="text-[#1A1A1A] font-mono font-bold">{confirmedReservation.customer_phone}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/254741775878?text=Hello%20New%20Miami%20Restaurant,%20I%20have%20booked%20a%20table%20for%20${encodeURIComponent(confirmedReservation.customer_name)}%20on%20${confirmedReservation.reservation_date}%20at%20${confirmedReservation.reservation_time}%20for%20${confirmedReservation.number_of_guests}%20guests.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp Host Team (0741775878)</span>
                </a>

                <button
                  onClick={() => setConfirmedReservation(null)}
                  className="w-full sm:w-auto bg-white hover:bg-stone-100 text-[#1A1A1A] font-bold py-3 px-6 rounded-xl text-xs border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] transition cursor-pointer"
                >
                  Make Another Reservation
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-[#1A1A1A] block mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mary Wanjiku"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#F3F2EE] focus:bg-white border-2 border-[#1A1A1A] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-[#1A1A1A] block mb-1.5">
                    Kenyan Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0741775878"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#F3F2EE] focus:bg-white border-2 border-[#1A1A1A] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-[#1A1A1A] block mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="mary@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#F3F2EE] focus:bg-white border-2 border-[#1A1A1A] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none transition"
                  />
                </div>

                {/* Reservation Date */}
                <div>
                  <label className="text-xs font-bold text-[#1A1A1A] block mb-1.5">
                    Reservation Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      min={today}
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      className="w-full bg-[#F3F2EE] focus:bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Reservation Time */}
                <div>
                  <label className="text-xs font-bold text-[#1A1A1A] block mb-1.5">
                    Reservation Time *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-full bg-[#F3F2EE] focus:bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none transition"
                    >
                      <option value="11:30">11:30 AM (Lunch)</option>
                      <option value="12:00">12:00 PM (Lunch)</option>
                      <option value="12:30">12:30 PM (Lunch)</option>
                      <option value="13:00">01:00 PM (Lunch)</option>
                      <option value="13:30">01:30 PM (Lunch)</option>
                      <option value="14:00">02:00 PM (Lunch)</option>
                      <option value="17:00">05:00 PM (Early Dinner)</option>
                      <option value="18:00">06:00 PM (Dinner)</option>
                      <option value="19:00">07:00 PM (Dinner)</option>
                      <option value="20:00">08:00 PM (Dinner)</option>
                      <option value="21:00">09:00 PM (Late Dinner)</option>
                    </select>
                  </div>
                </div>

                {/* Guests Count */}
                <div>
                  <label className="text-xs font-bold text-[#1A1A1A] block mb-1.5">
                    Number of Guests *
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#F3F2EE] focus:bg-white border-2 border-[#1A1A1A] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none transition"
                    />
                  </div>
                </div>

              </div>

              {/* Seating Preference */}
              <div>
                <label className="text-xs font-bold text-[#1A1A1A] block mb-2">
                  Seating Area Preference:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    'Lake Breeze Terrace',
                    'Main Dining Hall',
                    'Garden Pergola',
                    'VIP Private Booth',
                  ].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSeatingArea(area)}
                      className={`p-2.5 rounded-xl border-2 border-[#1A1A1A] text-xs font-bold transition cursor-pointer text-center shadow-[2px_2px_0px_0px_#1A1A1A] ${
                        seatingArea === area
                          ? 'bg-[#1A1A1A] text-[#F3F2EE]'
                          : 'bg-[#F3F2EE] text-[#1A1A1A] hover:bg-stone-200'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="text-xs font-bold text-[#1A1A1A] block mb-1.5">
                  Special Requests / Celebrations (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Celebrating a birthday anniversary, need high chair for child, quiet business table..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-[#F3F2EE] focus:bg-white border-2 border-[#1A1A1A] rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none transition"
                />
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2 text-center">
                <button
                  id="submit-table-reservation-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[240px] bg-[#1A1A1A] hover:bg-stone-800 disabled:opacity-50 text-[#F3F2EE] font-bold py-3.5 px-8 rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#D97706] hover:shadow-[2px_2px_0px_0px_#D97706] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mx-auto"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Reserving Table...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Confirm Table Reservation</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-stone-600 font-medium mt-2">
                  Instant reservation confirmation. Need urgent booking? Call{' '}
                  <strong className="text-[#1A1A1A]">0741775878</strong>
                </p>
              </div>

            </form>
          )}
        </div>

      </div>
    </section>
  );
};
