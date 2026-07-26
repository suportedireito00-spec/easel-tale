import React, { useState } from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { Clock, Video, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const getDaysInMonth = () => {
  const days: (number | null)[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);
  return days;
};

export default function Slide04CalendarBooking() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const days = getDaysInMonth();
  const today = new Date().getDate();
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  if (isBooked) {
    return (
      <DarkSlide bloom="full" pager="—">
        <div className="flex flex-col justify-center items-center h-full px-24 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
            style={{ background: 'linear-gradient(135deg,#4E93FF,#E91E90)' }}>
            <Check className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-6xl font-semibold mb-5 tracking-tight">Demo booked.</h2>
          <p className="text-2xl text-white/70 mb-10">
            {monthName.split(' ')[0]} {selectedDate} · {selectedTime}
          </p>
          <button
            onClick={() => { setIsBooked(false); setSelectedDate(null); setSelectedTime(null); }}
            className="px-7 py-3.5 rounded-full bg-white/10 border border-white/15 text-lg hover:bg-white/15"
          >
            Book another
          </button>
        </div>
      </DarkSlide>
    );
  }

  return (
    <DarkSlide bloom="corner" pager="—">
      <div className="flex flex-col h-full px-24 py-20">
        <div className="mb-8">
          <p className="text-xl uppercase tracking-[0.3em] mb-4 font-medium" style={{ color: '#7DD3FC' }}>
            Live · Mini-app inside a slide
          </p>
          <h2 className="text-5xl font-semibold tracking-tight leading-tight">
            Pick a date. Pick a time. Book it. From the slide.
          </h2>
        </div>

        <div className="flex-1 grid grid-cols-[1fr_300px] gap-8">
          {/* Calendar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div className="flex items-center justify-between mb-6">
              <button className="p-2 rounded-lg hover:bg-white/10"><ChevronLeft className="w-5 h-5 text-white/60" /></button>
              <h3 className="text-2xl font-semibold tracking-tight">{monthName}</h3>
              <button className="p-2 rounded-lg hover:bg-white/10"><ChevronRight className="w-5 h-5 text-white/60" /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-sm font-medium text-white/40 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => (
                <button
                  key={i}
                  disabled={day === null || day < today}
                  onClick={() => day && day >= today && setSelectedDate(day)}
                  className={cn(
                    'h-14 rounded-lg text-base font-medium flex items-center justify-center',
                    day === null && 'invisible',
                    day !== null && day < today && 'text-white/20 cursor-not-allowed',
                    day !== null && day >= today && 'text-white/80 hover:bg-white/10 cursor-pointer',
                    day === today && 'ring-1 ring-white/40',
                    selectedDate === day && day !== null && 'text-white',
                  )}
                  style={selectedDate === day && day !== null
                    ? { background: 'linear-gradient(135deg,#E91E90,#4E93FF)' }
                    : {}}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-white/40" />
              <span className="text-base text-white/60 uppercase tracking-wider">Times</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {timeSlots.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  disabled={!selectedDate}
                  className={cn(
                    'w-full py-3.5 rounded-xl text-base font-medium',
                    !selectedDate && 'bg-white/[0.03] text-white/25 cursor-not-allowed',
                    selectedDate && selectedTime !== t && 'bg-white/[0.06] hover:bg-white/10 text-white/85',
                    selectedTime === t && 'text-white',
                  )}
                  style={selectedTime === t
                    ? { background: 'linear-gradient(90deg,#4E93FF,#E91E90)' }
                    : {}}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedDate && selectedTime && setIsBooked(true)}
              disabled={!selectedDate || !selectedTime}
              className={cn(
                'mt-4 w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-base',
                (!selectedDate || !selectedTime) && 'bg-white/5 text-white/30 cursor-not-allowed',
              )}
              style={selectedDate && selectedTime
                ? { background: 'linear-gradient(90deg,#4E93FF,#E91E90,#FF6A3D)', color: '#fff' }
                : {}}
            >
              <Video className="w-5 h-5" />
              Confirm booking
            </button>
          </div>
        </div>
      </div>
    </DarkSlide>
  );
}
