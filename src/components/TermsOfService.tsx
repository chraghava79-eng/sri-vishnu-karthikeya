import { motion } from 'motion/react';
import { ChevronLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_LOGO } from '../constants';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white safe-top safe-bottom">
      <header className="p-6 flex items-center gap-4 border-b border-gray-100">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} className="w-10 h-10 object-cover rounded-xl shadow-lg" alt="FEAR" referrerPolicy="no-referrer" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Shield size={12} className="text-blue-600" />
              <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Legal</h2>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter italic">Terms of Service</h1>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-2xl mx-auto space-y-8 text-gray-600 leading-relaxed">
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h3>
          <p>
            By accessing or using the FEAR application ("the App"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this application.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">2. Medical Disclaimer</h3>
          <p className="font-bold text-gray-900 bg-blue-50 p-4 rounded-xl border border-blue-100">
            FEAR IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE. The App is intended for educational and self-improvement purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or mental health concern.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">3. User Accounts</h3>
          <p>
            To use certain features of the App, you must register for an account via Google Authentication. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">4. AI Coaching & Content</h3>
          <p>
            The App utilizes Artificial Intelligence (AI) to provide coaching insights and task generation. While we strive for accuracy, AI-generated content may occasionally be inaccurate or inappropriate. Users should use their own judgment when following AI-generated advice or tasks.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">5. Prohibited Conduct</h3>
          <p>
            You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the App for any illegal purpose or in violation of any local, state, national, or international law.</li>
            <li>Attempt to interfere with the proper working of the App.</li>
            <li>Reverse engineer, decompile, or disassemble any aspect of the App.</li>
            <li>Use the App to harass, abuse, or harm another person.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">6. Limitation of Liability</h3>
          <p>
            In no event shall FEAR, its developers, or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the App.
          </p>
        </section>

        <div className="pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Last Updated: April 8, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
