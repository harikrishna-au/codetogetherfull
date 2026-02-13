const Footer = () => (
  <footer className="relative z-10 border-t border-white/[0.06] py-10 px-4">
    <div className="container mx-auto max-w-5xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <span className="text-[#cfd3d6] font-bold text-[10px]">&lt;/&gt;</span>
          </div>
          <span className="text-sm font-medium text-[#6b7075]">codetogether</span>
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
