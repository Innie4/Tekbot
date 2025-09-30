import DashboardLayout from '@/components/admin/dashboard-layout';
import UserManagement from '@/components/admin/user-management';

export default function UsersPage() {
  return (
    <DashboardLayout>
      <UserManagement />
    </DashboardLayout>
  );
}