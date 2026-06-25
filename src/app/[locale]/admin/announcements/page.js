"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Megaphone,
  Send,
  History,
  Trash2,
  Eye,
  Edit3,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Plus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminSearch from "@/components/admin/AdminSearch";

export default function AdminAnnouncementsPage() {
  const { user, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(null);

  // Table State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/announcements/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', message: `Broadcasted successfully to ${data.details.totalVendors} vendors!` });
        setTitle("");
        setContent("");
        fetchAnnouncements();
      } else {
        setStatus({ type: 'error', message: data.error || "Failed to send broadcast" });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "Connection error. Please try again." });
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedAnnouncement.id, title, content })
      });
      if (res.ok) {
        fetchAnnouncements();
        setSelectedAnnouncement(null);
        setIsEditing(false);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will also remove the message from all vendor inboxes.")) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (err) {
      alert("Failed to delete announcement");
    }
  };

  // Filtered & Paginated Data
  const filteredData = useMemo(() => {
    return announcements.filter(a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [announcements, searchQuery]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Announcements</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage official platform communication and track broadcast history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
            className="h-9 w-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>



      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left: Compose Form */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Plus size={16} className="text-[#800000]" />
              Compose Broadcast
            </h2>

            <form onSubmit={handleBroadcast} className="space-y-5">
              {status && (
                <div className={`p-4 rounded-lg flex items-start gap-3 border text-[13px] ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                  {status.type === 'success' ? <CheckCircle className="shrink-0" size={16} /> : <AlertCircle className="shrink-0" size={16} />}
                  <p>{status.message}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Announcement Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. System Maintenance Update"
                    className="w-full h-10 px-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Detailed Message</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000] transition-all resize-none"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <MessageSquare size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[13px] font-bold text-blue-900 mb-0.5">Local Chat Only</h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed">This broadcast will be sent directly to all merchants via the official Mahally Support chat.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending || !title || !content}
                className="w-full h-11 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                {sending ? "Processing..." : "Dispatch Broadcast"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: History Table */}
        <div className="xl:col-span-8 space-y-6">
          {/* Filters & Total Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pe-10 ps-4 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#800000] focus:border-[#800000]"
              />
            </div>
            <div className="text-xs font-semibold text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-full px-3.5 py-1 w-fit shadow-sm">
              Total Broadcasts: <span className="text-zinc-900 font-bold">{announcements.length}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-end border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Announcement</th>
                  <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Sent Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest text-start">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-zinc-300" size={24} />
                        <p className="text-xs text-zinc-400 font-medium">Fetching history...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-zinc-500 italic text-sm">
                      No announcements found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-zinc-900 line-clamp-1">{a.title}</p>
                            {a.editedAt && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-tighter rounded border border-amber-100">
                                Edited
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{a.content}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-900">{formatDate(a.createdAt)}</span>
                          <span className="text-[11px] text-zinc-400">{formatTime(a.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-start">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedAnnouncement(a); setIsEditing(false); }}
                            className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedAnnouncement(a); setIsEditing(true); setTitle(a.title); setContent(a.content); }}
                            className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-amber-600 hover:border-amber-200 transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-red-600 hover:border-red-200 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal View/Edit */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                {isEditing ? "Edit Broadcast" : "View Announcement"}
              </h3>
              <button onClick={() => { setSelectedAnnouncement(null); setIsEditing(false); }} className="p-2 hover:bg-zinc-200 rounded-full transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-10 px-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#800000]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Content</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#800000] resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full h-11 bg-[#800000] text-white rounded-lg text-sm font-bold hover:bg-[#600000] transition-all">
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-zinc-900 mb-2">{selectedAnnouncement.title}</h4>
                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(selectedAnnouncement.createdAt)}</span>
                      {selectedAnnouncement.editedAt && <span className="text-amber-600 flex items-center gap-1"><Clock size={14} /> Edited: {formatDate(selectedAnnouncement.editedAt)}</span>}
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap text-[15px] leading-relaxed border-t border-zinc-50 pt-4">
                    {selectedAnnouncement.content}
                  </div>

                  {/* Event Log */}
                  <div className="mt-8 pt-6 border-t border-zinc-100">
                    <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Activity Log</h5>
                    <div className="space-y-3">
                      {selectedAnnouncement.events?.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${ev.type === 'created' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-800">{ev.description}</span>
                              <span className="text-[10px] text-zinc-400">{formatDate(ev.timestamp)} at {formatTime(ev.timestamp)}</span>
                            </div>

                            {ev.from && ev.to && (
                              <div className="mt-1 p-2 bg-zinc-50 border border-zinc-100 rounded-lg text-[11px] space-y-1.5">
                                <div className="flex flex-col">
                                  <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">From:</span>
                                  <span className="text-zinc-500 line-through italic">{ev.from}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[#800000] font-bold uppercase text-[9px] tracking-widest">To:</span>
                                  <span className="text-zinc-900 font-medium">{ev.to}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
