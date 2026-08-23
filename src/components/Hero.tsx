import React from 'react';
import { Flame, Utensils, Calendar, Phone, Award, Clock, Truck, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onExploreMenu: () => void;
  onBookTable: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreMenu, onBookTable }) => {
  return (
    <section className="relative bg-[#F3F2EE] text-[#1A1A1A] overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b-2 border-[#1A1A1A]">
      {/* Background Decor Geometric Grid */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold tracking-wide uppercase shadow-[2px_2px_0px_0px_#1A1A1A]">
              <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Authentic Kenyan & Flame Grills • Naivasha, Kenya</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-serif font-bold text-[#1A1A1A] tracking-tight leading-tight">
              Savor the Finest Flavors at{' '}
              <span className="underline decoration-amber-500 decoration-4 underline-offset-4">
                New Miami Restaurant
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              From succulent flame-roasted <strong className="text-[#1A1A1A] font-bold">Mbuzi Nyama Choma</strong> and fresh{' '}
              <strong className="text-[#1A1A1A] font-bold">Lake Naivasha Tilapia</strong> to sizzling continental chef specials.
              Enjoy dine-in serenity or fast doorstep delivery across Naivasha.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                id="hero-order-online-btn"
                onClick={onExploreMenu}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1A1A1A] hover:bg-stone-800 text-[#F3F2EE] font-bold text-base border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#D97706] hover:shadow-[2px_2px_0px_0px_#D97706] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Utensils className="w-5 h-5 text-amber-400" />
                <span>Order Online Now</span>
              </button>

              <button
                id="hero-book-table-btn"
                onClick={onBookTable}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-stone-50 text-[#1A1A1A] font-bold text-base border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-5 h-5 text-amber-600" />
                <span>Book a Table</span>
              </button>

              <a
                id="hero-call-whatsapp-btn"
                href="https://wa.me/254741775878?text=Hello%20New%20Miami%20Restaurant,%20I%20would%20like%20to%20place%20an%20order"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] hover:shadow-[2px_2px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-200" />
                <span>0741775878</span>
              </a>
            </div>

            {/* Feature Highlights Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t-2 border-[#1A1A1A]/20">
              <div className="flex items-center gap-2.5 text-left bg-white p-3 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                <Truck className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Naivasha Delivery</p>
                  <p className="text-[11px] text-stone-600">Flat KES 150 Rate</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-left bg-white p-3 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">M-Pesa Pochi</p>
                  <p className="text-[11px] text-emerald-700 font-mono font-bold">0741775878</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-left bg-white p-3 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Open 7 Days</p>
                  <p className="text-[11px] text-stone-600">8:00 AM – 11:00 PM</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-left bg-white p-3 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Lake Fresh</p>
                  <p className="text-[11px] text-stone-600">Fresh Local Cuts</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Image Showcase Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Featured Plate Image */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_#1A1A1A] group bg-white">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80"
                  alt="New Miami Restaurant Sizzling Nyama Choma"
                  className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Floating Tag over image */}
                <div className="absolute bottom-4 left-4 right-4 bg-white border-2 border-[#1A1A1A] p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#1A1A1A] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 block">Chef's Signature</span>
                    <h4 className="text-sm font-bold text-[#1A1A1A]">Prime Mbuzi Nyama Choma (1 Kg)</h4>
                    <p className="text-xs text-stone-600">Served with kachumbari & white ugali</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#1A1A1A] font-mono bg-[#F3F2EE] px-2 py-0.5 rounded border border-[#1A1A1A]">KES 1,600</span>
                    <span className="block text-[10px] text-stone-600 mt-0.5">Fresh on order</span>
                  </div>
                </div>
              </div>

              {/* Secondary Floating Lake Naivasha Badge */}
              <div className="absolute -top-4 -right-4 bg-white border-2 border-[#1A1A1A] p-3 rounded-xl shadow-[4px_4px_0px_0px_#1A1A1A] hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 border border-[#1A1A1A] text-amber-800 flex items-center justify-center font-bold">
                  🐟
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Lake Naivasha Fresh</p>
                  <p className="text-[11px] text-amber-800 font-semibold">Deep Fried Tilapia Stew</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
