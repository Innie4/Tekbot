'use client';

import React, { useMemo, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/api-client';

const SECTIONS = ["Leads", "Appointments", "Payments", "Messages", "Analytics"];

const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState("Leads");

  // Sorting/filtering states
  const [apptSort, setApptSort] = useState("asc");
  const [apptFilter, setApptFilter] = useState("");
  const [paySort, setPaySort] = useState("asc");
  const [payFilter, setPayFilter] = useState("");
  const [msgSort, setMsgSort] = useState("asc");
  const [msgFilter, setMsgFilter] = useState("");

  const tenantId = useMemo(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('tenant-id') : null;
    } catch {
      return null;
    }
  }, []);

  const { data: apptData = [], isFetching: apptLoading } = useQuery({
    queryKey: ['appointments', tenantId || 'default'],
    queryFn: () => api.get<any[]>('/appointments'),
  });

  const { data: payData = [], isFetching: payLoading } = useQuery({
    queryKey: ['payments', tenantId || 'default'],
    queryFn: () => api.get<any[]>('/payments'),
  });

  const { data: msgData = [], isFetching: msgLoading } = useQuery({
    queryKey: ['notifications', tenantId || 'default'],
    queryFn: () => api.get<any[]>('/notifications'),
  });

  // Mirror data into local state to reuse existing sorting/filtering logic without larger refactor
  React.useEffect(() => {
    setAppointments(apptData);
  }, [apptData]);
  React.useEffect(() => {
    setPayments(payData);
  }, [payData]);
  React.useEffect(() => {
    setMessages(msgData);
  }, [msgData]);

  // Sorting/filtering logic
  const sortedAppointments = [...appointments]
    .filter(a => apptFilter ? (a.title?.toLowerCase().includes(apptFilter.toLowerCase()) || a.id?.toString().includes(apptFilter)) : true)
    .sort((a, b) => apptSort === "asc" ? String(a.title || a.id).localeCompare(String(b.title || b.id)) : String(b.title || b.id).localeCompare(String(a.title || a.id)));

  const sortedPayments = [...payments]
    .filter(p => payFilter ? (p.amount?.toString().includes(payFilter) || p.id?.toString().includes(payFilter)) : true)
    .sort((a, b) => paySort === "asc" ? (a.amount || 0) - (b.amount || 0) : (b.amount || 0) - (a.amount || 0));

  const sortedMessages = [...messages]
    .filter(m => msgFilter ? (m.text?.toLowerCase().includes(msgFilter.toLowerCase()) || m.message?.toLowerCase().includes(msgFilter.toLowerCase())) : true)
    .sort((a, b) => msgSort === "asc" ? String(a.text || a.message || a.id).localeCompare(String(b.text || b.message || b.id)) : String(b.text || b.message || b.id).localeCompare(String(a.text || a.message || a.id)));

  // Add analytics calculations
  const totalAppointments = appointments.length;
  const totalPayments = payments.length;
  const totalPaymentAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalMessages = messages.length;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">TekAssist Admin Dashboard</h1>
      {/* Section navigation tabs */}
      <div className="flex justify-center mb-8 gap-4">
        {SECTIONS.map(section => (
          <button
            key={section}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${activeSection === section ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Leads Section */}
        {activeSection === "Leads" && (
          <section className="bg-gray-800 rounded-xl shadow p-6 col-span-2 text-white">
            <h2 className="text-xl font-semibold mb-4">Leads</h2>
            <div className="h-40 overflow-y-auto">{/* Leads data will go here */}</div>
          </section>
        )}
        {/* Appointments Section */}
        {activeSection === "Appointments" && (
          <section className="bg-gray-800 rounded-xl shadow p-6 col-span-2 text-white">
            <h2 className="text-xl font-semibold mb-4">Appointments</h2>
            <div className="flex items-center mb-2 gap-2">
              <input
                type="text"
                placeholder="Filter by title or ID"
                value={apptFilter}
                onChange={e => setApptFilter(e.target.value)}
                className="border rounded px-2 py-1 bg-gray-900 text-white"
              />
              <button
                className={`px-2 py-1 rounded ${apptSort === "asc" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
                onClick={() => setApptSort(apptSort === "asc" ? "desc" : "asc")}
              >
                Sort {apptSort === "asc" ? "↑" : "↓"}
              </button>
            </div>
            <div className="h-40 overflow-y-auto">
              {apptLoading && <span className="text-gray-400">Loading...</span>}
              {sortedAppointments.length === 0 ? (
                <span className="text-gray-400">No appointments found.</span>
              ) : (
                <ul>
                  {sortedAppointments.map((appt, idx) => (
                    <li key={idx} className="mb-2">
                      {appt.title || appt.id || JSON.stringify(appt)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
        {/* Payments Section */}
        {activeSection === "Payments" && (
          <section className="bg-gray-800 rounded-xl shadow p-6 col-span-2 text-white">
            <h2 className="text-xl font-semibold mb-4">Payments</h2>
            <div className="flex items-center mb-2 gap-2">
              <input
                type="text"
                placeholder="Filter by amount or ID"
                value={payFilter}
                onChange={e => setPayFilter(e.target.value)}
                className="border rounded px-2 py-1 bg-gray-900 text-white"
              />
              <button
                className={`px-2 py-1 rounded ${paySort === "asc" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
                onClick={() => setPaySort(paySort === "asc" ? "desc" : "asc")}
              >
                Sort {paySort === "asc" ? "↑" : "↓"}
              </button>
            </div>
            <div className="h-40 overflow-y-auto">
              {payLoading && <span className="text-gray-400">Loading...</span>}
              {sortedPayments.length === 0 ? (
                <span className="text-gray-400">No payments found.</span>
              ) : (
                <ul>
                  {sortedPayments.map((pay, idx) => (
                    <li key={idx} className="mb-2">
                      {pay.amount ? `$${pay.amount}` : pay.id || JSON.stringify(pay)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
        {/* Messages Section */}
        {activeSection === "Messages" && (
          <section className="bg-gray-800 rounded-xl shadow p-6 col-span-2 text-white">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <div className="flex items-center mb-2 gap-2">
              <input
                type="text"
                placeholder="Filter by text or ID"
                value={msgFilter}
                onChange={e => setMsgFilter(e.target.value)}
                className="border rounded px-2 py-1 bg-gray-900 text-white"
              />
              <button
                className={`px-2 py-1 rounded ${msgSort === "asc" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
                onClick={() => setMsgSort(msgSort === "asc" ? "desc" : "asc")}
              >
                Sort {msgSort === "asc" ? "↑" : "↓"}
              </button>
            </div>
            <div className="h-40 overflow-y-auto">
              {msgLoading && <span className="text-gray-400">Loading...</span>}
              {sortedMessages.length === 0 ? (
                <span className="text-gray-400">No messages found.</span>
              ) : (
                <ul>
                  {sortedMessages.map((msg, idx) => (
                    <li key={idx} className="mb-2">
                      {msg.text || msg.message || msg.id || JSON.stringify(msg)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
        {/* Analytics Section */}
        {activeSection === "Analytics" && (
          <section className="bg-gray-800 rounded-xl shadow p-6 col-span-2 text-white">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Appointments:</span>
                <span className="text-blue-400 font-bold">{totalAppointments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Payments:</span>
                <span className="text-green-400 font-bold">{totalPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Payment Amount:</span>
                <span className="text-green-400 font-bold">${totalPaymentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Messages:</span>
                <span className="text-purple-400 font-bold">{totalMessages}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
