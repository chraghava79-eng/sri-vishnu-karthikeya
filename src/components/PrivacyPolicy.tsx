import { motion } from 'motion/react';
import { ChevronLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_LOGO } from '../constants';

export default function PrivacyPolicy() {
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter italic">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-2xl mx-auto space-y-8 text-gray-600 leading-relaxed">
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">1. Data Collection</h3>
          <p>
            FEAR collects minimal personal data necessary to provide our neural resilience protocol:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Neural Baseline:</strong> Your self-calibrated fear percentages by topic.</li>
            <li><strong>Usage Data:</strong> Tasks completed, streaks, and progress metrics.</li>
            <li><strong>Session Activity:</strong> Non-personal analytics about app interaction (can be opted out).</li>
            <li><strong>Account Info:</strong> Your display name and email (provided voluntarily via Google Login).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">2. Use of Information</h3>
          <p>
            Your data is used exclusively to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Personalize your exposure therapy journey.</li>
            <li>Track your progress and resilience growth.</li>
            <li>Provide AI-driven coaching insights via the AI Coach.</li>
            <li>Improve the FEAR protocol through anonymous usage patterns.</li>
          </ul>
          <p className="font-bold text-gray-900">We do not sell your personal information to third parties.</p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">3. Transparency & Control</h3>
          <p>
            You have full control over your data within the "Privacy Settings" section of your profile:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>View & Export:</strong> You can view and download a copy of your neural data.</li>
            <li><strong>Edit Profile:</strong> You can recalibrate your fear baseline at any time.</li>
            <li><strong>Analytics Opt-out:</strong> You can choose to stop sharing anonymous usage data.</li>
            <li><strong>Data Deletion:</strong> You can permanently delete your account and all associated data.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">4. Data Security</h3>
          <p>
            We implement industry-standard encryption and security protocols to protect your neural data. All communication between your device and our servers is encrypted using SSL/TLS.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">5. AI Processing</h3>
          <p>
            Our AI Coach utilizes advanced language models to process your inputs. While these models are designed for privacy, we recommend not sharing highly sensitive personal identifiers in your chat sessions.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">6. Your Rights</h3>
          <p>
            You have the right to access, correct, or delete your data at any time. You can manage your profile settings or contact support for data deletion requests.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">7. Children's Privacy</h3>
          <p>
            Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">8. Changes to this Policy</h3>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
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
