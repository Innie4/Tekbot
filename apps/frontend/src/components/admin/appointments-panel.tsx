import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api/api-client';
import { Appointment, ApiError } from '../../lib/api/types';

const AppointmentsPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Appointment[]>('/appointments');
      setAppointments(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', apiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleRefresh = () => {
    fetchAppointments();
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Appointments</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Appointments</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Error loading appointments</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Appointments</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
            Schedule Appointment
          </button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.start_time);
                return (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.customer?.name || `Customer ID: ${appointment.customer_id}`}
                      </div>
                      {appointment.customer?.email && (
                        <div className="text-sm text-gray-500">{appointment.customer.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.service_id ? `Service ID: ${appointment.service_id}` : 'No service'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{date}</div>
                      <div className="text-sm text-gray-500">{time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* Calculate duration from start_time and end_time */}
                      {appointment.end_time ? 
                        `${Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60))} min` 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        Confirm
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPanel;
