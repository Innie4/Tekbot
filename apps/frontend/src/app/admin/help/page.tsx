'use client';

export default function AdminHelpPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Admin Help</h1>
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">How can we help you?</h2>
        <ul className="list-disc ml-4 space-y-4">
          <li>
            <strong>Dashboard Overview:</strong> Learn how to use analytics, manage appointments, payments, and messages.
          </li>
          <li>
            <strong>Managing Users:</strong> Add, edit, or remove users and assign roles for your organization.
          </li>
          <li>
            <strong>Settings:</strong> Configure your business profile, integrations, and notification preferences.
          </li>
          <li>
            <strong>Support:</strong> Contact our support team for technical issues or onboarding help.
          </li>
        </ul>
        <div className="mt-8 text-center">
          <p>Need more help? <a href="mailto:support@tekassist.com" className="text-blue-400 underline">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
}
