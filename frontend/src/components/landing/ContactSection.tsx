import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, MessageSquare, Github, Send } from 'lucide-react';

const socialLinks = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@codetogether.dev',
    href: 'mailto:support@codetogether.dev',
  },
  {
    icon: MessageSquare,
    label: 'Discord',
    value: 'Join our community',
    href: 'https://discord.gg/codetogether',
  },
  {
    icon: Github,
    label: 'GitHub',
    value: 'codetogether',
    href: 'https://github.com/codetogether',
  },
];

const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static UI - no backend integration yet
  };

  return (
    <section id="contact" className="relative z-10 py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          ref={ref}
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--fg-faint)] mb-3">
            Get in Touch
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--fg)] tracking-tight mb-4">
            Questions? <span className="ct-text-teal">We're listening.</span>
          </h2>
          <div className="mx-auto h-[2px] w-20 bg-gradient-to-r from-transparent via-[var(--teal)]/50 to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contact Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div>
              <Input
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="
                  bg-white/[0.03] border-white/[0.08] text-white placeholder:text-[#4a4f54]
                  rounded-xl h-11 focus:border-[#cfd3d6]/30 focus:ring-0
                  transition-colors duration-300
                "
                aria-label="Your name"
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="
                  bg-white/[0.03] border-white/[0.08] text-white placeholder:text-[#4a4f54]
                  rounded-xl h-11 focus:border-[#cfd3d6]/30 focus:ring-0
                  transition-colors duration-300
                "
                aria-label="Your email"
              />
            </div>
            <div>
              <textarea
                placeholder="Your message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="
                  w-full bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-[#4a4f54]
                  rounded-xl px-3 py-2 text-sm resize-none
                  focus:border-[#cfd3d6]/30 focus:outline-none focus:ring-0
                  transition-colors duration-300
                "
                aria-label="Your message"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl h-11 text-sm font-semibold text-[#04201b] border-0 transition-all duration-300 hover:brightness-110"
              style={{ background: "linear-gradient(100deg,var(--teal-bright),var(--teal))" }}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </motion.form>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center space-y-4"
          >
            {socialLinks.map((link, index) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="
                  group flex items-center gap-4 p-4
                  rounded-xl bg-white/[0.02] border border-white/[0.06]
                  hover:bg-white/[0.05] hover:border-white/[0.12]
                  transition-all duration-300
                "
                aria-label={`Contact via ${link.label}`}
              >
                <div className="
                  w-10 h-10 rounded-lg flex items-center justify-center
                  bg-white/[0.04] border border-white/[0.08]
                  group-hover:bg-white/[0.08] group-hover:border-white/[0.15]
                  transition-all duration-300
                ">
                  <link.icon className="w-4 h-4 text-[#cfd3d6] group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{link.label}</p>
                  <p className="text-xs text-[#6b7075] group-hover:text-[#8a8f94] transition-colors duration-300">
                    {link.value}
                  </p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
