"use client";
import React from 'react';
import DashboardLayout from '@/components/admin/dashboard-layout';
import MessagesPanel from '@/components/admin/messages-panel';

export default function AdminMessagesPage() {
  return (
    <DashboardLayout>
      <MessagesPanel />
    </DashboardLayout>
  );
}