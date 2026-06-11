import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Translations } from '../types';

interface ContactFormProps {
  t: Translations;
}

export default function ContactForm({ t }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errMessage, setErrMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus('sending');
    setErrMessage('');

    try {
      // Create a reference with a custom alphanumeric ID compatible with isValidId check
      const messagesRef = collection(db, 'messages');
      const customDocRef = doc(messagesRef); // Auto-generates random alphanumeric ID
      const messageId = customDocRef.id;

      const payload = {
        id: messageId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        status: 'unread',
        createdAt: serverTimestamp() // server-authoritative timestamp triggers request.time
      };

      // Write strictly to the collection
      await setDoc(customDocRef, payload);

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setStatus('error');
      try {
        handleFirestoreError(err, OperationType.CREATE, 'messages');
      } catch (logErr: any) {
        setErrMessage(logErr.message);
      }
    }
  };

  return (
    <div className="border border-neutral-200 dark:border-white/10 p-8 bg-neutral-50 dark:bg-[#080808] max-w-2xl mx-auto rounded-none transition-colors duration-300">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-4 h-4 text-black dark:text-zinc-400" />
        <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-black dark:text-white">
          {t.contact}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" id="form-contact">
        
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 font-semibold">
            {t.contactName}
          </label>
          <input
            id="contact-name"
            type="text"
            required
            maxLength={100}
            disabled={status === 'sending'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white dark:bg-[#050505] border border-neutral-200 dark:border-white/10 focus:border-black dark:focus:border-white px-4 py-2.5 text-xs outline-none transition-all duration-300 text-black dark:text-white font-mono uppercase tracking-wider"
            placeholder="John Doe"
          />
        </div>

        {/* Email input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 font-semibold">
            {t.contactEmail}
          </label>
          <input
            id="contact-email"
            type="email"
            required
            maxLength={150}
            disabled={status === 'sending'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white dark:bg-[#050505] border border-neutral-200 dark:border-white/10 focus:border-black dark:focus:border-white px-4 py-2.5 text-xs outline-none transition-all duration-300 text-black dark:text-white font-mono"
            placeholder="johndoe@example.com"
          />
        </div>

        {/* Text message */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-message" className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 font-semibold">
            {t.contactMsg}
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            maxLength={5000}
            disabled={status === 'sending'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white dark:bg-[#050505] border border-neutral-200 dark:border-white/10 focus:border-black dark:focus:border-white px-4 py-3 text-xs outline-none transition-all duration-300 text-black dark:text-white resize-none font-sans"
            placeholder="..."
          />
        </div>

        {/* Submit Button */}
        <button
          id="btn-contact-submit"
          type="submit"
          disabled={status === 'sending'}
          className={`w-full py-3 text-[10px] font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-2 border transition-all ${
            status === 'sending'
              ? 'bg-[#121212] border-white/5 text-zinc-650 cursor-not-allowed'
              : 'bg-black border-black text-white hover:bg-neutral-900 dark:bg-white dark:border-white dark:text-black dark:hover:bg-neutral-100 font-semibold'
          }`}
        >
          {status === 'sending' ? (
            <span>{t.contactSending}</span>
          ) : (
            <>
              <Send className="w-3 h-3" />
              <span>{t.contactSubmit}</span>
            </>
          )}
        </button>

        {/* Status Responses */}
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-4 border border-green-200 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-mono"
            id="contact-success-box"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{t.contactSuccess}</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-4 border border-red-205 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-mono"
            id="contact-error-box"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold">Ocurrió un error al enviar el mensaje.</p>
              {errMessage && <p className="text-[10px] opacity-85 mt-1 max-h-[80px] overflow-auto">{errMessage}</p>}
            </div>
          </motion.div>
        )}

      </form>
    </div>
  );
}
