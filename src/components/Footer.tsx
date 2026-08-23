import React from 'react';
import { UtensilsCrossed, Phone, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (section: string) => void;
  onOpenTrack: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenTrack,
}) => {
  return (
    <footer className="bg-[#1A1A1A] text-[#F3F2EE] border-t-2 border-[#1A1A1A] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-amber-300 flex items-center justify-center text-[#1A1A1A] font-bold shadow-[2px_2px_0px_0px_#FFFFFF]">
                <UtensilsCrossed className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-[#F3F2EE]">New Miami</span>
                <span className="text-xs bg-white/15 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold ml-1.5 border border-white/20">
                  Naivasha
                </span>
                <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Restaurant & Flame Grill</p>
              </div>
            </div>

            <p className="text-stone-300 text-xs leading-relaxed font-medium">
              Serving the authentic taste of Kenya and international culinary delights in Naivasha. Open daily for dine-in, takeaway, and fast home delivery.
            </p>

            <div className="flex items-center gap-2 text-stone-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs">M-Pesa Pochi: 0741775878</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Quick Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('menu')}
                  className="hover:text-amber-300 text-stone-300 font-medium transition cursor-pointer"
                >
                  Explore Food & Drink Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('reserve')}
                  className="hover:text-amber-300 text-stone-300 font-medium transition cursor-pointer"
                >
                  Book Table Reservation
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTrack}
                  className="hover:text-amber-300 text-stone-300 font-medium transition cursor-pointer"
                >
                  Live Order Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-amber-300 text-stone-300 font-medium transition cursor-pointer"
                >
                  About & Location
                </button>
              </li>
            </ul>
          </div>

          {/* Cuisines & Specialities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Our Specialities</h4>
            <ul className="space-y-1.5 text-stone-300 text-xs font-medium">
              <li>• Prime Mbuzi & Beef Nyama Choma</li>
              <li>• Fresh Lake Naivasha Tilapia Fish</li>
              <li>• Authentic Swahili Beef Pilau & Matoke</li>
              <li>• Gourmet Miami Burgers & Pastas</li>
              <li>• Hot Chai Masala & Special Dawa</li>
              <li>• Crispy Beef Samosas & Masala Chips</li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Contact & Hours</h4>
            <div className="space-y-2 text-xs text-stone-300 font-medium">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Naivasha, Nakuru County, Kenya</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href="tel:0741775878"
                  className="hover:text-amber-300 font-mono font-bold text-[#F3F2EE]"
                >
                  0741775878
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>8:00 AM – 11:00 PM Daily</span>
              </p>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/254741775878?text=Hello%20New%20Miami%20Restaurant"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#F3F2EE] hover:bg-white text-[#1A1A1A] font-bold px-3.5 py-1.5 rounded-lg border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#D97706] transition"
              >
                <span>WhatsApp 0741775878</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 mt-8 border-t border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-400 text-[11px] font-medium">
          <p>© {new Date().getFullYear()} New Miami Restaurant, Naivasha. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Crafted with pride in Naivasha, Kenya</span>
            <Heart className="w-3 h-3 text-amber-400 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
