const Footer = () => (
  <footer className="relative z-10 border-t border-white/[0.06] py-10 px-4">
    <div className="container mx-auto max-w-5xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: "linear-gradient(160deg, rgba(78,201,176,0.22), rgba(255,107,94,0.14))",
              border: "1px solid rgba(78,201,176,0.3)",
            }}
          >
            <span className="font-bold text-[10px]" style={{ color: "var(--teal-bright)" }}>&lt;/&gt;</span>
          </div>
          <span className="text-sm font-medium text-[var(--fg-dim)]">
            code<span style={{ color: "var(--teal-bright)" }}>together</span>
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6" aria-label="Footer navigation">
          <a
            href="#features"
            className="text-xs text-[#4a4f54] hover:text-[#8a8f94] transition-colors duration-300"
          >
            Features
          </a>
          <a
            href="#contact"
            className="text-xs text-[#4a4f54] hover:text-[#8a8f94] transition-colors duration-300"
          >
            Contact
          </a>
          <a
            href="https://github.com/codetogether"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4a4f54] hover:text-[#8a8f94] transition-colors duration-300"
          >
            GitHub
          </a>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-[#3a3f44]">
          &copy; {new Date().getFullYear()} CodeTogether
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
