import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, Video, X, Check,
  FileText, Pencil, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM",
];

interface MeetingBookingProps {
  creatorName: string;
  productName: string;
  sessionDuration?: number; // minutes
  className?: string;
}

export function MeetingBooking({ creatorName, productName, sessionDuration = 30, className = "" }: MeetingBookingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<"date" | "time" | "confirm" | "done">("date");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agenda, setAgenda] = useState("");

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [currentMonth]);

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6; // no weekends
  };

  const handleDateSelect = (day: number) => {
    if (isDateDisabled(day)) return;
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    
    // Create Google Calendar event link
    const date = selectedDate!;
    const [hours, minutes, period] = selectedTime!.match(/(\d+):(\d+)\s(AM|PM)/)!.slice(1);
    let h = parseInt(hours);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, parseInt(minutes));
    const end = new Date(start.getTime() + sessionDuration * 60 * 1000);
    
    const formatGCal = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Zniche Session: ${productName}`)}&dates=${formatGCal(start)}/${formatGCal(end)}&details=${encodeURIComponent(`Meeting with ${creatorName} about "${productName}"\n\nAttendee: ${name}\nEmail: ${email}\n\nAgenda: ${agenda || "General discussion"}\n\nBooked via Zniche`)}&add=${encodeURIComponent(email)}`;
    
    window.open(gcalUrl, "_blank");
    setStep("done");
    toast.success("Meeting request sent! Check Google Calendar.");
  };

  const reset = () => {
    setStep("date");
    setSelectedDate(null);
    setSelectedTime(null);
    setEmail("");
    setName("");
    setAgenda("");
    setIsOpen(false);
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <div className={className}>
      <Button
        variant="outline"
        className="rounded-xl gap-2 w-full border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <Calendar className="w-4 h-4 text-primary" />
        Book a Session
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-primary/20"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Book a Session</h3>
                    <p className="text-xs text-muted-foreground">{sessionDuration} min with {creatorName}</p>
                  </div>
                </div>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Steps indicator */}
              <div className="px-5 py-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  {["Date", "Time", "Confirm"].map((label, i) => {
                    const stepMap = ["date", "time", "confirm"];
                    const currentIdx = stepMap.indexOf(step);
                    const isActive = i === currentIdx;
                    const isDone = i < currentIdx || step === "done";
                    return (
                      <div key={label} className="flex items-center gap-2 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone ? "bg-accent text-accent-foreground" : isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {isDone ? <Check className="w-3 h-3" /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                        {i < 2 && <div className={`flex-1 h-px ${isDone ? "bg-accent" : "bg-border/50"}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5">
                {/* Date Selection */}
                {step === "date" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                      <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAYS.map((d) => (
                        <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {daysInMonth.map((day, i) => (
                        <div key={i}>
                          {day ? (
                            <button
                              onClick={() => handleDateSelect(day)}
                              disabled={isDateDisabled(day)}
                              className={`w-full aspect-square rounded-lg text-sm font-medium transition-all calendar-day ${
                                isDateDisabled(day)
                                  ? "text-muted-foreground/30 cursor-not-allowed"
                                  : selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth()
                                    ? "selected font-bold"
                                    : "hover:bg-primary/10 text-foreground"
                              }`}
                            >
                              {day}
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Selection */}
                {step === "time" && (
                  <div>
                    <button onClick={() => setStep("date")} className="text-xs text-primary hover:underline mb-4 flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" /> Change date
                    </button>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto">
                      {TIME_SLOTS.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            selectedTime === time
                              ? "bg-primary text-white border-primary"
                              : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmation  */}
                {step === "confirm" && (
                  <div className="space-y-4">
                    <button onClick={() => setStep("time")} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" /> Change time
                    </button>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {selectedTime} · {sessionDuration} minutes
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        Google Meet (link sent after booking)
                      </p>
                    </div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email *"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <textarea
                      value={agenda}
                      onChange={(e) => setAgenda(e.target.value)}
                      placeholder="What would you like to discuss? (optional)"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button onClick={handleConfirm} className="w-full rounded-xl gap-2 h-11 btn-shine">
                      <Calendar className="w-4 h-4" /> Add to Google Calendar
                    </Button>
                  </div>
                )}

                {/* Done */}
                {step === "done" && (
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4"
                    >
                      <Check className="w-8 h-8 text-accent" />
                    </motion.div>
                    <h3 className="text-lg font-bold mb-2">Session Booked! 🎉</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Check your Google Calendar for the event details. {creatorName} will confirm shortly.
                    </p>
                    <Button variant="outline" className="rounded-xl" onClick={reset}>Close</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MEETING NOTES COMPONENT
   ═══════════════════════════════════════════ */

interface MeetingNote {
  id: string;
  date: string;
  title: string;
  content: string;
  clientName: string;
}

export function MeetingNotes({ className = "" }: { className?: string }) {
  const [notes, setNotes] = useState<MeetingNote[]>([
    {
      id: "1",
      date: new Date().toISOString(),
      title: "Onboarding Session",
      content: "Discussed product goals, target audience, and pricing strategy. Client wants to focus on Excel tutorials for beginners.",
      clientName: "Sample Client",
    },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newClient, setNewClient] = useState("");

  const startEdit = (note: MeetingNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = (id: string) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, content: editContent } : n));
    setEditingId(null);
    toast.success("Note saved!");
  };

  const addNote = () => {
    if (!newTitle.trim()) return;
    const note: MeetingNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      title: newTitle,
      content: newContent,
      clientName: newClient || "Client",
    };
    setNotes((prev) => [note, ...prev]);
    setNewTitle("");
    setNewContent("");
    setNewClient("");
    setShowNew(false);
    toast.success("Meeting note added!");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Meeting Notes
        </h3>
        <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs" onClick={() => setShowNew(!showNew)}>
          <Pencil className="w-3 h-3" /> New Note
        </Button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-xl p-4 space-y-3 mb-3">
              <input
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="Client name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none"
              />
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Meeting title *"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:border-primary focus:outline-none"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Notes, key points, action items..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button size="sm" className="rounded-lg text-xs gap-1" onClick={addNote} disabled={!newTitle.trim()}>
                  <Save className="w-3 h-3" /> Save Note
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {notes.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No meeting notes yet. Add one after your next session!
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold">{note.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {note.clientName} · {new Date(note.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={() => editingId === note.id ? saveEdit(note.id) : startEdit(note)}>
                  {editingId === note.id ? <Save className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                </Button>
              </div>
              {editingId === note.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-primary/30 bg-background text-sm resize-none focus:border-primary focus:outline-none"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
