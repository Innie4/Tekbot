export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Our Services</h1>
      <ul className="max-w-xl mx-auto space-y-6">
        <li className="bg-gray-800 rounded-xl shadow p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">AI Chatbot Integration</h2>
          <p>Automate customer support and lead generation with our advanced AI chatbots.</p>
        </li>
        <li className="bg-gray-800 rounded-xl shadow p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Multi-Channel Messaging</h2>
          <p>Engage customers on WhatsApp, SMS, and more with seamless integrations.</p>
        </li>
        <li className="bg-gray-800 rounded-xl shadow p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Appointment Scheduling</h2>
          <p>Streamline bookings and reminders for your business.</p>
        </li>
        <li className="bg-gray-800 rounded-xl shadow p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Payment Processing</h2>
          <p>Accept payments securely via Stripe and Paystack.</p>
        </li>
      </ul>
    </div>
  );
}
