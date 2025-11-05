'use client';

import { useState } from 'react';

export default function AdminBantuanPage() {
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  const helpCategories = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'tests', name: 'Test Management', icon: '📝' },
    { id: 'payments', name: 'Payments & Billing', icon: '💳' },
    { id: 'reports', name: 'Reports & Analytics', icon: '📊' },
    { id: 'settings', name: 'Settings & Configuration', icon: '⚙️' },
  ];

  const helpContent: Record<string, any> = {
    'getting-started': {
      title: 'Getting Started',
      items: [
        { q: 'How do I set up my institution?', a: 'Navigate to the Settings page and complete your institution profile with contact information and preferences.' },
        { q: 'How do I invite team members?', a: 'Go to Team Management, click "Add Team Member", and enter their email address. They will receive an invitation to join.' },
        { q: 'How do I create tests for customers?', a: 'From the Tests section, click "Create Test" and follow the guided setup to configure test parameters and questions.' },
      ],
    },
    'users': {
      title: 'User Management',
      items: [
        { q: 'How do I add new customers?', a: 'Go to Customers page and click "Add Customer" or use the "Bulk Import" feature to import multiple customers from Excel/CSV.' },
        { q: 'How do I assign tests to customers?', a: 'Select customers from the customer list and click "Assign Test" to choose which test they should take.' },
        { q: 'Can I organize customers with tags?', a: 'Yes! Use custom tags to organize customers by department, group, or any category that suits your needs.' },
      ],
    },
    'tests': {
      title: 'Test Management',
      items: [
        { q: 'What types of tests are available?', a: 'Saintara offers personality tests, team assessments, and custom evaluations tailored to your needs.' },
        { q: 'How do I view test results?', a: 'Go to the Results section to view detailed reports, analytics, and export data for all completed tests.' },
        { q: 'Can I customize test questions?', a: 'Custom test creation is available for premium plans. Contact support to enable this feature.' },
      ],
    },
    'payments': {
      title: 'Payments & Billing',
      items: [
        { q: 'What payment methods are accepted?', a: 'We accept credit cards, bank transfers, and digital wallets through Stripe and Xendit payment gateways.' },
        { q: 'How do I process refunds?', a: 'Navigate to Transactions, find the payment, and click "Issue Refund". The customer will be notified automatically.' },
        { q: 'Where can I view payment history?', a: 'All payment transactions are available in the Keuangan (Financial) section with detailed filters and export options.' },
      ],
    },
    'reports': {
      title: 'Reports & Analytics',
      items: [
        { q: 'What reports are available?', a: 'Access user analytics, test performance, financial reports, and custom analytics from the Reports dashboard.' },
        { q: 'Can I export reports?', a: 'Yes! All reports can be exported to PDF, Excel, or CSV format for further analysis or sharing.' },
        { q: 'How often is data updated?', a: 'Analytics data is updated in real-time. Financial reports are updated within 24 hours of transaction completion.' },
      ],
    },
    'settings': {
      title: 'Settings & Configuration',
      items: [
        { q: 'How do I update my institution profile?', a: 'Go to Settings (Pengaturan) and update your institution name, contact details, and preferences.' },
        { q: 'Can I customize branding?', a: 'Premium plans include custom branding options including logo, colors, and email templates.' },
        { q: 'How do I manage permissions?', a: 'Team member permissions can be configured from the Team Management page by editing individual user roles.' },
      ],
    },
  };

  const currentContent = helpContent[selectedCategory];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="mt-2 text-sm text-gray-600">
          Find answers to common questions and learn how to use Saintara effectively
        </p>
      </div>

      {/* Contact Support Card */}
      <div className="mb-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-indigo-900">Need additional help?</h3>
            <p className="mt-2 text-sm text-indigo-700">
              Our support team is here to help! Contact us at{' '}
              <a href="mailto:support@saintara.com" className="font-medium underline">
                support@saintara.com
              </a>{' '}
              or through our live chat during business hours.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="space-y-1" role="navigation" aria-label="Help categories">
            {helpCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label={`View help for ${category.name}`}
                aria-current={selectedCategory === category.id ? 'page' : undefined}
              >
                <span className="mr-2" aria-hidden="true">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentContent.title}</h2>

            <div className="space-y-6">
              {currentContent.items.map((item: any, index: number) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://docs.saintara.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 bg-white shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-900">Documentation</div>
                <div className="text-xs text-gray-500">Comprehensive guides</div>
              </div>
            </a>

            <a
              href="https://www.youtube.com/@saintara"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 bg-white shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <svg className="h-6 w-6 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-900">Video Tutorials</div>
                <div className="text-xs text-gray-500">Step-by-step guides</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
