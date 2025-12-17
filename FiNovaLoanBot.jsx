import React, { useState } from 'react';
import { DollarSign, CheckCircle, XCircle, Calculator, Bot, X, MessageCircle, Phone, Volume2 } from 'lucide-react';

// FiNovaLoanBot - single-file React component preview
// Uses Tailwind classes for styling. Drop into a React app (Vite/CRA) with Tailwind + lucide-react installed.

export default function FiNovaLoanBot() {
  const [isBotOpen, setIsBotOpen] = useState(false);
  // For quick dev testing set 'form' here. Production: 'welcome'
  const [currentStep, setCurrentStep] = useState('welcome');
  const [formData, setFormData] = useState({
    name: '', age: '', phone: '', email: '', monthlyIncome: '',
    creditScore: '', employmentYears: '', existingLoans: '', loanAmount: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Keep a ref to the current utterance so we can stop it reliably
  const utteranceRef = React.useRef(null);

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const speakText = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // If something is already speaking, stop it first
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }

      // create utterance and keep a reference
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onstart = () => {
        setSpeaking(true);
      };
      utterance.onend = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setSpeaking(false);
    }
  };

  // Build a human-friendly summary of the full result + inputs for the voice reader
  const buildFullSummary = (res = result, data = formData) => {
    if (!res || !data) return '';
    const name = data.name || 'Applicant';
    const parts = [];
    parts.push(`${name}, here are your loan eligibility details.`);
    parts.push(`Eligibility: ${res.eligible ? 'Approved' : 'Not eligible'}.`);
    if (res.eligible) {
      parts.push(`Score: ${res.score} out of 100.`);
      parts.push(`Maximum eligible loan amount is rupees ${res.maxLoan.toLocaleString()}.`);
      parts.push(`Estimated monthly EMI (approx) is rupees ${res.emi.toLocaleString()}.`);
      parts.push(`Debt ratio is ${res.ratio} percent.`);
      parts.push(`Next steps: Submit documents, verification within 24 to 48 hours, final approval, then funds disbursed.`);
    } else {
      parts.push(`Reasons for ineligibility:`);
      res.reasons.forEach((r, i) => parts.push(`${i + 1}. ${r}.`));
      parts.push(`You can try lowering requested amount, improving credit score, or reducing existing monthly loans and reapply.`);
    }
    return parts.join(' ');
  };

  const validateAndSubmit = () => {
    console.log('validateAndSubmit called', formData); // debug
    const { name, age, phone, email, monthlyIncome, creditScore, employmentYears, existingLoans, loanAmount } = formData;
    if (!name || !age || !phone || !email || !monthlyIncome || !creditScore || !employmentYears || !existingLoans || !loanAmount) {
      alert('Please fill all required fields!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const income = parseFloat(monthlyIncome);
      const credit = parseInt(creditScore);
      const empYears = parseFloat(employmentYears);
      const loans = parseFloat(existingLoans);
      const amount = parseFloat(loanAmount);
      const ageNum = parseInt(age);

      let eligible = true;
      let reasons = [];
      let score = 0;

      if (ageNum < 21 || ageNum > 65) {
        eligible = false;
        reasons.push('Age must be between 21 and 65 years');
      } else score += 15;

      if (credit < 650) {
        eligible = false;
        reasons.push('Credit score below 650');
      } else if (credit >= 750) score += 30;
      else score += 20;

      if (income < 25000) {
        eligible = false;
        reasons.push('Income below ₹25,000');
      } else score += 20;

      const monthlyEMI = (amount * 0.01) / 12;
      const debtRatio = (loans + monthlyEMI) / income;

      if (debtRatio > 0.5) {
        eligible = false;
        reasons.push('Debt ratio exceeds 50%');
      } else score += 20;

      if (empYears < 1) {
        eligible = false;
        reasons.push('Need 1+ year employment');
      } else if (empYears >= 3) score += 15;
      else score += 10;

      const maxLoan = income * 0.5 * 12 * 20;
      if (amount > maxLoan) {
        eligible = false;
        reasons.push(`Exceeds max ₹${Math.floor(maxLoan).toLocaleString()}`);
      }

      const resultData = {
        eligible,
        reasons: eligible ? ['All criteria met', 'Good credit', 'Stable income', 'Employment verified'] : reasons,
        score: eligible ? score : 0,
        maxLoan: Math.floor(maxLoan),
        emi: Math.floor(monthlyEMI),
        ratio: (debtRatio * 100).toFixed(1)
      };

      setResult(resultData);
      setCurrentStep('result');
      setLoading(false);

      // Speak full detailed summary automatically after submission (short delay for UX)
      setTimeout(() => {
        const summary = buildFullSummary(resultData, formData);
        speakText(summary);
      }, 500);
    }, 1200);
  };

  const resetForm = () => {
    stopSpeaking();
    setFormData({ name: '', age: '', phone: '', email: '', monthlyIncome: '', creditScore: '', employmentYears: '', existingLoans: '', loanAmount: '' });
    setResult(null);
    setCurrentStep('welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-3xl shadow-2xl mb-6">
              <DollarSign className="w-20 h-20 text-white" />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">FiNova</h1>
            <p className="text-2xl md:text-3xl text-purple-200 font-light">Your Trusted Financial Partner</p>
            <p className="text-lg text-purple-300 mt-2">Smart Loans • Quick Approval • Best Rates</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12 px-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Approval</h3>
              <p className="text-purple-200 text-sm">Get results in minutes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl mb-3">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">100% Secure</h3>
              <p className="text-purple-200 text-sm">Bank-grade security</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-5xl mb-3">💰</div>
              <h3 className="text-xl font-semibold text-white mb-2">Best Rates</h3>
              <p className="text-purple-200 text-sm">From 8.5% p.a.</p>
            </div>
          </div>

          <button onClick={() => setIsBotOpen(true)} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-12 py-6 rounded-full text-xl font-bold shadow-2xl hover:shadow-yellow-500/50 transition-all transform hover:scale-105 inline-flex items-center gap-3">
            <Bot className="w-8 h-8" />
            Check Loan Eligibility Now
          </button>
        </div>
      </div>

      {!isBotOpen && (
        <button onClick={() => setIsBotOpen(true)} className="fixed bottom-8 right-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 p-5 rounded-full shadow-2xl z-50 hover:scale-110 transition-transform">
          <Bot className="w-8 h-8" />
        </button>
      )}

      {isBotOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative flex-shrink-0">
              <button onClick={() => { stopSpeaking(); setIsBotOpen(false); setTimeout(resetForm, 300); }} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><Bot className="w-10 h-10" /></div>
                <div>
                  <h2 className="text-2xl font-bold">FiNova Loan Bot</h2>
                  <p className="text-purple-200">AI-Powered Eligibility Checker</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {currentStep === 'welcome' && (
                <div className="text-center space-y-6 max-w-3xl mx-auto">
                  <div className="text-7xl">👋</div>
                  <h3 className="text-3xl font-bold text-gray-800">Welcome to FiNova!</h3>
                  <p className="text-lg text-gray-600">Check your loan eligibility in minutes</p>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 text-left">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Requirements:
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Personal info (Name, Age, Contact)</li>
                      <li>• Employment details</li>
                      <li>• Financial info (Income, Credit score)</li>
                      <li>• Desired loan amount</li>
                    </ul>
                  </div>
                  <button onClick={() => setCurrentStep('form')} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all">
                    Get Started 🚀
                  </button>
                </div>
              )}

              {currentStep === 'form' && (
                <div className="space-y-6 max-w-5xl mx-auto pb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Loan Application Form</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* inputs (same as yours) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                      <input type="number" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="30" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                      <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="+91 9876543210" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Income (₹) *</label>
                      <input type="number" value={formData.monthlyIncome} onChange={(e) => handleInputChange('monthlyIncome', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="50000" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Credit Score *</label>
                      <input type="number" value={formData.creditScore} onChange={(e) => handleInputChange('creditScore', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="700" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Years *</label>
                      <input type="number" step="0.5" value={formData.employmentYears} onChange={(e) => handleInputChange('employmentYears', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus;border-transparent outline-none" placeholder="2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Existing Monthly Loans (₹) *</label>
                      <input type="number" value={formData.existingLoans} onChange={(e) => handleInputChange('existingLoans', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="10000" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Requested Loan Amount (₹) *</label>
                      <input type="number" value={formData.loanAmount} onChange={(e) => handleInputChange('loanAmount', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="500000" />
                    </div>
                  </div>

                  <div style={{ height: 90 }} />
                </div>
              )}

              {currentStep === 'result' && result && (
                <div className="space-y-6 max-w-5xl mx-auto pb-8">
                  <div className={`rounded-2xl p-8 ${result.eligible ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      {result.eligible ? <CheckCircle className="w-16 h-16 text-green-600" /> : <XCircle className="w-16 h-16 text-red-600" />}
                      <div>
                        <h2 className={`text-3xl font-bold ${result.eligible ? 'text-green-800' : 'text-red-800'}`}>
                          {result.eligible ? '🎉 Approved!' : '⚠️ Not Eligible'}
                        </h2>
                        <p className={result.eligible ? 'text-green-600' : 'text-red-600'}>{formData.name}, {result.eligible ? "approved!" : "needs review"}</p>
                      </div>
                    </div>
                    {result.eligible && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl"><p className="text-sm text-gray-600">Score</p><p className="text-3xl font-bold text-green-600">{result.score}/100</p></div>
                        <div className="bg-white p-4 rounded-xl"><p className="text-sm text-gray-600">Max Loan</p><p className="text-2xl font-bold text-blue-600">₹{result.maxLoan.toLocaleString()}</p></div>
                        <div className="bg-white p-4 rounded-xl"><p className="text-sm text-gray-600">EMI</p><p className="text-2xl font-bold text-purple-600">₹{result.emi.toLocaleString()}</p></div>
                      </div>
                    )}
                  </div>

                  <div className="bg-indigo-50 rounded-2xl p-6 border-2 border-indigo-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">{result.eligible ? '✅ Details' : '❌ Reasons'}</h3>
                      <button onClick={() => speaking ? stopSpeaking() : speakText(buildFullSummary(result, formData))} className={`flex items-center gap-2 px-4 py-2 rounded-full ${speaking ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
                        <Volume2 className={`w-4 h-4 ${speaking ? 'animate-pulse' : ''}`} />
                        {speaking ? 'Stop' : 'Read'}
                      </button>
                    </div>
                    <ul className="space-y-3">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="flex gap-3 bg-white p-4 rounded-xl">
                          <span className="text-xl">{result.eligible ? '✓' : '✗'}</span>
                          <span className="text-gray-700">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex-shrink-0 bg-white rounded-b-3xl">
              {currentStep === 'form' && (
                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
                  <button onClick={validateAndSubmit} disabled={loading} type="button" className="md:col-span-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Calculator className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Calculator className="w-5 h-5" /> Submit & Check Eligibility</>}
                  </button>
                </div>
              )}

              {currentStep === 'result' && result && (
                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
                  <button onClick={resetForm} className="md:col-span-3 w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700">
                    New Application
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
