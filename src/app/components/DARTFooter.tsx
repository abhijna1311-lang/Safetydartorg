import { Mail } from 'lucide-react';

export function DARTFooter() {
  return (
    <footer className="bg-slate-100/60 border-t border-slate-200/60 mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 sm:gap-12">
          {/* Left Side: Contact Information */}
          <div className="flex-1">
            <h3 className="text-sm text-[#00205B] font-semibold font-['Poppins'] mb-3">
              Questions or need help with accident cases?
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700 font-['Poppins']">
                <Mail className="w-4 h-4 text-[#007DBA] flex-shrink-0" />
                <span>
                  Contact DART Safety & Security:{' '}
                  <a 
                    href="mailto:safety@dart.org" 
                    className="text-[#007DBA] hover:text-[#00205B] underline focus:outline-none focus:ring-2 focus:ring-[#FFCD00] rounded"
                  >
                    safety@dart.org
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 font-['Poppins']">
                <Mail className="w-4 h-4 text-[#007DBA] flex-shrink-0" />
                <span>
                  For technical issues, contact IT Service Desk:{' '}
                  <a 
                    href="mailto:itservicedesk@dart.org" 
                    className="text-[#007DBA] hover:text-[#00205B] underline focus:outline-none focus:ring-2 focus:ring-[#FFCD00] rounded"
                  >
                    itservicedesk@dart.org
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Copyright and Links */}
          <div className="flex flex-col sm:items-end sm:text-right">
            <p className="text-sm text-slate-700 font-['Poppins'] mb-2">
              © 2024 Dallas Area Rapid Transit
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-['Poppins']">
              <a 
                href="#" 
                className="hover:text-[#007DBA] underline focus:outline-none focus:ring-2 focus:ring-[#FFCD00] rounded"
              >
                Privacy
              </a>
              <span className="text-slate-400">·</span>
              <a 
                href="#" 
                className="hover:text-[#007DBA] underline focus:outline-none focus:ring-2 focus:ring-[#FFCD00] rounded"
              >
                Terms
              </a>
              <span className="text-slate-400">·</span>
              <a 
                href="#" 
                className="hover:text-[#007DBA] underline focus:outline-none focus:ring-2 focus:ring-[#FFCD00] rounded"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}