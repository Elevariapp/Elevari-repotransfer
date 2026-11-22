import React from 'react';

interface WhatsAppButtonProps {
  className?: string;
  label?: string;
  phoneNumber?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  className = '',
  label = 'Talk to AI Concierge on WhatsApp',
  phoneNumber = '+573232688534',
}) => {
  const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#25D366] text-white text-sm font-semibold rounded-full shadow-lg hover:bg-[#1EBE55] transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 ${className}`}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 1 2.55 8.47A19.5 19.5 0 0 1 16.92 22" />
      </svg>
      <span>{label}</span>
    </a>
  );
};

export default WhatsAppButton;